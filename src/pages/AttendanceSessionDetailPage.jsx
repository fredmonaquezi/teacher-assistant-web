import { useState } from "react";
import { format, parseISO } from "date-fns";
import { useParams } from "react-router-dom";

const STATUS_BUTTONS = [
  { value: "Present", shortLabel: "Present", kind: "present", color: "#16a34a" },
  { value: "Arrived late", shortLabel: "Late", kind: "late", color: "#f59e0b" },
  { value: "Left early", shortLabel: "Left early", kind: "left-early", color: "#eab308" },
  { value: "Didn't come", shortLabel: "Absent", kind: "absent", color: "#ef4444" },
];

function StatusIcon({ kind }) {
  if (kind === "present") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M4.5 10.2 8.2 13.8 15.5 6.5" />
      </svg>
    );
  }
  if (kind === "late") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="10" r="6.2" />
        <path d="M10 6.6v3.8l2.6 1.6" />
      </svg>
    );
  }
  if (kind === "left-early") {
    return (
      <svg viewBox="0 0 20 20" aria-hidden="true">
        <path d="M15.5 10H7.5" />
        <path d="m10.8 6.8-3.3 3.2 3.3 3.2" />
        <path d="M16.5 4.8v10.4" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 20 20" aria-hidden="true">
      <path d="M5.4 5.4 14.6 14.6" />
      <path d="M14.6 5.4 5.4 14.6" />
    </svg>
  );
}

function AttendanceEntryRow({ entry, student, handleUpdateAttendanceEntry }) {
  const [noteValue, setNoteValue] = useState(entry.note || "");
  const statusColor =
    STATUS_BUTTONS.find((item) => item.value === entry.status)?.color || "#94a3b8";

  return (
    <div className="attendance-student-card">
      <div className="attendance-student-row">
        <div className="attendance-student-info">
          <div
            className="attendance-avatar"
            style={{ background: `${statusColor}22`, color: statusColor }}
          >
            👤
          </div>
          <div>
            <div className="attendance-student-name">
              {student.first_name} {student.last_name}
            </div>
          </div>
        </div>
        <div className="attendance-status-buttons">
          {STATUS_BUTTONS.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`status-btn ${
                status.value === "Present"
                  ? "present"
                  : status.value === "Arrived late"
                    ? "late"
                    : status.value === "Left early"
                      ? "left-early"
                      : "absent"
              } ${entry.status === status.value ? "selected" : ""}`}
              style={
                entry.status === status.value
                  ? { background: status.color, color: "#fff" }
                  : undefined
              }
              onClick={() => handleUpdateAttendanceEntry(entry.id, { status: status.value })}
              aria-label={status.value}
              title={status.value}
            >
              <span className="status-btn-icon">
                <StatusIcon kind={status.kind} />
              </span>
              <span className="status-btn-text">{status.shortLabel}</span>
            </button>
          ))}
        </div>
      </div>

      {entry.status !== "Present" && (
        <div className="attendance-note">
          <span className="muted">Notes</span>
          <input
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            onBlur={() =>
              handleUpdateAttendanceEntry(entry.id, {
                note: noteValue.trim() || null,
              })
            }
            placeholder="Add notes (optional)"
          />
        </div>
      )}
    </div>
  );
}

function AttendanceSessionDetailPage({
  attendanceSessions,
  attendanceEntries,
  classes,
  students,
  handleUpdateAttendanceEntry,
}) {
  const { sessionId } = useParams();
  const session = attendanceSessions.find((item) => item.id === sessionId);
  const sessionEntries = attendanceEntries.filter((entry) => entry.session_id === sessionId);
  const sessionClass = classes.find((classItem) => classItem.id === session?.class_id);
  const sessionStudents = students
    .filter((student) => student.class_id === session?.class_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const entryMap = new Map(sessionEntries.map((entry) => [entry.student_id, entry]));
  const rows = sessionStudents.map((student) => ({
    student,
    entry: entryMap.get(student.id),
  }));

  const counts = {
    present: sessionEntries.filter((entry) => entry.status === "Present").length,
    absent: sessionEntries.filter((entry) => entry.status === "Didn't come").length,
    late: sessionEntries.filter((entry) => entry.status === "Arrived late").length,
    leftEarly: sessionEntries.filter((entry) => entry.status === "Left early").length,
  };

  const summaryRate = sessionEntries.length
    ? Math.round((counts.present / sessionEntries.length) * 100)
    : 0;

  const summaryColor =
    summaryRate >= 90 ? "#16a34a" : summaryRate >= 75 ? "#f59e0b" : "#ef4444";

  if (!session) {
    return (
      <section className="panel">
        <h2>Session not found</h2>
        <p className="muted">Select a session from Attendance.</p>
      </section>
    );
  }

  return (
    <section className="panel attendance-session">
      <div className="attendance-session-summary">
        <div className="attendance-summary-header">
          <div className="attendance-summary-icon">📆</div>
          <div>
            <div className="attendance-summary-title">
              {format(parseISO(session.session_date), "MMMM d, yyyy")}
            </div>
            <div className="muted">
              {sessionClass ? sessionClass.name : "Class"} • {sessionEntries.length} students
            </div>
          </div>
        </div>

        <div className="attendance-summary-stats">
          <div>
            <div className="muted">Present</div>
            <strong style={{ color: "#16a34a" }}>{counts.present}</strong>
          </div>
          <div>
            <div className="muted">Didn't come</div>
            <strong style={{ color: "#ef4444" }}>{counts.absent}</strong>
          </div>
          <div>
            <div className="muted">Late</div>
            <strong style={{ color: "#f59e0b" }}>{counts.late}</strong>
          </div>
          <div>
            <div className="muted">Left early</div>
            <strong style={{ color: "#eab308" }}>{counts.leftEarly}</strong>
          </div>
        </div>

        <div className="attendance-rate">
          <div className="muted">Attendance Rate</div>
          <div className="attendance-rate-bar">
            <span style={{ width: `${summaryRate}%`, background: summaryColor }} />
          </div>
          <div className="attendance-rate-value" style={{ color: summaryColor }}>
            {summaryRate}%
          </div>
        </div>
      </div>

      <div className="attendance-student-list">
        <h3>Mark Attendance</h3>
        {rows.map(({ student, entry }) =>
          entry ? (
            <AttendanceEntryRow
              key={`${entry.id}:${entry.note || ""}:${entry.status}`}
              entry={entry}
              student={student}
              handleUpdateAttendanceEntry={handleUpdateAttendanceEntry}
            />
          ) : null
        )}
      </div>
    </section>
  );
}

export default AttendanceSessionDetailPage;
