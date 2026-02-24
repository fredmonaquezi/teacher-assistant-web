import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import RandomPickerPage from "./RandomPickerPage";

const CLASS_OPTIONS = [{ id: "class-1", label: "Class 1" }];
const STUDENTS = [
  {
    id: "student-1",
    first_name: "Ada",
    last_name: "Lovelace",
    class_id: "class-1",
  },
  {
    id: "student-2",
    first_name: "Grace",
    last_name: "Hopper",
    class_id: "class-1",
  },
];

function renderPage(overrides = {}) {
  const props = {
    formError: "",
    classOptions: CLASS_OPTIONS,
    students: STUDENTS,
    randomPickerCustomCategories: [],
    randomPickerRotationRows: [],
    handleCreateRandomPickerCustomCategory: vi.fn().mockResolvedValue(true),
    handleDeleteRandomPickerCustomCategory: vi.fn().mockResolvedValue(true),
    handleSetRandomPickerRotationUsedStudents: vi.fn().mockResolvedValue(true),
    handleImportLegacyRandomPickerState: vi.fn().mockResolvedValue(true),
    ...overrides,
  };

  render(
    <MemoryRouter initialEntries={["/random?classId=class-1"]}>
      <Routes>
        <Route path="/random" element={<RandomPickerPage {...props} />} />
      </Routes>
    </MemoryRouter>
  );

  return props;
}

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.restoreAllMocks();
});

test("marks selected student as used for the scoped class/category", async () => {
  vi.useFakeTimers();
  const randomSpy = vi.spyOn(Math, "random").mockReturnValue(0);
  const handleSetRandomPickerRotationUsedStudents = vi.fn().mockResolvedValue(true);

  renderPage({ handleSetRandomPickerRotationUsedStudents });

  fireEvent.click(screen.getByRole("button", { name: /Pick next Helper/i }));
  await act(async () => {
    vi.advanceTimersByTime(1000);
  });

  fireEvent.click(screen.getByRole("button", { name: /Mark used/i }));

  expect(handleSetRandomPickerRotationUsedStudents).toHaveBeenCalledTimes(1);
  expect(handleSetRandomPickerRotationUsedStudents).toHaveBeenCalledWith({
    classId: "class-1",
    category: "Helper",
    usedStudentIds: ["student-1"],
  });

  randomSpy.mockRestore();
});

test("clears used students for selected class/category", async () => {
  const handleSetRandomPickerRotationUsedStudents = vi.fn().mockResolvedValue(true);

  renderPage({
    randomPickerRotationRows: [
      {
        id: "rotation-1",
        class_id: "class-1",
        category: "Helper",
        used_student_ids: ["student-1"],
        created_at: "2026-02-24T19:00:00.000Z",
        updated_at: "2026-02-24T19:00:00.000Z",
      },
    ],
    handleSetRandomPickerRotationUsedStudents,
  });

  fireEvent.click(screen.getByRole("button", { name: /Clear used/i }));

  expect(handleSetRandomPickerRotationUsedStudents).toHaveBeenCalledTimes(1);
  expect(handleSetRandomPickerRotationUsedStudents).toHaveBeenCalledWith({
    classId: "class-1",
    category: "Helper",
    usedStudentIds: [],
  });
});

test("creates custom category in selected class scope", async () => {
  const handleCreateRandomPickerCustomCategory = vi.fn().mockResolvedValue(true);

  renderPage({ handleCreateRandomPickerCustomCategory });

  fireEvent.click(screen.getByRole("button", { name: /Add custom/i }));
  fireEvent.change(screen.getByPlaceholderText(/Materials Captain/i), {
    target: { value: "Speaker" },
  });
  fireEvent.click(screen.getByRole("button", { name: /^Create$/i }));

  expect(handleCreateRandomPickerCustomCategory).toHaveBeenCalledTimes(1);
  expect(handleCreateRandomPickerCustomCategory).toHaveBeenCalledWith({
    classId: "class-1",
    name: "Speaker",
  });
});

test("deletes custom category in selected class scope", async () => {
  const handleDeleteRandomPickerCustomCategory = vi.fn().mockResolvedValue(true);

  renderPage({
    randomPickerCustomCategories: [
      {
        id: "custom-1",
        class_id: "class-1",
        name: "Speaker",
        sort_order: 0,
        created_at: "2026-02-24T19:00:00.000Z",
        updated_at: "2026-02-24T19:00:00.000Z",
      },
    ],
    handleDeleteRandomPickerCustomCategory,
  });

  fireEvent.click(screen.getByRole("button", { name: /Delete role aria Speaker/i }));
  fireEvent.click(screen.getByRole("button", { name: /^Delete$/i }));

  expect(handleDeleteRandomPickerCustomCategory).toHaveBeenCalledTimes(1);
  expect(handleDeleteRandomPickerCustomCategory).toHaveBeenCalledWith({
    classId: "class-1",
    name: "Speaker",
  });
});
