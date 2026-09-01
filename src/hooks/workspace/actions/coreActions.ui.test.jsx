import { beforeEach, expect, test, vi } from "vitest";
import { supabase } from "../../../supabaseClient";
import createCoreActions from "./coreActions";

vi.mock("../../../supabaseClient", () => ({ supabase: { from: vi.fn() } }));

const classItem = { id: "class-1", name: "4A", grade_level: "Grade 4", school_year: "2026", sort_order: 3 };
let query;
let refreshCoreData;
let setFormError;
let actions;

test("creation returns its ID even when refresh fails, allowing subjects to use the saved class", async () => {
  const insert = vi.fn().mockReturnValue(query);
  supabase.from.mockReturnValue({ insert });
  refreshCoreData.mockResolvedValue(false);
  const setClassForm = vi.fn();
  const create = createCoreActions({ classes: [], classForm: { name: " 4A ", gradeLevel: "", schoolYear: "" }, setClassForm, refreshCoreData, setFormError });
  expect(await create.handleCreateClass({ preventDefault: vi.fn() })).toBe("class-1");
  expect(insert).toHaveBeenCalledExactlyOnceWith({ name: "4A", grade_level: null, school_year: null, sort_order: 0 });
  expect(setClassForm).toHaveBeenCalledOnce();
});

test("failed class creation does not clear the draft", async () => {
  const insert = vi.fn().mockReturnValue(query);
  supabase.from.mockReturnValue({ insert });
  query.single.mockResolvedValue({ data: null, error: { message: "Unable to save" } });
  const setClassForm = vi.fn();
  const create = createCoreActions({ classes: [], classForm: { name: "4A", gradeLevel: "", schoolYear: "" }, setClassForm, refreshCoreData, setFormError });
  expect(await create.handleCreateClass({ preventDefault: vi.fn() })).toBe(false);
  expect(setClassForm).not.toHaveBeenCalled();
  expect(refreshCoreData).not.toHaveBeenCalled();
});

beforeEach(() => {
  vi.clearAllMocks();
  query = {
    update: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    single: vi.fn().mockResolvedValue({ data: { id: classItem.id }, error: null }),
  };
  supabase.from.mockReturnValue(query);
  refreshCoreData = vi.fn().mockResolvedValue(true);
  setFormError = vi.fn();
  actions = createCoreActions({ classes: [classItem], refreshCoreData, setFormError });
});

test("updates only editable class fields, trims values, and reloads workspace data", async () => {
  expect(await actions.handleUpdateClass(classItem.id, {
    name: "  5B  ", gradeLevel: " Grade 5 ", schoolYear: " 2027–28 ", sortOrder: 100, user_id: "other-user",
  })).toBe(true);

  expect(supabase.from).toHaveBeenCalledWith("classes");
  expect(query.update).toHaveBeenCalledExactlyOnceWith({ name: "5B", grade_level: "Grade 5", school_year: "2027–28" });
  expect(query.eq).toHaveBeenCalledExactlyOnceWith("id", "class-1");
  expect(query.select).toHaveBeenCalledWith("id");
  expect(query.single).toHaveBeenCalledOnce();
  expect(refreshCoreData).toHaveBeenCalledOnce();
  expect(classItem.name).toBe("4A");
});

test("allows optional grade and year to be cleared", async () => {
  expect(await actions.handleUpdateClass(classItem.id, { name: "4A", gradeLevel: "  ", schoolYear: "" })).toBe(true);
  expect(query.update).toHaveBeenCalledWith({ name: "4A", grade_level: null, school_year: null });
});

test.each(["", "   ", undefined])("rejects an empty class name (%s) before writing", async (name) => {
  expect(await actions.handleUpdateClass(classItem.id, { name })).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Class name is required.");
  expect(supabase.from).not.toHaveBeenCalled();
});

test.each(["", "missing-class"])("rejects an unknown class (%s) before writing", async (id) => {
  expect(await actions.handleUpdateClass(id, { name: "5B" })).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Class not found.");
  expect(supabase.from).not.toHaveBeenCalled();
});

test.each(["Permission denied", "Cannot coerce the result to a single JSON object"])(
  "reports database failures including inaccessible or deleted rows: %s", async (message) => {
    query.single.mockResolvedValue({ data: null, error: { message } });
    expect(await actions.handleUpdateClass(classItem.id, { name: "5B" })).toBe(false);
    expect(setFormError).toHaveBeenLastCalledWith(message);
    expect(refreshCoreData).not.toHaveBeenCalled();
  }
);

test("reports network errors", async () => {
  query.single.mockRejectedValue(new Error("Network unavailable"));
  expect(await actions.handleUpdateClass(classItem.id, { name: "5B" })).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Network unavailable");
});

test("does not report full success if the refreshed data could not be loaded", async () => {
  refreshCoreData.mockResolvedValue(false);
  expect(await actions.handleUpdateClass(classItem.id, { name: "5B" })).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Class saved, but the updated details could not be loaded. Please try again.");
});

test("saves and clears a teacher-selected academic profile", async () => {
  const studentActions = createCoreActions({
    classes: [classItem],
    students: [{ id: "student-1" }],
    refreshCoreData,
    setFormError,
  });

  expect(await studentActions.handleUpdateStudentAcademicLevel("student-1", "extending")).toBe(true);
  expect(query.update).toHaveBeenLastCalledWith({ academic_level_override: "extending" });
  expect(query.eq).toHaveBeenLastCalledWith("id", "student-1");

  expect(await studentActions.handleUpdateStudentAcademicLevel("student-1", null)).toBe(true);
  expect(query.update).toHaveBeenLastCalledWith({ academic_level_override: null });
  expect(refreshCoreData).toHaveBeenCalledTimes(2);
});

test("rejects invalid academic profile overrides", async () => {
  const studentActions = createCoreActions({
    classes: [classItem],
    students: [{ id: "student-1" }],
    refreshCoreData,
    setFormError,
  });

  expect(await studentActions.handleUpdateStudentAcademicLevel("student-1", "top_student")).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Choose a valid learning profile.");
  expect(supabase.from).not.toHaveBeenCalled();
});
