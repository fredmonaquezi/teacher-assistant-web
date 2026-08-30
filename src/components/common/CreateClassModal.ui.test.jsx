import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import CreateClassModal from "./CreateClassModal";

afterEach(cleanup);
const renderModal = (overrides = {}) => {
  const props = { classForm: { name: "4A", gradeLevel: "", schoolYear: "" }, setClassForm: vi.fn(),
    handleCreateClass: vi.fn().mockResolvedValue("new-class"), handleAddClassSubjects: vi.fn().mockResolvedValue(true), onClose: vi.fn(), ...overrides };
  render(<CreateClassModal {...props} />);
  return props;
};
test("creates a class with optional suggested and custom subjects, trimming duplicates", async () => {
  const props = renderModal();
  fireEvent.click(screen.getByRole("checkbox", { name: "Math" }));
  fireEvent.change(screen.getByLabelText(/Other subjects/), { target: { value: " Drama, math, Drama " } });
  fireEvent.click(screen.getByRole("button", { name: "Add class" }));
  await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
  expect(props.handleAddClassSubjects).toHaveBeenCalledWith("new-class", ["Math", "Drama"]);
});
test("allows class creation without any subjects", async () => {
  const props = renderModal();
  fireEvent.click(screen.getByRole("button", { name: "Add class" }));
  await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
  expect(props.handleAddClassSubjects).not.toHaveBeenCalled();
});
test("retries failed subject setup without creating a second class", async () => {
  const props = renderModal({ handleAddClassSubjects: vi.fn().mockResolvedValueOnce(false).mockResolvedValueOnce(true) });
  fireEvent.click(screen.getByRole("checkbox", { name: "Science" }));
  fireEvent.click(screen.getByRole("button", { name: "Add class" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Save subjects" }).disabled).toBe(false));
  expect(props.onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Save subjects" }));
  await waitFor(() => expect(props.onClose).toHaveBeenCalledOnce());
  expect(props.handleCreateClass).toHaveBeenCalledOnce();
  expect(props.handleAddClassSubjects).toHaveBeenCalledTimes(2);
});
test("failed creation and cancel never save subjects", async () => {
  const props = renderModal({ handleCreateClass: vi.fn().mockResolvedValue(false) });
  fireEvent.click(screen.getByRole("checkbox", { name: "Math" }));
  fireEvent.click(screen.getByRole("button", { name: "Add class" }));
  await waitFor(() => expect(screen.getByRole("button", { name: "Add class" }).disabled).toBe(false));
  expect(props.handleAddClassSubjects).not.toHaveBeenCalled();
  expect(props.onClose).not.toHaveBeenCalled();
  fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
  expect(props.onClose).toHaveBeenCalledOnce();
});
