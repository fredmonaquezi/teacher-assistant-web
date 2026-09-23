import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_ASSESSMENT_SCALES,
  activityAssessmentLevelFromPercent,
  activityAssessmentMeetsExpectations,
  activityAssessmentOptions,
  activityAssessmentToPercent,
  formatActivityAssessment,
  isActivityGrade,
  summarizeActivityAssessmentResults,
} from "./activityAssessmentScale.js";

test("provides all eleven grade choices from 0 through 10", () => {
  const options = activityAssessmentOptions(ACTIVITY_ASSESSMENT_SCALES.GRADE);
  assert.equal(options.length, 11);
  assert.deepEqual(options[0], { value: "grade_0", label: "0 / 10" });
  assert.deepEqual(options[10], { value: "grade_10", label: "10 / 10" });
});

test("formats and converts numeric grades without changing legacy outcomes", () => {
  assert.equal(isActivityGrade("grade_8"), true);
  assert.equal(isActivityGrade("grade_11"), false);
  assert.equal(formatActivityAssessment("grade_8"), "8 / 10");
  assert.equal(formatActivityAssessment("working_towards"), "Working towards");
  assert.equal(activityAssessmentToPercent("grade_8"), 80);
  assert.equal(activityAssessmentToPercent("met"), 75);
  assert.equal(activityAssessmentMeetsExpectations("grade_6"), false);
  assert.equal(activityAssessmentMeetsExpectations("grade_7"), true);
  assert.equal(activityAssessmentMeetsExpectations("grade_8"), true);
});

test("uses consistent written levels for numerical averages", () => {
  assert.equal(activityAssessmentLevelFromPercent(49.9).key, "needs_support");
  assert.equal(activityAssessmentLevelFromPercent(50).key, "working_towards");
  assert.equal(activityAssessmentLevelFromPercent(70).key, "met");
  assert.equal(activityAssessmentLevelFromPercent(85).key, "exceeded");
  assert.equal(activityAssessmentLevelFromPercent(null), null);
});

test("summarizes mixed qualitative and numerical results in both forms", () => {
  const summary = summarizeActivityAssessmentResults([
    { subjectKey: "math", outcome: "met" },
    { subjectKey: "math", outcome: "grade_8" },
  ]);

  assert.equal(summary.averagePercent, 77.5);
  assert.equal(summary.averageGrade, 7.75);
  assert.equal(summary.levelKey, "met");
  assert.equal(summary.levelLabel, "Met expectations");
  assert.equal(summary.meetingExpectations, 2);
  assert.equal(summary.sampleCount, 2);
});

test("averages within subjects before giving every subject equal weight", () => {
  const summary = summarizeActivityAssessmentResults([
    { subjectKey: "math", outcome: "exceeded" },
    { subjectKey: "math", outcome: "met" },
    { subjectKey: "english", outcome: "grade_6" },
  ]);

  assert.equal(summary.averagePercent, 73.75);
  assert.equal(summary.averageGrade, 7.375);
  assert.equal(summary.levelLabel, "Met expectations");
  assert.equal(summary.subjectCount, 2);
  assert.deepEqual(summary.subjectAverages, [
    { subjectKey: "math", averagePercent: 87.5, sampleCount: 2 },
    { subjectKey: "english", averagePercent: 60, sampleCount: 1 },
  ]);
});
