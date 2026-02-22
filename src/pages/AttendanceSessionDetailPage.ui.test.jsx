import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { expect, test, vi } from "vitest";
import i18n from "../i18n";
import AttendanceSessionDetailPage from "./AttendanceSessionDetailPage";
import { ATTENDANCE_STATUS_BY_KEY } from "../constants/attendance";

test("updates an attendance entry when a status button is clicked", () => {
  const handleUpdateAttendanceEntry = vi.fn();

  render(
    <MemoryRouter initialEntries={["/attendance/sess-1"]}>
      <Routes>
        <Route
          path="/attendance/:sessionId"
          element={
            <AttendanceSessionDetailPage
              attendanceSessions={[
                { id: "sess-1", class_id: "class-1", session_date: "2026-02-17" },
              ]}
              attendanceEntries={[
                {
                  id: "entry-1",
                  session_id: "sess-1",
                  student_id: "student-1",
                  status: "Present",
                  note: null,
                },
              ]}
              classes={[{ id: "class-1", name: "Class A" }]}
              students={[
                {
                  id: "student-1",
                  class_id: "class-1",
                  first_name: "Ana",
                  last_name: "Silva",
                  sort_order: 0,
                },
              ]}
              handleUpdateAttendanceEntry={handleUpdateAttendanceEntry}
            />
          }
        />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: i18n.t("attendance.status.absent.label") }));

  expect(handleUpdateAttendanceEntry).toHaveBeenCalledWith("entry-1", {
    status: ATTENDANCE_STATUS_BY_KEY.absent.value,
  });
});
