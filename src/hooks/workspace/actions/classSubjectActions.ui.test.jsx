import { beforeEach, expect, test, vi } from "vitest";
import { supabase } from "../../../supabaseClient";
import createClassSubjectActions from "./classSubjectActions";
vi.mock("../../../supabaseClient", () => ({ supabase: { from: vi.fn() } }));
let actions, existing, insert, update, filter, refresh, error;
beforeEach(() => {
  existing = [{ id: "s1", name: "Math", sort_order: 3 }];
  insert = vi.fn().mockResolvedValue({ error: null });
  filter = vi.fn().mockReturnThis();
  const mutation = { eq: filter, select: vi.fn().mockReturnThis(), single: vi.fn().mockResolvedValue({ data: { id: "s1" }, error: null }) };
  update = vi.fn(() => mutation);
  supabase.from.mockReturnValue({ select: vi.fn(() => ({ eq: vi.fn(async () => ({ data: existing, error: null })) })), insert, update });
  refresh = vi.fn().mockResolvedValue(true);
  error = vi.fn();
  actions = createClassSubjectActions({ refreshAssessmentData: refresh, setFormError: error });
});
test("adds only new normalized names to the selected class", async () => {
  expect(await actions.handleAddClassSubjects("c1", [" math ", " Science ", "science", "Drama"])).toBe(true);
  expect(insert).toHaveBeenCalledWith([{ class_id: "c1", name: "Science", sort_order: 4 }, { class_id: "c1", name: "Drama", sort_order: 5 }]);
  expect(refresh).toHaveBeenCalledOnce();
});
test("retry skips previously saved subjects", async () => {
  existing.push({ id: "s2", name: "Science", sort_order: 4 });
  expect(await actions.handleAddClassSubjects("c1", ["Science"])).toBe(true);
  expect(insert).not.toHaveBeenCalled();
});
test("reports insertion failures and keeps retry possible", async () => {
  insert.mockResolvedValue({ error: { message: "Permission denied" } });
  expect(await actions.handleAddClassSubjects("c1", ["Drama"])).toBe(false);
  expect(error).toHaveBeenLastCalledWith("Permission denied");
  expect(refresh).not.toHaveBeenCalled();
});
test("renames only the subject in the selected class", async () => {
  expect(await actions.handleRenameClassSubject("c1", "s1", " Mathematics ")).toBe(true);
  expect(update).toHaveBeenCalledWith({ name: "Mathematics" });
  expect(filter).toHaveBeenCalledWith("class_id", "c1");
  expect(filter).toHaveBeenCalledWith("id", "s1");
});
test("rejects blank, duplicate and out-of-class renames", async () => {
  existing.push({ id: "s2", name: "Science" });
  for (const [id, name] of [["s1", " "], ["s1", " science "], ["other", "Drama"]]) {
    expect(await actions.handleRenameClassSubject("c1", id, name)).toBe(false);
  }
  expect(update).not.toHaveBeenCalled();
});
