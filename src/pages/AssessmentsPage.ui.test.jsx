import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import i18n from "../i18n";
import AssessmentsPage from "./AssessmentsPage";

const baseProps = {
  formError: "",
  loading: false,
  classes: [{ id: "class-1", name: "Year 5", sort_order: 1 }],
  subjects: [{ id: "subject-1", class_id: "class-1", name: "Math", sort_order: 1 }],
  units: [{ id: "unit-1", subject_id: "subject-1", name: "Unit 1", sort_order: 1 }],
  students: [
    {
      id: "student-1",
      class_id: "class-1",
      first_name: "Maria Eduarda",
      last_name: "Tessari",
      sort_order: 1,
    },
  ],
  assessments: [
    {
      id: "assessment-1",
      class_id: "class-1",
      subject_id: "subject-1",
      unit_id: "unit-1",
      title: "Conceptual Understanding",
      max_score: 10,
      sort_order: 1,
    },
  ],
  assessmentEntries: [
    {
      id: "entry-1",
      assessment_id: "assessment-1",
      student_id: "student-1",
      score: 8.3,
      notes: null,
    },
  ],
};

function LocationView() {
  const location = useLocation();
  return <p data-testid="location">{location.pathname}</p>;
}

afterEach(() => {
  cleanup();
});

test("opens inline grade modal and saves the updated score", async () => {
  const handleSetAssessmentEntryScore = vi.fn().mockResolvedValue(true);

  render(
    <MemoryRouter>
      <AssessmentsPage
        {...baseProps}
        handleSetAssessmentEntryScore={handleSetAssessmentEntryScore}
      />
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /Year 5/ }));
  fireEvent.click(screen.getByRole("button", { name: /Math/ }));
  fireEvent.click(screen.getByRole("button", { name: /Unit 1/ }));

  fireEvent.click(
    await screen.findByRole("button", {
      name: i18n.t("assessments.aria.editAssessmentForStudent", {
        assessmentTitle: "Conceptual Understanding",
        studentName: "Maria Eduarda Tessari",
      }),
    })
  );

  const modal = await screen.findByRole("dialog", { name: i18n.t("assessments.inlineEditor.title") });
  const input = modal.querySelector("input[type='number']");
  if (!input) throw new Error("Expected grade input in modal.");

  fireEvent.change(input, { target: { value: "9.1" } });
  fireEvent.click(screen.getByRole("button", { name: i18n.t("assessments.inlineEditor.save") }));

  await waitFor(() =>
    expect(handleSetAssessmentEntryScore).toHaveBeenCalledWith("assessment-1", "student-1", 9.1)
  );
});

test("opens assessment detail when clicking the assessment title header", async () => {
  render(
    <MemoryRouter initialEntries={["/assessments"]}>
      <Routes>
        <Route
          path="/assessments"
          element={
            <AssessmentsPage
              {...baseProps}
              handleSetAssessmentEntryScore={vi.fn().mockResolvedValue(true)}
            />
          }
        />
        <Route path="/assessments/:assessmentId" element={<LocationView />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: /Year 5/ }));
  fireEvent.click(screen.getByRole("button", { name: /Math/ }));
  fireEvent.click(screen.getByRole("button", { name: /Unit 1/ }));

  fireEvent.click(
    await screen.findByRole("button", {
      name: i18n.t("assessments.aria.openAssessment", {
        assessmentTitle: "Conceptual Understanding",
      }),
    })
  );

  const locationNode = await screen.findByTestId("location");
  expect(locationNode.textContent).toContain("/assessments/assessment-1");
});
