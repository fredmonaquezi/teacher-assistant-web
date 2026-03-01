import { memo, startTransition, useCallback, useDeferredValue, useMemo, useState } from "react";
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

const INITIAL_VISIBLE_ATTENDANCE_ROWS = 64;
const VISIBLE_ATTENDANCE_ROW_STEP = 64;

const AttendanceEntryRow = memo(function AttendanceEntryRow({
  entry,
  student,
  handleUpdateAttendanceEntry,
}) {
  const { t } = useTranslation();
  const statusMeta = getAttendanceStatusMeta(entry.status);
  const statusColor = statusMeta.color;
  const noteInputKey = `${entry.id}:${entry.note || ""}`;

  const updateStatus = useCallback(
    (statusValue) => {
      startTransition(() => {
        handleUpdateAttendanceEntry(entry.id, { status: statusValue });
      });
    },
    [entry.id, handleUpdateAttendanceEntry]
  );

  const updateNote = useCallback(
    (noteValue) => {
      startTransition(() => {
        handleUpdateAttendanceEntry(entry.id, {
          note: noteValue.trim() || null,
        });
      });
    },
    [entry.id, handleUpdateAttendanceEntry]
  );

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
              onClick={() => updateStatus(status.value)}
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
            key={noteInputKey}
            defaultValue={entry.note || ""}
            onBlur={(event) => updateNote(event.target.value)}
            placeholder={t("attendance.note.placeholder")}
          />
        </div>
      )}
    </div>
  );
}, (prevProps, nextProps) => {
  if (prevProps.handleUpdateAttendanceEntry !== nextProps.handleUpdateAttendanceEntry) return false;
  if (prevProps.entry.id !== nextProps.entry.id) return false;
  if (prevProps.entry.status !== nextProps.entry.status) return false;
  if ((prevProps.entry.note || "") !== (nextProps.entry.note || "")) return false;
  if (prevProps.student.id !== nextProps.student.id) return false;
  if (prevProps.student.first_name !== nextProps.student.first_name) return false;
  if (prevProps.student.last_name !== nextProps.student.last_name) return false;
  return true;
});

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
  const [visibleRowCount, setVisibleRowCount] = useState(INITIAL_VISIBLE_ATTENDANCE_ROWS);
  const session = useMemo(
    () => attendanceSessions.find((item) => item.id === sessionId),
    [attendanceSessions, sessionId]
  );
  const sessionEntries = useMemo(
    () => attendanceEntries.filter((entry) => entry.session_id === sessionId),
    [attendanceEntries, sessionId]
  );
  const deferredSessionEntries = useDeferredValue(sessionEntries);
  const sessionClass = useMemo(
    () => classes.find((classItem) => classItem.id === session?.class_id),
    [classes, session?.class_id]
  );
  const studentsById = useMemo(() => new Map(students.map((student) => [student.id, student])), [students]);
  const rows = useMemo(
    () =>
      deferredSessionEntries
        .map((entry) => ({
          entry,
          student: studentsById.get(entry.student_id) || null,
        }))
        .filter((row) => row.student && row.student.class_id === session?.class_id)
        .sort((a, b) => {
          const orderDiff = Number(a.student.sort_order ?? 0) - Number(b.student.sort_order ?? 0);
          if (orderDiff !== 0) return orderDiff;
          const aName = `${a.student.first_name || ""} ${a.student.last_name || ""}`.trim();
          const bName = `${b.student.first_name || ""} ${b.student.last_name || ""}`.trim();
          return aName.localeCompare(bName);
        }),
    [deferredSessionEntries, session?.class_id, studentsById]
  );
  const visibleRows = rows.slice(0, visibleRowCount);
  const hasMoreRows = visibleRows.length < rows.length;
  const listIsPending = deferredSessionEntries !== sessionEntries;

  const counts = summarizeAttendanceEntries(deferredSessionEntries);
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
              {t("attendance.count.students", { count: deferredSessionEntries.length })}
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
        {visibleRows.map(({ student, entry }) => (
          <AttendanceEntryRow
            key={entry.id}
            entry={entry}
            student={student}
            handleUpdateAttendanceEntry={handleUpdateAttendanceEntry}
          />
        ))}
        {rows.length > 0 && (
          <p className="muted">
            {t("attendance.sessionDetail.resultsSummary", {
              shown: visibleRows.length,
              total: rows.length,
            })}
            {listIsPending ? ` ${t("attendance.sessionDetail.updatingList")}` : ""}
          </p>
        )}
        {hasMoreRows && (
          <button
            type="button"
            className="secondary"
            onClick={() =>
              startTransition(() => {
                setVisibleRowCount((current) =>
                  Math.min(current + VISIBLE_ATTENDANCE_ROW_STEP, rows.length)
                );
              })
            }
          >
            {t("attendance.sessionDetail.showMore")}
          </button>
        )}
      </div>
    </section>
  );
}

export default AttendanceSessionDetailPage;
