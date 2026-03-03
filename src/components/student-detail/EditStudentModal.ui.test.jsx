import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { MemoryRouter } from "react-router-dom";
import EditStudentModal from "./EditStudentModal";
import i18n from "../../i18n";

beforeEach(async () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("teacher-assistant.language", "en");
  }
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
});

function renderModal(overrides = {}) {
  const props = {
    showEditInfo: true,
    setShowEditInfo: vi.fn(),
    student: {
      id: "student-1",
      first_name: "Maya",
      last_name: "Lopez",
      class_id: "class-1",
    },
    studentId: "student-1",
    editForm: {
      firstName: "Maya",
      lastName: "Lopez",
      gender: "Female",
      notes: "Strong reader",
      isParticipatingWell: true,
      needsHelp: false,
      missingHomework: false,
    },
    setEditForm: vi.fn(),
    handleUpdateStudent: vi.fn().mockResolvedValue(true),
    ...overrides,
  };

  render(
    <MemoryRouter>
      <EditStudentModal {...props} />
    </MemoryRouter>
  );

  return props;
}

test("renders editable first and last name fields", () => {
  renderModal();

  expect(screen.getByLabelText("First name").value).toBe("Maya");
  expect(screen.getByLabelText("Last name").value).toBe("Lopez");
});

test("submits first and last name updates and closes on success", async () => {
  const props = renderModal();

  fireEvent.click(screen.getByRole("button", { name: "Done" }));

  await waitFor(() =>
    expect(props.handleUpdateStudent).toHaveBeenCalledWith("student-1", props.editForm)
  );
  expect(props.setShowEditInfo).toHaveBeenCalledWith(false);
});

test("stays open when the student update fails", async () => {
  const props = renderModal({
    handleUpdateStudent: vi.fn().mockResolvedValue(false),
  });

  fireEvent.click(screen.getByRole("button", { name: "Done" }));

  await waitFor(() => expect(props.handleUpdateStudent).toHaveBeenCalled());
  expect(props.setShowEditInfo).not.toHaveBeenCalled();
});
