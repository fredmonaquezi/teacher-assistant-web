import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import ClassSubjectsModal from "./ClassSubjectsModal";
afterEach(cleanup);
const setup = (overrides = {}) => {
  const props = { classItem: { id: "c1", name: "4A" }, subjects: [{ id: "s1", name: "Math" }], onAdd: vi.fn().mockResolvedValue(true), onRename: vi.fn().mockResolvedValue(true), onClose: vi.fn(), ...overrides };
  render(<ClassSubjectsModal {...props} />);
  return props;
};
test("existing subjects are selected and cannot be added again", async () => {
  const props = setup();
  expect(screen.getByRole("checkbox", { name: "Math" }).disabled).toBe(true);
  fireEvent.click(screen.getByRole("checkbox", { name: "Science" }));
  fireEvent.click(screen.getByRole("button", { name: "Add subjects" }));
  await waitFor(() => expect(props.onAdd).toHaveBeenCalledWith("c1", ["Science"]));
  await waitFor(() => expect(screen.getByRole("button", { name: "Add subjects" }).disabled).toBe(true));
});
test("renames a subject and keeps failed changes available to retry", async () => {
  const props = setup({ onRename: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) });
  fireEvent.change(screen.getByLabelText("Subject name: Math"), { target: { value: "Mathematics" } });
  fireEvent.click(screen.getByRole("button", { name: "Save Math" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save Math" }).disabled).toBe(false));
  expect(screen.getByLabelText("Subject name: Math").value).toBe("Mathematics");
  fireEvent.click(screen.getByRole("button", { name: "Save Math" }));
  await waitFor(() => expect(props.onRename).toHaveBeenCalledTimes(2));
  expect(props.onRename).toHaveBeenLastCalledWith("c1", "s1", "Mathematics");
});
