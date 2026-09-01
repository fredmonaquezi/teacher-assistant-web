import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import GroupsPage from "./GroupsPage";

test("does not render student status indicators in generated groups", () => {
  render(
    <MemoryRouter initialEntries={["/groups?classId=class-1"]}>
      <GroupsPage
        formError=""
        activeClass={{ id: "class-1", name: "Class A" }}
        activeClassId="class-1"
        students={[
          {
            id: "student-1",
            class_id: "class-1",
            first_name: "Ana",
            last_name: "Silva",
            gender: "Female",
            is_participating_well: true,
            needs_help: true,
            missing_homework: true,
          },
        ]}
        groups={[{ id: "group-1", class_id: "class-1" }]}
        groupMembers={[{ group_id: "group-1", student_id: "student-1" }]}
        groupConstraints={[]}
        groupGenForm={{
          classId: "class-1",
          size: "4",
          balanceGender: false,
          balanceAbility: false,
          pairSupportPartners: false,
          respectSeparations: false,
        }}
        setGroupGenForm={vi.fn()}
        constraintForm={{ studentA: "", studentB: "" }}
        setConstraintForm={vi.fn()}
        groupsShowAdvanced={false}
        setGroupsShowAdvanced={vi.fn()}
        groupsShowSeparations={false}
        setGroupsShowSeparations={vi.fn()}
        groupsScrollTopRef={{ current: 0 }}
        handleGenerateGroups={vi.fn()}
        isGeneratingGroups={false}
        handleAddConstraint={vi.fn()}
        handleDeleteConstraint={vi.fn()}
      />
    </MemoryRouter>
  );

  expect(screen.getByText("Ana Silva")).toBeTruthy();
  expect(screen.queryByText("Random Picker")).toBeNull();
  expect(screen.queryByText("✋")).toBeNull();
  expect(screen.getByRole("button", { name: "Decrease students per group" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Increase students per group" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Show" }).getAttribute("aria-expanded")).toBe("false");
});

test("shows subject-balanced assessment profiles and saves a teacher override", async () => {
  const handleUpdateStudentAcademicLevel = vi.fn().mockResolvedValue(true);
  render(
    <MemoryRouter>
      <GroupsPage
        formError=""
        activeClass={{ id: "class-1", name: "Class A" }}
        activeClassId="class-1"
        students={[
          { id: "student-1", class_id: "class-1", first_name: "Ana", last_name: "Silva" },
          { id: "student-2", class_id: "class-1", first_name: "Ben", last_name: "Souza", academic_level_override: "needs_support" },
        ]}
        assessments={[
          { id: "math-1", class_id: "class-1", subject_id: "math", max_score: 10 },
          { id: "math-2", class_id: "class-1", subject_id: "math", max_score: 10 },
          { id: "reading-1", class_id: "class-1", subject_id: "reading", max_score: 10 },
        ]}
        assessmentEntries={[
          { assessment_id: "math-1", student_id: "student-1", score: 10 },
          { assessment_id: "math-2", student_id: "student-1", score: 10 },
          { assessment_id: "reading-1", student_id: "student-1", score: 0 },
        ]}
        subjects={[{ id: "math", name: "Math" }, { id: "reading", name: "Reading" }]}
        groups={[]}
        groupMembers={[]}
        groupConstraints={[]}
        groupGenForm={{ size: "4", balanceGender: false, separateGender: false, balanceAbility: true, pairSupportPartners: false, respectSeparations: false }}
        setGroupGenForm={vi.fn()}
        constraintForm={{ studentA: "", studentB: "" }}
        setConstraintForm={vi.fn()}
        groupsShowAdvanced
        setGroupsShowAdvanced={vi.fn()}
        groupsShowSeparations={false}
        setGroupsShowSeparations={vi.fn()}
        groupsScrollTopRef={{ current: 0 }}
        handleGenerateGroups={vi.fn()}
        isGeneratingGroups={false}
        handleAddConstraint={vi.fn()}
        handleDeleteConstraint={vi.fn()}
        handleUpdateStudentAcademicLevel={handleUpdateStudentAcademicLevel}
      />
    </MemoryRouter>
  );

  expect(screen.getByText("Assessment average: 50% across 2 subjects")).toBeTruthy();
  expect(screen.getByText("Math 100% · Reading 0%")).toBeTruthy();
  expect(screen.getByLabelText("Learning profile for Ben Souza").value).toBe("needs_support");

  fireEvent.change(screen.getByLabelText("Learning profile for Ana Silva"), {
    target: { value: "extending" },
  });
  await waitFor(() =>
    expect(handleUpdateStudentAcademicLevel).toHaveBeenCalledWith("student-1", "extending")
  );
});
