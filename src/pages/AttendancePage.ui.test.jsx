import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import AttendancePage from "./AttendancePage";

afterEach(cleanup);

function LocationProbe() {
  const location = useLocation();
  return <div data-testid="location">{location.pathname}</div>;
}

function renderAttendancePage(overrides = {}) {
  const props = {
    classOptions: [{ id: "class-1", label: "Class 4A (Grade 4)" }],
    activeClassId: "class-1",
    students: [
      { id: "student-1", class_id: "class-1", first_name: "Ana", last_name: "Silva" },
    ],
    attendanceSessions: [],
    attendanceEntries: [],
    formError: "",
    setFormError: vi.fn(),
    handleCreateAttendanceSessionForDate: vi.fn().mockResolvedValue({
      ok: true,
      sessionId: "session-1",
    }),
    handleDeleteAttendanceSession: vi.fn(),
    ...overrides,
  };

  render(
    <MemoryRouter initialEntries={["/attendance"]}>
      <Routes>
        <Route path="/attendance" element={<AttendancePage {...props} />} />
        <Route path="/attendance/:sessionId" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

  return props;
}

test("renders the attendance-list empty state for the active class", () => {
  renderAttendancePage();

  expect(screen.getByRole("heading", { name: "Attendance" })).toBeTruthy();
  expect(screen.getByText("Class: Class 4A (Grade 4)")).toBeTruthy();
  expect(screen.getByText("No attendance sessions yet")).toBeTruthy();
  expect(screen.getByRole("button", { name: "Today" }).disabled).toBe(false);
});

test("creates a dated attendance session and opens it", async () => {
  const props = renderAttendancePage();

  fireEvent.click(screen.getByRole("button", { name: "By date" }));
  fireEvent.change(screen.getByLabelText("Select date"), {
    target: { value: "2026-09-08" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create Session" }));

  await waitFor(() => {
    expect(props.handleCreateAttendanceSessionForDate).toHaveBeenCalledWith(
      "class-1",
      "2026-09-08"
    );
  });
  expect((await screen.findByTestId("location")).textContent).toBe("/attendance/session-1");
});
