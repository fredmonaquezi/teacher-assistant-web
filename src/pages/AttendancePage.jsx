import { useEffect, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  isValid,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ptBR } from "date-fns/locale/pt-BR";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate, useSearchParams } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";
import {
  getAttendanceRate,
  getAttendanceRateColor,
  summarizeAttendanceEntries,
} from "../utils/attendanceMetrics";

const AttendancePage = ({
  classOptions,
  students,
  attendanceSessions,
  attendanceEntries,
  formError,
  setFormError,
  handleCreateAttendanceSessionForDate,
  handleDeleteAttendanceSession,
}) => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
  const attendanceClassStorageKey = "ta_attendance_active_class";
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";
  const classLabel = classOptions.find((option) => option.id === classId)?.label;
  const isClassLockedByQuery = Boolean(classId);
  const [isCreatingSession, setIsCreatingSession] = useState(false);
  const [deletingSessionId, setDeletingSessionId] = useState("");
  const [sessionToDelete, setSessionToDelete] = useState(null);
  const [activeClassId, setActiveClassId] = useState(() => {
    if (classId) return classId;
    if (typeof window === "undefined") return "";
    return window.sessionStorage.getItem(attendanceClassStorageKey) || "";
  });
  const effectiveClassId = classId || activeClassId;
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  useEffect(() => {
    if (classId || typeof window === "undefined") return;
    if (activeClassId) {
      window.sessionStorage.setItem(attendanceClassStorageKey, activeClassId);
    } else {
      window.sessionStorage.removeItem(attendanceClassStorageKey);
    }
  }, [activeClassId, classId]);

  const classStudents = effectiveClassId
    ? students.filter((student) => student.class_id === effectiveClassId)
    : [];
  const classSessions = effectiveClassId
    ? attendanceSessions.filter((session) => session.class_id === effectiveClassId)
    : [];
  const sessionIds = new Set(classSessions.map((session) => session.id));
  const classEntries = attendanceEntries.filter((entry) => sessionIds.has(entry.session_id));

  const classSummary = summarizeAttendanceEntries(classEntries);
  const attendanceRate = getAttendanceRate(classSummary);
  const attendanceRateColor = getAttendanceRateColor(attendanceRate);

  const formatSessionDate = (dateString) => {
    if (!dateString) return "";
    try {
      const parsedDate = parseISO(dateString);
      if (!isValid(parsedDate)) return dateString;
      return format(parsedDate, "PP", { locale });
    } catch {
      return dateString;
    }
  };

  const relativeDate = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    if (!isValid(date)) return dateString;
    if (isToday(date)) return t("attendance.relative.today");
    if (isYesterday(date)) return t("attendance.relative.yesterday");
    const diff = differenceInCalendarDays(new Date(), date);
    if (diff > 0 && diff <= 7) return t("attendance.relative.daysAgo", { count: diff });
    return format(date, "EEEE", { locale });
  };

  const getSessionStats = (sessionId) => {
    const entries = attendanceEntries.filter((entry) => entry.session_id === sessionId);
    const summary = summarizeAttendanceEntries(entries);
    const rate = getAttendanceRate(summary);
    const color = getAttendanceRateColor(rate);
    return { ...summary, rate, color };
  };

  const handleCreateSessionForDate = async (dateString) => {
    if (isCreatingSession) return false;
    setIsCreatingSession(true);
    setFormError("");
    try {
      const result = await handleCreateAttendanceSessionForDate(effectiveClassId, dateString);
      if (!result?.ok || !result.sessionId) return false;
      navigate(`/attendance/${result.sessionId}`);
      return true;
    } finally {
      setIsCreatingSession(false);
    }
  };

  const requestDeleteSession = (session) => {
    if (!session?.id || deletingSessionId) return;
    setSessionToDelete(session);
  };

  const confirmDeleteSession = async () => {
    if (!sessionToDelete?.id || deletingSessionId) return;
    setDeletingSessionId(sessionToDelete.id);
    setFormError("");
    try {
      await handleDeleteAttendanceSession(sessionToDelete.id);
    } finally {
      setDeletingSessionId("");
      setSessionToDelete(null);
    }
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel attendance-page">
        <div className="attendance-header">
          <div className="attendance-page-title">
            <h2>{t("attendance.title")}</h2>
            {classLabel && <div className="muted">{t("attendance.classLabel", { classLabel })}</div>}
          </div>
          <div className="attendance-actions">
            {!isClassLockedByQuery && (
              <select
                value={activeClassId}
                onChange={(event) => setActiveClassId(event.target.value)}
              >
                <option value="">{t("attendance.actions.selectClass")}</option>
                {classOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            )}
            <button
              type="button"
              onClick={() => {
                setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                setShowDatePicker(true);
              }}
              disabled={isCreatingSession}
            >
              {t("attendance.actions.byDate")}
            </button>
            <button
              type="button"
              className={isCreatingSession ? "button-with-spinner" : ""}
              onClick={() => handleCreateSessionForDate(format(new Date(), "yyyy-MM-dd"))}
              disabled={!effectiveClassId || isCreatingSession}
              aria-busy={isCreatingSession}
            >
              {isCreatingSession && <span className="inline-spinner" aria-hidden="true" />}
              {t("attendance.actions.today")}
            </button>
          </div>
        </div>

        {classSessions.length > 0 && (
          <div className="attendance-stats">
            <div className="stat-card attendance-stat-card">
              <div className="stat-value">{classSessions.length}</div>
              <div className="stat-label">{t("attendance.stats.totalSessions")}</div>
            </div>
            <div className="stat-card attendance-stat-card">
              <div className="stat-value">{classStudents.length}</div>
              <div className="stat-label">{t("attendance.stats.students")}</div>
            </div>
            <div className="stat-card attendance-stat-card">
              <div className="stat-value" style={{ color: attendanceRateColor }}>
                {attendanceRate}%
              </div>
              <div className="stat-label">{t("attendance.stats.attendanceRate")}</div>
            </div>
          </div>
        )}

        <div className="attendance-section">
          <h3>{t("attendance.sessions.title")}</h3>
          {classSessions.length === 0 ? (
            <div className="attendance-empty">
              <div className="attendance-empty-icon">📅</div>
              <div className="attendance-empty-title">{t("attendance.sessions.emptyTitle")}</div>
              <div className="muted">
                {t("attendance.sessions.emptyDescription")}
              </div>
            </div>
          ) : (
            <div className="attendance-grid">
              {classSessions.map((session) => {
                const stats = getSessionStats(session.id);
                return (
                  <NavLink
                    to={`/attendance/${session.id}`}
                    key={session.id}
                    className="attendance-card"
                  >
                    <div className="attendance-card-header">
                      <div>
                        <div className="attendance-card-date">
                          {formatSessionDate(session.session_date)}
                        </div>
                        <div className="attendance-date-chip">{relativeDate(session.session_date)}</div>
                      </div>
                      <button
                        type="button"
                        className={`icon-button ${deletingSessionId === session.id ? "button-with-spinner" : ""}`}
                        onClick={(event) => {
                          event.preventDefault();
                          requestDeleteSession(session);
                        }}
                        aria-label={t("attendance.aria.deleteSession")}
                        disabled={Boolean(deletingSessionId)}
                        aria-busy={deletingSessionId === session.id}
                      >
                        {deletingSessionId === session.id ? (
                          <span className="inline-spinner" aria-hidden="true" />
                        ) : (
                          "✕"
                        )}
                      </button>
                    </div>

                    <div className="attendance-card-stats">
                      <div className="attendance-card-stat">
                        <div className="attendance-card-stat-label">{t("attendance.status.present.short")}</div>
                        <strong className="attendance-card-stat-value present">{stats.present}</strong>
                      </div>
                      <div className="attendance-card-stat">
                        <div className="attendance-card-stat-label">{t("attendance.status.absent.label")}</div>
                        <strong className="attendance-card-stat-value absent">{stats.absent}</strong>
                      </div>
                      <div className="attendance-card-stat">
                        <div className="attendance-card-stat-label">{t("attendance.status.late.short")}</div>
                        <strong className="attendance-card-stat-value late">{stats.late}</strong>
                      </div>
                      <div className="attendance-card-stat">
                        <div className="attendance-card-stat-label">{t("attendance.status.leftEarly.short")}</div>
                        <strong className="attendance-card-stat-value early">{stats.leftEarly}</strong>
                      </div>
                    </div>

                    <div className="attendance-rate">
                      <div className="attendance-rate-label">{t("attendance.stats.attendanceRate")}</div>
                      <div className="attendance-rate-bar">
                        <span
                          style={{
                            width: `${stats.rate}%`,
                            background: stats.color,
                          }}
                        />
                      </div>
                      <div className="attendance-rate-value" style={{ color: stats.color }}>
                        {stats.rate}%
                      </div>
                    </div>
                  </NavLink>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {showDatePicker && (
        <div className="modal-overlay">
          <div className="modal-card attendance-modal">
            <div className="attendance-modal-header">
              <div className="attendance-modal-icon">📅</div>
              <h3>{t("attendance.modal.title")}</h3>
              <div className="muted">{t("attendance.modal.description")}</div>
            </div>
            <label className="stack">
              <span>{t("attendance.modal.selectDate")}</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <div className="attendance-modal-date">
              {t("attendance.modal.selectedDate", { date: selectedDate })}
            </div>
            <div className="modal-actions attendance-modal-actions">
              <button
                type="button"
                className="link"
                onClick={() => setShowDatePicker(false)}
              >
                {t("common.actions.cancel")}
              </button>
              <button
                type="button"
                className={isCreatingSession ? "button-with-spinner" : ""}
                onClick={async () => {
                  const ok = await handleCreateSessionForDate(selectedDate);
                  if (ok) setShowDatePicker(false);
                }}
                disabled={!selectedDate || isCreatingSession}
                aria-busy={isCreatingSession}
              >
                {isCreatingSession && <span className="inline-spinner" aria-hidden="true" />}
                {t("attendance.modal.createSession")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(sessionToDelete)}
        title={t("common.actions.delete")}
        description={t("attendance.confirm.deleteSession")}
        onCancel={() => setSessionToDelete(null)}
        onConfirm={confirmDeleteSession}
        confirmDisabled={Boolean(deletingSessionId)}
      />
    </>
  );
};

export default AttendancePage;
