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
  test("separates gender pools without omitting students and respects constraints", () => {
    const students = [
      { id: "m1", gender: "Male" }, { id: "m2", gender: " male " },
      { id: "f1", gender: "Female" }, { id: "f2", gender: "Female" },
      { id: "n1", gender: "Non-binary" }, { id: "u1", gender: "" }, { id: "u2", gender: "Prefer not to say" },
    ];
    const groups = generateGroups(students, 3, new Set(["m1|m2"]), { separateGender: true, balanceGender: true, respectSeparations: true }, buildAbilityMap(students));
    expect(groups.flat().map((student) => student.id).sort()).toEqual(students.map((student) => student.id).sort());
    expect(groups.every((group) => group.length <= 3)).toBe(true);
    for (const group of groups) {
      expect(new Set(group.map((student) => student.gender.trim().toLowerCase() || "prefer not to say")).size).toBe(1);
      expect(group.some((student) => student.id === "m1") && group.some((student) => student.id === "m2")).toBe(false);
    }
  });
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
      band: "needs_support",
      isSupportPartner: false,
    });
    expect(profiles.get("student-2")).toMatchObject({
      averagePercent: 100,
      band: "extending",
      isSupportPartner: true,
    });
  });

  test("averages within each subject before combining subjects", () => {
    const profiles = buildAbilityProfiles(
      "class-1",
      [{ id: "student-1" }],
      [
        { id: "math-1", class_id: "class-1", subject_id: "math", max_score: 10 },
        { id: "math-2", class_id: "class-1", subject_id: "math", max_score: 10 },
        { id: "reading-1", class_id: "class-1", subject_id: "reading", max_score: 10 },
      ],
      [
        { assessment_id: "math-1", student_id: "student-1", score: 10 },
        { assessment_id: "math-2", student_id: "student-1", score: 10 },
        { assessment_id: "reading-1", student_id: "student-1", score: 0 },
      ]
    );

    expect(profiles.get("student-1")).toMatchObject({
      averagePercent: 50,
      subjectCount: 2,
      sampleCount: 3,
      band: "developing",
      source: "assessment",
    });
    expect(profiles.get("student-1").subjectAverages).toEqual([
      { subjectId: "math", averagePercent: 100, sampleCount: 2 },
      { subjectId: "reading", averagePercent: 0, sampleCount: 1 },
    ]);
  });

  test("uses a teacher override ahead of assessments and works without scores", () => {
    const profiles = buildAbilityProfiles(
      "class-1",
      [
        { id: "student-1", academic_level_override: "extending" },
        { id: "student-2", academic_level_override: "needs_support" },
      ],
      [],
      []
    );

    expect(profiles.get("student-1")).toMatchObject({
      averagePercent: null,
      band: "extending",
      rank: 3,
      source: "manual",
      isSupportPartner: true,
    });
    expect(profiles.get("student-2")).toMatchObject({
      averagePercent: null,
      band: "needs_support",
      rank: 0,
      source: "manual",
      isSupportPartner: false,
    });
  });
});

describe("generateGroups academic profiles", () => {
  test("spreads teacher-selected profiles across groups when academic balance is enabled", () => {
    const profileKeys = ["needs_support", "developing", "on_track", "extending"];
    const students = profileKeys.flatMap((profileKey) =>
      [1, 2].map((index) => ({
        id: `${profileKey}-${index}`,
        academic_level_override: profileKey,
      }))
    );
    const profiles = buildAbilityProfiles("class-1", students, [], []);

    const groups = generateGroups(
      students,
      4,
      new Set(),
      { balanceAbility: true, balanceGender: false, pairSupportPartners: false },
      profiles
    );

    expect(groups).toHaveLength(2);
    groups.forEach((group) => {
      expect(group.map((student) => profiles.get(student.id).band).sort()).toEqual(
        [...profileKeys].sort()
      );
    });
  });
});
