import { useState } from "react";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import i18n from "../i18n";
import ClassDetailPage from "./ClassDetailPage";

function createNoopDragHook() {
  return () => ({
    onHandlePointerDown: vi.fn(),
    onHandlePointerMove: vi.fn(),
    onHandlePointerUp: vi.fn(),
    isDragAllowed: () => false,
    resetHandleDrag: vi.fn(),
  });
}

function ReorderModeToggleStub() {
  return null;
}

function ClassDetailHarness({ handleCreateStudent }) {
  const [subjectForm, setSubjectForm] = useState({ name: "", description: "", sortOrder: "" });
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Prefer not to say",
    classId: "",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
    separationList: "",
    sortOrder: "",
  });

  return (
    <ClassDetailPage
      formError=""
      classes={[{ id: "class-1", name: "Class A", grade_level: "Year 5", school_year: "2026" }]}
      subjects={[]}
      students={[]}
      assessments={[]}
      assessmentEntries={[]}
      attendanceSessions={[]}
      attendanceEntries={[]}
      developmentScores={[]}
      subjectForm={subjectForm}
      setSubjectForm={setSubjectForm}
      handleCreateSubject={vi.fn()}
      handleSwapSortOrder={vi.fn()}
      studentForm={studentForm}
      setStudentForm={setStudentForm}
      handleCreateStudent={handleCreateStudent}
      useReorderModeHook={() => ({
        isMobileLayout: false,
        isReorderMode: false,
        setIsReorderMode: vi.fn(),
        isReorderEnabled: false,
      })}
      useHandleDragHook={createNoopDragHook()}
      ReorderModeToggleComponent={ReorderModeToggleStub}
      studentGenderOptions={["Prefer not to say", "Female", "Male", "Non-binary"]}
    />
  );
}

test("keeps add-student modal open when create student mutation fails", async () => {
  const handleCreateStudent = vi.fn().mockResolvedValue(false);

  render(
    <MemoryRouter initialEntries={["/classes/class-1"]}>
      <Routes>
        <Route
          path="/classes/:classId"
          element={<ClassDetailHarness handleCreateStudent={handleCreateStudent} />}
        />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getAllByRole("button", { name: i18n.t("classDetail.students.addStudent") })[0]);
  fireEvent.change(screen.getByPlaceholderText("Maya"), { target: { value: "Ana" } });
  fireEvent.change(screen.getByPlaceholderText("Lopez"), { target: { value: "Silva" } });
  fireEvent.click(screen.getByRole("button", { name: i18n.t("common.actions.add") }));

  await waitFor(() => expect(handleCreateStudent).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("heading", { name: i18n.t("classDetail.addStudent.title") })).toBeTruthy();
});
