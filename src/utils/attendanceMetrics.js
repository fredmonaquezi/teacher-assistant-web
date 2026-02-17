import { ATTENDANCE_STATUSES, ATTENDANCE_STATUS_BY_VALUE } from "../constants/attendance";

export function createEmptyAttendanceSummary() {
  return ATTENDANCE_STATUSES.reduce((acc, status) => {
    acc[status.key] = 0;
    return acc;
  }, {});
}

export function summarizeAttendanceEntries(entries = []) {
  const summary = createEmptyAttendanceSummary();

  entries.forEach((entry) => {
    const key = ATTENDANCE_STATUS_BY_VALUE[entry?.status]?.key;
    if (!key) return;
    summary[key] += 1;
  });

  return summary;
}

export function getAttendanceTotal(summary) {
  return ATTENDANCE_STATUSES.reduce(
    (total, status) => total + Number(summary?.[status.key] || 0),
    0
  );
}

export function getAttendanceRate(summary) {
  const total = getAttendanceTotal(summary);
  if (total === 0) return 0;
  return Math.round((Number(summary?.present || 0) / total) * 100);
}

export function getAttendanceRateColor(rate) {
  if (rate >= 90) return "#16a34a";
  if (rate >= 75) return "#f59e0b";
  return "#ef4444";
}

export function getAttendanceStatusMeta(statusValue) {
  return (
    ATTENDANCE_STATUS_BY_VALUE[statusValue] || {
      key: "unknown",
      value: statusValue || "Unknown",
      label: statusValue || "Unknown",
      shortLabel: statusValue || "Unknown",
      kind: "unknown",
      color: "#94a3b8",
      cssClass: "absent",
    }
  );
}
