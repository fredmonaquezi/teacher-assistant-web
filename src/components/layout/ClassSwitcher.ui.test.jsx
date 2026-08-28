import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { expect, test, vi } from "vitest";
import ClassSwitcher from "./ClassSwitcher";
import { getClassSwitchDestination } from "./classSwitchNavigation";

function LocationProbe() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

test("maps record-specific pages to a safe destination for the new class", () => {
  expect(getClassSwitchDestination("/classes/class-1", "class-2")).toBe("/classes/class-2");
  expect(
    getClassSwitchDestination("/classes/class-1/assess-activity/assessment-1", "class-2")
  ).toBe("/classes/class-2/assess-activity");
  expect(getClassSwitchDestination("/attendance/session-1", "class-2")).toBe("/attendance");
  expect(getClassSwitchDestination("/students/student-1", "class-2")).toBe("/classes/class-2");
});

test("changes the active class and removes a stale page class query", () => {
  const setActiveClassId = vi.fn();

  render(
    <MemoryRouter initialEntries={["/groups?classId=class-1"]}>
      <ClassSwitcher
        classes={[
          { id: "class-1", name: "Class 1" },
          { id: "class-2", name: "Class 2", grade_level: "Grade 4" },
        ]}
        activeClassId="class-1"
        setActiveClassId={setActiveClassId}
      />
      <Routes>
        <Route path="*" element={<LocationProbe />} />
      </Routes>
    </MemoryRouter>
  );

  fireEvent.change(screen.getByLabelText("Change active class"), {
    target: { value: "class-2" },
  });

  expect(setActiveClassId).toHaveBeenCalledWith("class-2");
  expect(screen.getByTestId("location").textContent).toBe("/groups");
});
