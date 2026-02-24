import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { expect, test, vi } from "vitest";
import GroupsPage from "./GroupsPage";

test("does not render student status indicators in generated groups", () => {
  render(
    <MemoryRouter initialEntries={["/groups?classId=class-1"]}>
      <GroupsPage
        formError=""
        classOptions={[{ id: "class-1", label: "Class A" }]}
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
  expect(screen.queryByText("✋")).toBeNull();
});
