export const ATTENDANCE_STATUSES = [
  {
    key: "present",
    value: "Present",
    label: "Present",
    shortLabel: "Present",
    kind: "present",
    color: "#16a34a",
    cssClass: "present",
  },
  {
    key: "late",
    value: "Arrived late",
    label: "Late",
    shortLabel: "Late",
    kind: "late",
    color: "#f59e0b",
    cssClass: "late",
  },
  {
    key: "leftEarly",
    value: "Left early",
    label: "Left early",
    shortLabel: "Left early",
    kind: "left-early",
    color: "#eab308",
    cssClass: "left-early",
  },
  {
    key: "absent",
    value: "Didn't come",
    label: "Didn't come",
    shortLabel: "Absent",
    kind: "absent",
    color: "#ef4444",
    cssClass: "absent",
  },
];

export const ATTENDANCE_STATUS_BY_KEY = ATTENDANCE_STATUSES.reduce((acc, status) => {
  acc[status.key] = status;
  return acc;
}, {});

export const ATTENDANCE_STATUS_BY_VALUE = ATTENDANCE_STATUSES.reduce((acc, status) => {
  acc[status.value] = status;
  return acc;
}, {});

export const ATTENDANCE_STATUS_VALUES = ATTENDANCE_STATUSES.map((status) => status.value);

export const DEFAULT_ATTENDANCE_STATUS = ATTENDANCE_STATUS_BY_KEY.present.value;
