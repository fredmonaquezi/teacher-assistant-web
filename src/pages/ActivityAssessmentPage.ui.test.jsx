import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import ActivityAssessmentPage from "./ActivityAssessmentPage";

const supabaseMock = vi.hoisted(() => ({ from: vi.fn() }));

vi.mock("../supabaseClient", () => ({
  supabase: supabaseMock,
}));

afterEach(() => cleanup());

beforeEach(() => {
  supabaseMock.from.mockReset();
});

test("saves one class activity and an outcome for every student", async () => {
  const single = vi.fn().mockResolvedValue({ data: { id: "activity-1" }, error: null });
  const select = vi.fn(() => ({ single }));
  const insertActivity = vi.fn(() => ({ select }));
  const upsertEntries = vi.fn().mockResolvedValue({ error: null });

  supabaseMock.from.mockImplementation((table) => {
    if (table === "activity_assessments") return { insert: insertActivity };
    if (table === "activity_assessment_entries") return { upsert: upsertEntries };
    throw new Error(`Unexpected table: ${table}`);
  });

  render(
    <MemoryRouter initialEntries={["/classes/class-1/assess-activity"]}>
      <Routes>
        <Route
          path="/classes/:classId/assess-activity"
          element={
            <ActivityAssessmentPage
              classes={[{ id: "class-1", name: "Year 3" }]}
              subjects={[{ id: "subject-1", class_id: "class-1", name: "Guided reading", sort_order: 1 }]}
              students={[
                { id: "student-2", class_id: "class-1", first_name: "Zoe", last_name: "Brown" },
                { id: "student-1", class_id: "class-1", first_name: "Ana", last_name: "Silva" },
              ]}
            />
          }
        />
        <Route path="/classes/:classId" element={<p>Class page</p>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("Subject"), {
    target: { value: "subject-1" },
  });
  fireEvent.change(screen.getByLabelText("Activity title"), {
    target: { value: "Retelling the main events" },
  });
  fireEvent.change(screen.getByLabelText("Brief activity description"), {
    target: { value: "Retold the main events and identified key details." },
  });
  fireEvent.change(screen.getByLabelText("Set outcome for all students"), {
    target: { value: "met" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save activity" }));

  await waitFor(() => expect(screen.getByText("Class page")).toBeTruthy());
  expect(insertActivity).toHaveBeenCalledWith(
    expect.objectContaining({
      class_id: "class-1",
      subject_id: "subject-1",
      subject: "Guided reading",
      title: "Retelling the main events",
      description: "Retold the main events and identified key details.",
    })
  );
  expect(upsertEntries).toHaveBeenCalledWith([
    {
      activity_assessment_id: "activity-1",
      student_id: "student-1",
      outcome: "met",
      notes: null,
    },
    {
      activity_assessment_id: "activity-1",
      student_id: "student-2",
      outcome: "met",
      notes: null,
    },
  ], { onConflict: "activity_assessment_id,student_id" });
});

test("allows an activity to be saved after assessing only participating students", async () => {
  const single = vi.fn().mockResolvedValue({ data: { id: "activity-1" }, error: null });
  const select = vi.fn(() => ({ single }));
  const insertActivity = vi.fn(() => ({ select }));
  const upsertEntries = vi.fn().mockResolvedValue({ error: null });

  supabaseMock.from.mockImplementation((table) => {
    if (table === "activity_assessments") return { insert: insertActivity };
    if (table === "activity_assessment_entries") return { upsert: upsertEntries };
    throw new Error(`Unexpected table: ${table}`);
  });

  render(
    <MemoryRouter initialEntries={["/classes/class-1/assess-activity"]}>
      <Routes>
        <Route
          path="/classes/:classId/assess-activity"
          element={
            <ActivityAssessmentPage
              classes={[{ id: "class-1", name: "Year 3" }]}
              subjects={[{ id: "subject-1", class_id: "class-1", name: "Guided reading", sort_order: 1 }]}
              students={[
                { id: "student-1", class_id: "class-1", first_name: "Ana", last_name: "Silva" },
                { id: "student-2", class_id: "class-1", first_name: "Zoe", last_name: "Brown" },
              ]}
            />
          }
        />
        <Route path="/classes/:classId" element={<p>Class page</p>} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("Subject"), {
    target: { value: "subject-1" },
  });
  fireEvent.change(screen.getByLabelText("Activity title"), {
    target: { value: "Retelling the main events" },
  });
  fireEvent.change(screen.getByLabelText("Brief activity description"), {
    target: { value: "Retold the main events." },
  });
  fireEvent.change(screen.getByLabelText("Outcome for Ana Silva"), {
    target: { value: "met" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Save activity" }));

  await waitFor(() => expect(screen.getByText("Class page")).toBeTruthy());
  expect(upsertEntries).toHaveBeenCalledWith([
    {
      activity_assessment_id: "activity-1",
      student_id: "student-1",
      outcome: "met",
      notes: null,
    },
  ], { onConflict: "activity_assessment_id,student_id" });
});
