import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import TeacherWorkspaceApp from "./TeacherWorkspaceApp";

const { workspace } = vi.hoisted(() => ({
  workspace: {
    classes: [{ id: "class-1", name: "Class 4A", grade_level: "Grade 4", school_year: "2026" }],
    students: [],
    attendanceSessions: [],
    activeClassId: "class-1",
    setActiveClassId: vi.fn(),
    ensureDataForPath: vi.fn(),
    setFormError: vi.fn(),
    handleUpdateClass: vi.fn().mockResolvedValue(true),
  },
}));

vi.mock("./hooks/useTeacherWorkspaceData", () => ({ default: () => workspace }));
vi.mock("./components/ClassJournal", () => ({ default: () => null }));
vi.mock("./components/ActivityAssessmentHistory", () => ({ default: () => null }));

beforeEach(() => vi.clearAllMocks());
afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

test.each([
  ["/classes", "Edit Class 4A"],
  ["/classes/class-1", "Edit class"],
])("connects the class editor to workspace updates on %s", async (path, buttonName) => {
  window.history.replaceState({}, "", `/teacherassistant${path}`);
  render(<TeacherWorkspaceApp user={{ id: "teacher-1" }} onSignOut={vi.fn()} />);

  fireEvent.click(await screen.findByRole("button", { name: buttonName }));
  expect(workspace.setFormError).toHaveBeenCalledWith("");
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Class 4B" } });
  fireEvent.click(screen.getByRole("button", { name: "Save changes" }));

  await waitFor(() => expect(workspace.handleUpdateClass).toHaveBeenCalledWith("class-1", {
    name: "Class 4B", gradeLevel: "Grade 4", schoolYear: "2026",
  }));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});
