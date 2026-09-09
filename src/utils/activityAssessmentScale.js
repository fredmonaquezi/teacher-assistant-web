export const ACTIVITY_ASSESSMENT_SCALES = {
  OUTCOME: "outcome",
  GRADE: "grade",
};

export const ACTIVITY_OUTCOME_OPTIONS = [
  { value: "needs_support", label: "Needs support" },
  { value: "working_towards", label: "Working towards" },
  { value: "met", label: "Met" },
  { value: "exceeded", label: "Exceeded" },
];

export const ACTIVITY_GRADE_OPTIONS = Array.from({ length: 11 }, (_, grade) => ({
  value: `grade_${grade}`,
  label: `${grade} / 10`,
}));

export function activityAssessmentOptions(scale) {
  return scale === ACTIVITY_ASSESSMENT_SCALES.GRADE
    ? ACTIVITY_GRADE_OPTIONS
    : ACTIVITY_OUTCOME_OPTIONS;
}

export function isActivityGrade(value) {
  return /^grade_(?:10|[0-9])$/.test(value || "");
}

export function formatActivityAssessment(value) {
  if (isActivityGrade(value)) return `${value.slice(6)} / 10`;
  return ACTIVITY_OUTCOME_OPTIONS.find((option) => option.value === value)?.label
    || (value || "").replaceAll("_", " ");
}

export function activityAssessmentToPercent(value) {
  if (isActivityGrade(value)) return Number(value.slice(6)) * 10;
  return {
    needs_support: 25,
    working_towards: 50,
    met: 75,
    exceeded: 100,
  }[value];
}

export function activityAssessmentMeetsExpectations(value) {
  return activityAssessmentToPercent(value) >= 75;
}
