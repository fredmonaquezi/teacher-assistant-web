import { afterEach, describe, expect, test, vi } from "vitest";
import { buildAbilityProfiles, generateGroups } from "./groupingEngine";

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

  test("never omits students when separation rules require extra groups", () => {
    const students = Array.from({ length: 10 }, (_, index) => ({
      id: `student-${index + 1}`,
      gender: "Prefer not to say",
      needs_help: false,
    }));
    const constraints = new Set();
    students.forEach((student, studentIndex) => {
      students.slice(studentIndex + 1).forEach((otherStudent) => {
        const [firstId, secondId] =
          student.id < otherStudent.id
            ? [student.id, otherStudent.id]
            : [otherStudent.id, student.id];
        constraints.add(`${firstId}|${secondId}`);
      });
    });

    const groups = generateGroups(
      students,
      4,
      constraints,
      {
        balanceGender: false,
        balanceAbility: false,
        pairSupportPartners: false,
        respectSeparations: true,
      },
      buildAbilityMap(students),
      1
    );

    expect(groups.flat()).toHaveLength(students.length);
    expect(groups.every((group) => group.length === 1)).toBe(true);
  });
});

describe("buildAbilityProfiles activity assessments", () => {
  test("uses current activity outcomes when calculating academic balance", () => {
    const students = [
      { id: "student-1", needs_help: true },
      { id: "student-2", needs_help: false },
    ];

    const profiles = buildAbilityProfiles(
      "class-1",
      students,
      [],
      [],
      [{ id: "activity-1", class_id: "class-1" }],
      [
        {
          activity_assessment_id: "activity-1",
          student_id: "student-1",
          outcome: "needs_support",
        },
        {
          activity_assessment_id: "activity-1",
          student_id: "student-2",
          outcome: "exceeded",
        },
      ]
    );

    expect(profiles.get("student-1")).toMatchObject({
      averagePercent: 25,
      band: "developing",
      isSupportPartner: false,
    });
    expect(profiles.get("student-2")).toMatchObject({
      averagePercent: 100,
      band: "advanced",
      isSupportPartner: true,
    });
  });
});
