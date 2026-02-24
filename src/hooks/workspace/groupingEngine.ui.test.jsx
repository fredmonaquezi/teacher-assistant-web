import { afterEach, describe, expect, test, vi } from "vitest";
import { generateGroups } from "./groupingEngine";

function buildAbilityMap(students) {
  return new Map(
    students.map((student) => [
      student.id,
      {
        averagePercent: 70,
        band: "proficient",
        rank: 1,
        isSupportPartner: false,
      },
    ])
  );
}

describe("generateGroups balanceGender", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  test("spreads boys across groups when counts allow one per group", () => {
    const maleStudents = Array.from({ length: 4 }, (_, index) => ({
      id: `male-${index + 1}`,
      gender: "Male",
      needs_help: false,
    }));
    const femaleStudents = Array.from({ length: 12 }, (_, index) => ({
      id: `female-${index + 1}`,
      gender: "Female",
      needs_help: false,
    }));
    const students = [...maleStudents, ...femaleStudents];
    const abilityByStudentId = buildAbilityMap(students);

    vi.spyOn(Math, "random").mockReturnValue(0);

    const groups = generateGroups(
      students,
      4,
      new Set(),
      {
        balanceGender: true,
        balanceAbility: false,
        pairSupportPartners: false,
        respectSeparations: false,
      },
      abilityByStudentId
    );

    expect(groups).toHaveLength(4);

    const boysPerGroup = groups.map(
      (group) =>
        group.filter((student) => (student.gender || "").trim().toLowerCase() === "male").length
    );
    expect(boysPerGroup).toEqual([1, 1, 1, 1]);
  });
});
