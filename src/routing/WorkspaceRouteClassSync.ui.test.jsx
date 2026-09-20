import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import WorkspaceRouteClassSync from "./WorkspaceRouteClassSync";
import { getRouteClassId } from "./workspaceRouteClass";

const students = [{ id: "student-1", class_id: "class-2" }];
const attendanceSessions = [{ id: "session-1", class_id: "class-3" }];

test.each([
  ["class detail route", "/classes/class-1", "", "class-1"],
  ["nested class route", "/classes/class-1/assess-activity", "", "class-1"],
  ["student route", "/students/student-1", "", "class-2"],
  ["attendance route", "/attendance/session-1", "", "class-3"],
  ["class query", "/groups", "?classId=class-4", "class-4"],
  ["query fallback for unresolved student", "/students/missing", "?classId=class-4", "class-4"],
])("resolves the active class from the %s", (_label, pathname, search, expected) => {
  expect(getRouteClassId({ pathname, search, students, attendanceSessions })).toBe(expected);
});

test("synchronizes a known route class with global selection", async () => {
  const setActiveClassId = vi.fn();

  render(
    <MemoryRouter initialEntries={["/students/student-1"]}>
      <WorkspaceRouteClassSync
        classes={[{ id: "class-1" }, { id: "class-2" }]}
        students={students}
        attendanceSessions={attendanceSessions}
        activeClassId="class-1"
        setActiveClassId={setActiveClassId}
      />
    </MemoryRouter>
  );

  await waitFor(() => expect(setActiveClassId).toHaveBeenCalledWith("class-2"));
});

test.each([
  ["an unknown class", "/groups?classId=missing"],
  ["the already-active class", "/groups?classId=class-1"],
])("does not replace selection for %s", async (_label, route) => {
  const setActiveClassId = vi.fn();

  render(
    <MemoryRouter initialEntries={[route]}>
      <WorkspaceRouteClassSync
        classes={[{ id: "class-1" }]}
        activeClassId="class-1"
        setActiveClassId={setActiveClassId}
      />
    </MemoryRouter>
  );

  await waitFor(() => expect(setActiveClassId).not.toHaveBeenCalled());
});
