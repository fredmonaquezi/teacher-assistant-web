import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import AssessmentDetailPage from "./AssessmentDetailPage";

test("updates assessment entry score on score field blur", () => {
  const handleUpdateAssessmentEntry = vi.fn();
  const handleEnsureAssessmentEntries = vi.fn();
  const handleUpdateAssessmentNotes = vi.fn();
  const setAssessments = vi.fn();

  render(
    <MemoryRouter initialEntries={["/assessments/assessment-1"]}>
      <Routes>
        <Route
          path="/assessments/:assessmentId"
          element={
            <AssessmentDetailPage
              assessments={[
                {
                  id: "assessment-1",
                  class_id: "class-1",
                  subject_id: "subject-1",
                  unit_id: "unit-1",
                  title: "Quiz 1",
                  assessment_date: "2026-02-17",
                  max_score: 10,
                },
              ]}
              assessmentEntries={[
                {
                  id: "entry-1",
                  assessment_id: "assessment-1",
                  student_id: "student-1",
                  score: null,
                  notes: null,
                },
              ]}
              classes={[{ id: "class-1", name: "Class A" }]}
              subjects={[{ id: "subject-1", name: "Math" }]}
              units={[{ id: "unit-1", name: "Unit 1" }]}
              students={[
                {
                  id: "student-1",
                  class_id: "class-1",
                  first_name: "Ana",
                  last_name: "Silva",
                  sort_order: 0,
                },
              ]}
              handleUpdateAssessmentEntry={handleUpdateAssessmentEntry}
              setAssessments={setAssessments}
              handleEnsureAssessmentEntries={handleEnsureAssessmentEntries}
              handleUpdateAssessmentNotes={handleUpdateAssessmentNotes}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );

  const scoreInput = screen.getByRole("spinbutton");
  fireEvent.change(scoreInput, { target: { value: "8" } });
  fireEvent.blur(scoreInput);

  expect(handleUpdateAssessmentEntry).toHaveBeenCalledWith("entry-1", {
    score: 8,
  });
});
