import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, expect, test } from "vitest";
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
