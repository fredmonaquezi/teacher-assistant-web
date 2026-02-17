import assert from "node:assert/strict";
import test from "node:test";
import {
  averageFromPercents,
  entryToPercent,
  getAssessmentMaxScore,
  performanceColor,
  scoreToPercent,
} from "./assessmentMetrics.js";

test("getAssessmentMaxScore falls back to default when value is missing/invalid", () => {
  assert.equal(getAssessmentMaxScore({ max_score: 20 }), 20);
  assert.equal(getAssessmentMaxScore({ max_score: 0 }), 10);
  assert.equal(getAssessmentMaxScore({ max_score: null }), 10);
  assert.equal(getAssessmentMaxScore(undefined), 10);
});

test("scoreToPercent returns null for invalid inputs and percent for valid inputs", () => {
  assert.equal(scoreToPercent(8, 10), 80);
  assert.equal(scoreToPercent("5", "20"), 25);
  assert.equal(scoreToPercent("x", 10), null);
  assert.equal(scoreToPercent(5, 0), null);
});

test("entryToPercent resolves assessment max score and computes percentage", () => {
  const assessmentById = new Map([
    ["a1", { id: "a1", max_score: 25 }],
    ["a2", { id: "a2", max_score: null }],
  ]);

  assert.equal(entryToPercent({ assessment_id: "a1", score: 20 }, assessmentById), 80);
  assert.equal(entryToPercent({ assessment_id: "a2", score: 5 }, assessmentById), 50);
  assert.equal(entryToPercent(null, assessmentById), null);
});

test("averageFromPercents ignores invalid values", () => {
  assert.equal(averageFromPercents([80, 60, 100]), 80);
  assert.equal(averageFromPercents([80, null, Number.NaN, 40]), 60);
  assert.equal(averageFromPercents([null, Number.NaN]), 0);
});

test("performanceColor threshold mapping stays stable", () => {
  assert.equal(performanceColor(85), "#16a34a");
  assert.equal(performanceColor(60), "#ea580c");
  assert.equal(performanceColor(40), "#dc2626");
});
