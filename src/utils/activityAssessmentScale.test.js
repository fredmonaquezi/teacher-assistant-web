import test from "node:test";
import assert from "node:assert/strict";
import {
  ACTIVITY_ASSESSMENT_SCALES,
  activityAssessmentMeetsExpectations,
  activityAssessmentOptions,
  activityAssessmentToPercent,
  formatActivityAssessment,
  isActivityGrade,
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
  assert.equal(activityAssessmentMeetsExpectations("grade_7"), false);
  assert.equal(activityAssessmentMeetsExpectations("grade_8"), true);
});
