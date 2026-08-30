import { useState } from "react";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, expect, test, vi } from "vitest";
import SimpleClassesPage from "./SimpleClassesPage";
import SimpleClassDetailPage from "./SimpleClassDetailPage";

vi.mock("../components/ClassJournal", () => ({ default: () => null }));
vi.mock("../components/ActivityAssessmentHistory", () => ({ default: () => null }));

const initialClasses = [
  { id: "class-1", name: "4A", grade_level: "Grade 4", school_year: "2026" },
  { id: "class-2", name: "5B", grade_level: null, school_year: null },
];
const students = [{ id: "student-1", class_id: "class-1", first_name: "Ada", last_name: "Smith" }];

afterEach(cleanup);

function setup({ path = "/classes", update = vi.fn().mockResolvedValue(true) } = {}) {
  const selectClass = vi.fn();
  function Workspace() {
    const [classes, setClasses] = useState(initialClasses);
    const [formError, setFormError] = useState("");
    const [classForm, setClassForm] = useState({ name: "Unsaved new class", gradeLevel: "", schoolYear: "" });
    const handleUpdateClass = async (id, form) => {
      setFormError("");
      const saved = await update(id, form);
      if (saved) {
        setClasses((current) => current.map((item) => item.id === id ? {
          ...item, name: form.name.trim(), grade_level: form.gradeLevel.trim(), school_year: form.schoolYear.trim(),
        } : item));
      } else {
        setFormError("Unable to save. Please try again.");
      }
      return saved;
    };
    const props = { classes, students, formError, setFormError, handleUpdateClass };
    return (
      <Routes>
        <Route path="/classes" element={<SimpleClassesPage {...props} classForm={classForm} setClassForm={setClassForm} setActiveClassId={selectClass} />} />
        <Route path="/classes/:classId" element={<SimpleClassDetailPage {...props} />} />
      </Routes>
    );
  }
  render(<MemoryRouter initialEntries={[path]}><Workspace /></MemoryRouter>);
  return { update, selectClass, user: userEvent.setup() };
}

test("edits all class details from the list without navigating or changing active class", async () => {
  const { update, selectClass, user } = setup();
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  const dialog = screen.getByRole("dialog", { name: "Edit class" });
  expect(screen.getByLabelText("Class name").value).toBe("4A");
  expect(screen.getByLabelText(/Grade or group/).value).toBe("Grade 4");
  expect(screen.getByLabelText(/School year/).value).toBe("2026");
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "4C" } });
  fireEvent.change(screen.getByLabelText(/Grade or group/), { target: { value: "Grade 5" } });
  fireEvent.change(screen.getByLabelText(/School year/), { target: { value: "2027–28" } });
  await user.click(within(dialog).getByRole("button", { name: "Save changes" }));

  expect(update).toHaveBeenCalledExactlyOnceWith("class-1", { name: "4C", gradeLevel: "Grade 5", schoolYear: "2027–28" });
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("4C")).toBeTruthy();
  expect(screen.getByText("Grade 5 · 2027–28")).toBeTruthy();
  expect(screen.getByText("1 student")).toBeTruthy();
  expect(screen.getByText("5B")).toBeTruthy();
  expect(selectClass).not.toHaveBeenCalled();
});

test("edits from the class detail page and preserves the roster and class links", async () => {
  const { update, user } = setup({ path: "/classes/class-1" });
  await user.click(screen.getByRole("button", { name: "Edit class" }));
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Renamed class" } });
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(update).toHaveBeenCalledWith("class-1", expect.objectContaining({ name: "Renamed class" }));
  expect(screen.getByRole("heading", { name: "Renamed class" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Ada Smith/ }).getAttribute("href")).toBe("/students/student-1");
});

test("cancel discards changes, restores focus, and leaves the add-class draft untouched", async () => {
  const { update, user } = setup();
  const editButton = screen.getByRole("button", { name: "Edit 4A" });
  await user.click(editButton);
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Discard me" } });
  await user.click(screen.getByRole("button", { name: "Cancel" }));
  expect(update).not.toHaveBeenCalled();
  expect(document.activeElement).toBe(editButton);
  await user.click(editButton);
  expect(screen.getByLabelText("Class name").value).toBe("4A");
  await user.keyboard("{Escape}");
  expect(screen.queryByRole("dialog")).toBeNull();
  await user.click(screen.getByRole("button", { name: "Add class" }));
  expect(screen.getByLabelText("Class name").value).toBe("Unsaved new class");
});

test("handles missing optional details and resets the draft when editing a different class", async () => {
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  await user.keyboard("{Escape}");
  await user.click(screen.getByRole("button", { name: "Edit 5B" }));
  expect(screen.getByLabelText("Class name").value).toBe("5B");
  expect(screen.getByLabelText(/Grade or group/).value).toBe("");
  expect(screen.getByLabelText(/School year/).value).toBe("");
});

test("rejects whitespace-only names and keeps the editor open", async () => {
  const { update, user } = setup();
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "   " } });
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("alert").textContent).toBe("Class name is required.");
  expect(update).not.toHaveBeenCalled();
  expect(screen.getByRole("dialog")).toBeTruthy();
});

test("shows save errors inside the dialog and retains entered changes for retry", async () => {
  const update = vi.fn().mockResolvedValueOnce(false).mockResolvedValue(true);
  const { user } = setup({ update });
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  fireEvent.change(screen.getByLabelText("Class name"), { target: { value: "Try again class" } });
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(within(screen.getByRole("dialog")).getByRole("alert").textContent).toBe("Unable to save. Please try again.");
  expect(screen.getByLabelText("Class name").value).toBe("Try again class");
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.queryByRole("dialog")).toBeNull();
  expect(screen.getByText("Try again class")).toBeTruthy();
});

test("prevents duplicate saves and closing during an in-flight save", async () => {
  let finishSave;
  const update = vi.fn().mockImplementation(() => new Promise((resolve) => { finishSave = resolve; }));
  const { user } = setup({ update });
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("button", { name: "Saving…" }).disabled).toBe(true);
  expect(screen.getByRole("button", { name: "Cancel" }).disabled).toBe(true);
  expect(screen.getByLabelText("Class name").readOnly).toBe(true);
  fireEvent.submit(screen.getByRole("dialog"));
  await user.keyboard("{Escape}");
  expect(screen.getByRole("dialog")).toBeTruthy();
  expect(update).toHaveBeenCalledOnce();
  await act(async () => finishSave(true));
  await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
});

test("keeps keyboard focus within the editor", async () => {
  const { user } = setup();
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  expect(document.activeElement).toBe(screen.getByLabelText("Class name"));
  await user.tab({ shift: true });
  expect(document.activeElement).toBe(screen.getByRole("button", { name: "Save changes" }));
  await user.tab();
  expect(document.activeElement).toBe(screen.getByLabelText("Class name"));
});

test("a thrown save error leaves the editor usable", async () => {
  const { user } = setup({ update: vi.fn().mockRejectedValue(new Error("Disconnected")) });
  await user.click(screen.getByRole("button", { name: "Edit 4A" }));
  await user.click(screen.getByRole("button", { name: "Save changes" }));
  expect(screen.getByRole("alert").textContent).toBe("Failed to update class. Please try again.");
  expect(screen.getByRole("button", { name: "Save changes" }).disabled).toBe(false);
});
