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

export const ACTIVITY_PERFORMANCE_LEVELS = [
  { key: "needs_support", label: "Needs support", minPercent: 0 },
  { key: "working_towards", label: "Working towards", minPercent: 50 },
  { key: "met", label: "Met expectations", minPercent: 70 },
  { key: "exceeded", label: "Exceeded expectations", minPercent: 85 },
];

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
  return activityAssessmentToPercent(value) >= 70;
}

export function activityAssessmentLevelFromPercent(percent) {
  if (!Number.isFinite(percent)) return null;
  return [...ACTIVITY_PERFORMANCE_LEVELS]
    .reverse()
    .find((level) => percent >= level.minPercent) || ACTIVITY_PERFORMANCE_LEVELS[0];
}

export function summarizeActivityAssessmentResults(samples = []) {
  const percentsBySubject = new Map();
  let meetingExpectations = 0;
  let sampleCount = 0;

  samples.forEach((sample) => {
    const percent = activityAssessmentToPercent(sample?.outcome);
    if (!Number.isFinite(percent)) return;
    const subjectKey = sample?.subjectKey || "general";
    if (!percentsBySubject.has(subjectKey)) percentsBySubject.set(subjectKey, []);
    percentsBySubject.get(subjectKey).push(percent);
    sampleCount += 1;
    if (activityAssessmentMeetsExpectations(sample.outcome)) meetingExpectations += 1;
  });

  const subjectAverages = [...percentsBySubject.entries()].map(([subjectKey, percents]) => ({
    subjectKey,
    averagePercent: percents.reduce((total, percent) => total + percent, 0) / percents.length,
    sampleCount: percents.length,
  }));
  const averagePercent = subjectAverages.length
    ? subjectAverages.reduce((total, subject) => total + subject.averagePercent, 0) / subjectAverages.length
    : null;
  const level = activityAssessmentLevelFromPercent(averagePercent);

  return {
    averageGrade: Number.isFinite(averagePercent) ? averagePercent / 10 : null,
    averagePercent,
    levelKey: level?.key || "",
    levelLabel: level?.label || "",
    meetingExpectations,
    sampleCount,
    subjectAverages,
    subjectCount: subjectAverages.length,
  };
}
