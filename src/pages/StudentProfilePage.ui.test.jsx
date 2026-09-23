import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import StudentProfilePage from "./StudentProfilePage";

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("../supabaseClient", () => ({
  supabase: supabaseMock,
}));

afterEach(() => cleanup());

beforeEach(() => {
  supabaseMock.from.mockReset();
});

function orderedResult(data) {
  const result = Promise.resolve({ data, error: null });
  result.order = vi.fn(() => result);
  return result;
}

function withQueryClient(children) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

test("edits gender without clearing existing notes or status flags", async () => {
  supabaseMock.from.mockImplementation(() => ({
    select: vi.fn(() => ({ eq: vi.fn(() => orderedResult([])) })),
  }));
  const handleUpdateStudent = vi.fn().mockResolvedValue(true);
  render(withQueryClient(
    <MemoryRouter initialEntries={["/students/student-1"]}>
      <Routes>
        <Route path="/students/:studentId" element={
          <StudentProfilePage
            students={[{ id: "student-1", class_id: "class-1", first_name: "Alex", last_name: "Silva", gender: "Male", notes: "Keep this note", is_participating_well: true, needs_help: true, missing_homework: true }]}
            classes={[{ id: "class-1", name: "Year 3" }]}
            subjects={[]} attendanceSessions={[]} attendanceEntries={[]}
            handleUpdateStudent={handleUpdateStudent}
          />
        } />
      </Routes>
    </MemoryRouter>
  ));
  fireEvent.click(screen.getByRole("button", { name: "Edit student" }));
  expect(screen.getByLabelText("Gender").value).toBe("Male");
  fireEvent.change(screen.getByLabelText("Gender"), { target: { value: "Non-binary" } });
  fireEvent.click(screen.getByRole("button", { name: "Done" }));
  await waitFor(() => expect(handleUpdateStudent).toHaveBeenCalledWith("student-1", {
    firstName: "Alex", lastName: "Silva", gender: "Non-binary", notes: "Keep this note",
    isParticipatingWell: true, needsHelp: true, missingHomework: true,
  }));
  await waitFor(() => expect(screen.queryByLabelText("Gender")).toBeNull());
});

test("filters activity performance by the selected subject", async () => {
  const notesResult = orderedResult([]);
  const activityResult = orderedResult([
    {
      id: "entry-1",
      outcome: "met",
      notes: "Clear explanation",
      created_at: "2026-08-18T12:00:00Z",
      activity_assessments: {
        id: "activity-1",
        activity_date: "2026-08-18",
        subject_id: "subject-math",
        subject: "Mathematics",
        title: "Multiplication strategies",
        description: "Explained two multiplication strategies.",
        activity_assessment_criteria: [
          {
            id: "criterion-1",
            title: "Explains mathematical reasoning",
            sort_order: 0,
            activity_assessment_criterion_results: [
              {
                id: "result-1",
                student_id: "student-1",
                outcome: "exceeded",
                notes: "Used two clear examples.",
                observed_at: "2026-08-18T12:00:00Z",
              },
            ],
          },
        ],
      },
    },
    {
      id: "entry-2",
      outcome: "needs_support",
      notes: null,
      created_at: "2026-08-17T12:00:00Z",
      activity_assessments: {
        id: "activity-2",
        activity_date: "2026-08-17",
        subject_id: "subject-english",
        subject: "English",
        title: "Finding textual evidence",
        description: "Identified evidence in a short text.",
      },
    },
  ]);

  supabaseMock.from.mockImplementation((table) => {
    if (table === "student_notes") {
      return { select: vi.fn(() => ({ eq: vi.fn(() => notesResult) })) };
    }
    if (table === "activity_assessment_entries") {
      return { select: vi.fn(() => ({ eq: vi.fn(() => activityResult) })) };
    }
    throw new Error(`Unexpected table: ${table}`);
  });

  render(withQueryClient(
    <MemoryRouter initialEntries={["/students/student-1"]}>
      <Routes>
        <Route
          path="/students/:studentId"
          element={
            <StudentProfilePage
              students={[{ id: "student-1", class_id: "class-1", first_name: "Ana", last_name: "Silva" }]}
              classes={[{ id: "class-1", name: "Year 3" }]}
              subjects={[
                { id: "subject-math", class_id: "class-1", name: "Mathematics" },
                { id: "subject-english", class_id: "class-1", name: "English" },
              ]}
              attendanceSessions={[]}
              attendanceEntries={[]}
              handleUpdateStudent={vi.fn()}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  ));

  await screen.findByText("Explained two multiplication strategies.");
  const allSubjectsSummary = screen.getByLabelText("Activity performance summary");
  expect(within(allSubjectsSummary).getByText("5.0 / 10", { selector: "strong" })).toBeTruthy();
  expect(within(allSubjectsSummary).getByText("Working towards", { selector: "strong" })).toBeTruthy();
  fireEvent.change(screen.getByLabelText("Filter activity assessments by subject"), {
    target: { value: "subject:subject-math" },
  });

  expect(screen.getByText("Explained two multiplication strategies.")).toBeTruthy();
  expect(screen.getByText("Multiplication strategies")).toBeTruthy();
  expect(screen.getByText("Explains mathematical reasoning")).toBeTruthy();
  expect(screen.getByText("Used two clear examples.")).toBeTruthy();
  expect(screen.queryByText("Identified evidence in a short text.")).toBeNull();
  const summary = screen.getByLabelText("Activity performance summary");
  expect(within(summary).getByText("1", { selector: "strong" })).toBeTruthy();
  expect(within(summary).getByText("7.5 / 10", { selector: "strong" })).toBeTruthy();
  expect(within(summary).getByText("Met expectations", { selector: "strong" })).toBeTruthy();
  expect(screen.getByText(/1 of 1 assessment is at or above expectations/)).toBeTruthy();
  await waitFor(() => expect(supabaseMock.from).toHaveBeenCalledWith("activity_assessment_entries"));
});
