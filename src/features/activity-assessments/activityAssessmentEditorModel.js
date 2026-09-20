export const OTHER_SUBJECT_VALUE = "__other__";

let newCriterionSequence = 0;

export function byStudentName(first, second) {
  return `${first.first_name || ""} ${first.last_name || ""}`.localeCompare(
    `${second.first_name || ""} ${second.last_name || ""}`,
    undefined,
    { sensitivity: "base" }
  );
}

export const emptyStudentResult = () => ({ outcome: "", notes: "", assessedAt: "" });

export function createEmptyCriterion() {
  newCriterionSequence += 1;
  return { clientId: `new-criterion-${newCriterionSequence}`, title: "", description: "" };
}

export const criterionResultKey = (criterionId, studentId) => `${criterionId}:${studentId}`;
