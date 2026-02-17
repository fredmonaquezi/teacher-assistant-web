import assert from "node:assert/strict";
import test from "node:test";
import { ATTENDANCE_STATUS_BY_KEY } from "../constants/attendance.js";
import {
  createEmptyAttendanceSummary,
  getAttendanceRate,
  getAttendanceRateColor,
  getAttendanceStatusMeta,
  getAttendanceTotal,
  summarizeAttendanceEntries,
} from "./attendanceMetrics.js";

test("createEmptyAttendanceSummary initializes all known keys", () => {
  const summary = createEmptyAttendanceSummary();

  assert.deepEqual(summary, {
    present: 0,
    late: 0,
    leftEarly: 0,
    absent: 0,
  });
});

test("summarizeAttendanceEntries counts known statuses and ignores unknown values", () => {
  const entries = [
    { status: ATTENDANCE_STATUS_BY_KEY.present.value },
    { status: ATTENDANCE_STATUS_BY_KEY.present.value },
    { status: ATTENDANCE_STATUS_BY_KEY.late.value },
    { status: ATTENDANCE_STATUS_BY_KEY.absent.value },
    { status: "Unexpected status" },
    {},
  ];

  const summary = summarizeAttendanceEntries(entries);

  assert.equal(summary.present, 2);
  assert.equal(summary.late, 1);
  assert.equal(summary.absent, 1);
  assert.equal(summary.leftEarly, 0);
});

test("attendance totals and rate are derived correctly", () => {
  const summary = {
    present: 7,
    late: 1,
    leftEarly: 1,
    absent: 1,
  };

  assert.equal(getAttendanceTotal(summary), 10);
  assert.equal(getAttendanceRate(summary), 70);
});

test("attendance rate color thresholds remain stable", () => {
  assert.equal(getAttendanceRateColor(95), "#16a34a");
  assert.equal(getAttendanceRateColor(80), "#f59e0b");
  assert.equal(getAttendanceRateColor(50), "#ef4444");
});

test("getAttendanceStatusMeta returns fallback metadata for unknown status", () => {
  const fallback = getAttendanceStatusMeta("Custom value");

  assert.equal(fallback.key, "unknown");
  assert.equal(fallback.value, "Custom value");
  assert.equal(fallback.color, "#94a3b8");
});
