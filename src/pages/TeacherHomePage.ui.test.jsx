import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import TeacherHomePage from "./TeacherHomePage";

const STUDENTS = [
  { id: "student-1", class_id: "class-1" },
  { id: "student-2", class_id: "class-1" },
  { id: "student-3", class_id: "class-2" },
];

afterEach(cleanup);

test("shows the active class summary and class-scoped quick actions", () => {
  render(
    <MemoryRouter>
      <TeacherHomePage
        activeClass={{ id: "class-1", name: "Class 4A", grade_level: "Grade 4" }}
        activeClassId="class-1"
        students={STUDENTS}
        loading={false}
      />
    </MemoryRouter>
  );

  expect(screen.getByText("Class 4A")).toBeTruthy();
  expect(screen.getByText("2 students · Grade 4")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Open students/i }).getAttribute("href")).toBe(
    "/classes/class-1"
  );
  expect(screen.getByRole("link", { name: /Assess an activity/i }).getAttribute("href")).toBe(
    "/classes/class-1/assess-activity"
  );
});

test("guides the teacher and disables class tools when no class is active", () => {
  const { container } = render(
    <MemoryRouter>
      <TeacherHomePage activeClass={null} activeClassId="" students={STUDENTS} loading={false} />
    </MemoryRouter>
  );

  expect(screen.getByText("Select a class to begin")).toBeTruthy();
  expect(screen.getByRole("link", { name: /Manage classes/i }).getAttribute("href")).toBe(
    "/classes"
  );
  expect(container.querySelectorAll('[aria-disabled="true"]')).toHaveLength(5);
  expect(screen.getByRole("link", { name: /Useful Links/i }).getAttribute("href")).toBe(
    "/useful-links"
  );
});

test("shows and updates a meter value scoped to the active class when enabled", async () => {
  const user = userEvent.setup();
  const onPreferencesChange = vi.fn();

  render(
    <MemoryRouter>
      <TeacherHomePage
        activeClass={{ id: "class-1", name: "Class 4A", grade_level: "Grade 4" }}
        activeClassId="class-1"
        students={STUDENTS}
        loading={false}
        preferences={{
          englishMeterEnabled: true,
          englishMeterValues: { "class-1": 65, "class-2": 20 },
        }}
        onPreferencesChange={onPreferencesChange}
      />
    </MemoryRouter>
  );

  expect(screen.getByRole("heading", { name: "English Meter" })).toBeTruthy();
  expect(screen.getByRole("slider", { name: "English use for Class 4A" }).value).toBe("65");

  await user.click(screen.getByRole("button", { name: "Increase English use by 5 percent" }));

  const preferenceUpdater = onPreferencesChange.mock.calls[0][0];
  expect(
    preferenceUpdater({
      englishMeterEnabled: true,
      englishMeterValues: { "class-1": 65, "class-2": 20 },
    }).englishMeterValues
  ).toEqual({ "class-1": 70, "class-2": 20 });
});

test("keeps the English Meter hidden when the preference is off", () => {
  render(
    <MemoryRouter>
      <TeacherHomePage
        activeClass={{ id: "class-1", name: "Class 4A" }}
        activeClassId="class-1"
        students={STUDENTS}
        loading={false}
        preferences={{ englishMeterEnabled: false }}
      />
    </MemoryRouter>
  );

  expect(screen.queryByRole("heading", { name: "English Meter" })).toBeNull();
});
