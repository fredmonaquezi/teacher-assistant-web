import { useEffect, useState } from "react";
import {
  differenceInCalendarDays,
  format,
  isToday,
  isYesterday,
  parseISO,
} from "date-fns";
import { NavLink, useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const AttendancePage = ({
  classOptions,
  students,
  attendanceSessions,
  attendanceEntries,
  formError,
  setFormError,
  loadData,
}) => {
  const attendanceClassStorageKey = "ta_attendance_active_class";
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";
  const classLabel = classOptions.find((option) => option.id === classId)?.label;
  const isClassLockedByQuery = Boolean(classId);
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

  const presentCount = classEntries.filter((entry) => entry.status === "Present").length;
  const totalEntries = classEntries.length;
  const attendanceRate = totalEntries ? Math.round((presentCount / totalEntries) * 100) : 0;
  const attendanceRateColor =
    attendanceRate >= 90 ? "#16a34a" : attendanceRate >= 75 ? "#f59e0b" : "#ef4444";

  const formatSessionDate = (dateString) => {
    if (!dateString) return "";
    try {
      return format(parseISO(dateString), "MMM d, yyyy");
    } catch {
      return dateString;
    }
  };

  const relativeDate = (dateString) => {
    if (!dateString) return "";
    const date = parseISO(dateString);
    if (isToday(date)) return "Today";
    if (isYesterday(date)) return "Yesterday";
    const diff = differenceInCalendarDays(new Date(), date);
    if (diff > 0 && diff <= 7) return `${diff} days ago`;
    return format(date, "EEEE");
  };

  const getSessionStats = (sessionId) => {
    const entries = attendanceEntries.filter((entry) => entry.session_id === sessionId);
    const present = entries.filter((entry) => entry.status === "Present").length;
    const absent = entries.filter((entry) => entry.status === "Didn't come").length;
    const late = entries.filter((entry) => entry.status === "Arrived late").length;
    const leftEarly = entries.filter((entry) => entry.status === "Left early").length;
    const total = entries.length;
    const rate = total ? Math.round((present / total) * 100) : 0;
    const color = rate >= 90 ? "#16a34a" : rate >= 75 ? "#f59e0b" : "#ef4444";
    return { present, absent, late, leftEarly, rate, color };
  };

  const handleCreateSessionForDate = async (dateString) => {
    setFormError("");
    if (!effectiveClassId) {
      setFormError("Select a class first.");
      return;
    }
    if (!dateString) {
      setFormError("Choose a date.");
      return;
    }
    const exists = classSessions.some((session) => session.session_date === dateString);
    if (exists) {
      setFormError("A session already exists for that date.");
      return;
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("attendance_sessions")
      .insert({
        session_date: dateString,
        title: null,
        class_id: effectiveClassId,
      })
      .select()
      .single();
    if (sessionError) {
      setFormError(sessionError.message);
      return;
    }

    if (classStudents.length > 0) {
      const entryRows = classStudents.map((student) => ({
        session_id: sessionRow.id,
        student_id: student.id,
        status: "Present",
        note: null,
      }));
      const { error: entryError } = await supabase
        .from("attendance_entries")
        .insert(entryRows);
      if (entryError) {
        setFormError(entryError.message);
        return;
      }
    }

    await loadData();
  };

  const handleDeleteSession = async (sessionId) => {
    if (!window.confirm("Delete this attendance session?")) return;
    setFormError("");
    const { error } = await supabase.from("attendance_sessions").delete().eq("id", sessionId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel attendance-page">
        <div className="attendance-header">
          <div>
            <h2>Attendance</h2>
            {classLabel && <div className="muted">Class: {classLabel}</div>}
          </div>
          <div className="attendance-actions">
            {!isClassLockedByQuery && (
              <select
                value={activeClassId}
                onChange={(event) => setActiveClassId(event.target.value)}
              >
                <option value="">Select class</option>
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
            >
              By date
            </button>
              <button
                type="button"
                onClick={() => handleCreateSessionForDate(format(new Date(), "yyyy-MM-dd"))}
                disabled={!effectiveClassId}
              >
                Today
              </button>
          </div>
        </div>

        {classSessions.length > 0 && (
          <div className="attendance-stats">
            <div className="stat-card">
              <div className="stat-value">{classSessions.length}</div>
              <div className="stat-label">Total Sessions</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{classStudents.length}</div>
              <div className="stat-label">Students</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: attendanceRateColor }}>
                {attendanceRate}%
              </div>
              <div className="stat-label">Attendance Rate</div>
            </div>
          </div>
        )}

        <div className="attendance-section">
          <h3>Attendance Sessions</h3>
          {classSessions.length === 0 ? (
            <div className="attendance-empty">
              <div className="attendance-empty-icon">📅</div>
              <div className="attendance-empty-title">No attendance sessions yet</div>
              <div className="muted">
                Create your first session to start tracking attendance.
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
                        <div className="muted">{relativeDate(session.session_date)}</div>
                      </div>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={(event) => {
                          event.preventDefault();
                          handleDeleteSession(session.id);
                        }}
                        aria-label="Delete session"
                      >
                        ✕
                      </button>
                    </div>

                    <div className="attendance-card-stats">
                      <div>
                        <div className="muted">Present</div>
                        <strong style={{ color: "#16a34a" }}>{stats.present}</strong>
                      </div>
                      <div>
                        <div className="muted">Didn't come</div>
                        <strong style={{ color: "#ef4444" }}>{stats.absent}</strong>
                      </div>
                      <div>
                        <div className="muted">Late</div>
                        <strong style={{ color: "#f59e0b" }}>{stats.late}</strong>
                      </div>
                      <div>
                        <div className="muted">Left early</div>
                        <strong style={{ color: "#eab308" }}>{stats.leftEarly}</strong>
                      </div>
                    </div>

                    <div className="attendance-rate">
                      <div className="muted">Attendance Rate</div>
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
              <h3>Add Attendance Session</h3>
              <div className="muted">Choose a date to record attendance.</div>
            </div>
            <label className="stack">
              <span>Select date</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(event) => setSelectedDate(event.target.value)}
              />
            </label>
            <div className="attendance-modal-date">
              Selected Date: {selectedDate}
            </div>
            <div className="modal-actions">
              <button
                type="button"
                className="link"
                onClick={() => setShowDatePicker(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleCreateSessionForDate(selectedDate);
                  setShowDatePicker(false);
                }}
                disabled={!selectedDate}
              >
                Create Session
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AttendancePage;
