import { useState } from "react";
import { format, parseISO } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ptBR } from "date-fns/locale/pt-BR";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import {
  ATTENDANCE_STATUSES,
  ATTENDANCE_STATUS_BY_KEY,
} from "../constants/attendance";
import {
  getAttendanceRate,
  getAttendanceRateColor,
  getAttendanceStatusMeta,
  summarizeAttendanceEntries,
} from "../utils/attendanceMetrics";

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
  const { t } = useTranslation();
  const [noteValue, setNoteValue] = useState(entry.note || "");
  const statusMeta = getAttendanceStatusMeta(entry.status);
  const statusColor = statusMeta.color;

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
          {ATTENDANCE_STATUSES.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`status-btn ${status.cssClass} ${entry.status === status.value ? "selected" : ""}`}
              style={
                entry.status === status.value
                  ? { background: status.color, color: "#fff" }
                  : undefined
              }
              onClick={() => handleUpdateAttendanceEntry(entry.id, { status: status.value })}
              aria-label={t(`attendance.status.${status.key}.label`)}
              title={t(`attendance.status.${status.key}.label`)}
            >
              <span className="status-btn-icon">
                <StatusIcon kind={status.kind} />
              </span>
              <span className="status-btn-text">{t(`attendance.status.${status.key}.short`)}</span>
            </button>
          ))}
        </div>
      </div>

      {entry.status !== ATTENDANCE_STATUS_BY_KEY.present.value && (
        <div className="attendance-note">
          <span className="muted">{t("attendance.note.label")}</span>
          <input
            value={noteValue}
            onChange={(event) => setNoteValue(event.target.value)}
            onBlur={() =>
              handleUpdateAttendanceEntry(entry.id, {
                note: noteValue.trim() || null,
              })
            }
            placeholder={t("attendance.note.placeholder")}
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
  const { t, i18n } = useTranslation();
  const { sessionId } = useParams();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
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

  const counts = summarizeAttendanceEntries(sessionEntries);
  const summaryRate = getAttendanceRate(counts);
  const summaryColor = getAttendanceRateColor(summaryRate);

  if (!session) {
    return (
      <section className="panel">
        <h2>{t("attendance.sessionDetail.notFoundTitle")}</h2>
        <p className="muted">{t("attendance.sessionDetail.notFoundDescription")}</p>
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
              {format(parseISO(session.session_date), "PPPP", { locale })}
            </div>
            <div className="muted">
              {sessionClass ? sessionClass.name : t("attendance.classFallback")} •{" "}
              {t("attendance.count.students", { count: sessionEntries.length })}
            </div>
          </div>
        </div>

        <div className="attendance-summary-stats">
          <div>
            <div className="muted">{t("attendance.status.present.short")}</div>
            <strong style={{ color: "#16a34a" }}>{counts.present}</strong>
          </div>
          <div>
            <div className="muted">{t("attendance.status.absent.label")}</div>
            <strong style={{ color: "#ef4444" }}>{counts.absent}</strong>
          </div>
          <div>
            <div className="muted">{t("attendance.status.late.short")}</div>
            <strong style={{ color: "#f59e0b" }}>{counts.late}</strong>
          </div>
          <div>
            <div className="muted">{t("attendance.status.leftEarly.short")}</div>
            <strong style={{ color: "#eab308" }}>{counts.leftEarly}</strong>
          </div>
        </div>

        <div className="attendance-rate">
          <div className="muted">{t("attendance.stats.attendanceRate")}</div>
          <div className="attendance-rate-bar">
            <span style={{ width: `${summaryRate}%`, background: summaryColor }} />
          </div>
          <div className="attendance-rate-value" style={{ color: summaryColor }}>
            {summaryRate}%
          </div>
        </div>
      </div>

      <div className="attendance-student-list">
        <h3>{t("attendance.sessionDetail.markAttendance")}</h3>
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
