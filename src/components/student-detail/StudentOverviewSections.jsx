import { NavLink } from "react-router-dom";

function renderStudentStatusIcon(kind) {
  switch (kind) {
    case "participating":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="12" cy="7.5" r="2.7" />
          <path d="M6.2 18c0-2.5 2.1-4.5 4.6-4.5h2.4c2.6 0 4.6 2 4.6 4.5" />
          <path d="M6 11.8l2.4 2.3 3.2-3.3" />
        </svg>
      );
    case "needsHelp":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.7 20 19H4L12 4.7Z" />
          <line x1="12" y1="9.2" x2="12" y2="13.1" />
          <circle cx="12" cy="16" r="0.9" />
        </svg>
      );
    case "homework":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 4.5h8.4l3.6 3.6v11.4H6z" />
          <path d="M14.4 4.5v3.6H18" />
          <line x1="8.8" y1="12" x2="15.2" y2="12" />
          <line x1="8.8" y1="15" x2="13.4" y2="15" />
        </svg>
      );
    default:
      return null;
  }
}

function StudentOverviewSections({
  student,
  studentInitials,
  classLabel,
  onOpenEditInfo,
  onToggleStatus,
  overallAverage,
  totalAssessments,
  averageColor,
  attendanceSummary,
  attendanceTotal,
  records,
  avgAccuracy,
  latestLevel,
  normalizedLevel,
  performanceBySubject,
  recentAssessments,
}) {
  return (
    <>
      <section className="panel student-profile-header">
        <div className="student-profile-hero">
          <div className="student-profile-avatar">{studentInitials}</div>
          <div className="student-profile-copy">
            <h2>
              {student.first_name} {student.last_name}
            </h2>
            <p className="muted">{classLabel}</p>
            <div className="student-profile-chips">
              <span className="student-chip">{student.gender || "Prefer not to say"}</span>
              <span className={`student-chip ${student.notes ? "" : "subtle"}`}>
                {student.notes ? "Notes saved" : "No notes"}
              </span>
            </div>
          </div>
        </div>
        <button type="button" className="secondary" onClick={onOpenEditInfo}>
          Edit Info
        </button>
      </section>

      <section className="panel student-status-panel">
        <h3>Quick Status</h3>
        <div className="student-status-grid">
          <button
            type="button"
            className={`student-status-card status-participating ${student.is_participating_well ? "active green" : ""}`}
            onClick={() => onToggleStatus("isParticipatingWell")}
          >
            <span className="student-status-icon" aria-hidden="true">
              {renderStudentStatusIcon("participating")}
            </span>
            <div>
              <strong>Participating Well</strong>
              <p>{student.is_participating_well ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-needs-help ${student.needs_help ? "active orange" : ""}`}
            onClick={() => onToggleStatus("needsHelp")}
          >
            <span className="student-status-icon" aria-hidden="true">
              {renderStudentStatusIcon("needsHelp")}
            </span>
            <div>
              <strong>Needs Help</strong>
              <p>{student.needs_help ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-missing-homework ${student.missing_homework ? "active red" : ""}`}
            onClick={() => onToggleStatus("missingHomework")}
          >
            <span className="student-status-icon" aria-hidden="true">
              {renderStudentStatusIcon("homework")}
            </span>
            <div>
              <strong>Missing Homework</strong>
              <p>{student.missing_homework ? "Active" : "Inactive"}</p>
            </div>
          </button>
        </div>
      </section>

      <section className="student-stat-row">
        <article className="panel student-stat-card">
          <p className="muted">Overall Average</p>
          <p style={{ color: averageColor(overallAverage) }}>{overallAverage.toFixed(1)}%</p>
        </article>
        <article className="panel student-stat-card">
          <p className="muted">Total Assessments</p>
          <p style={{ color: "#8a5c34" }}>{totalAssessments}</p>
        </article>
      </section>

      <section className="panel">
        <h3>Attendance Summary</h3>
        {attendanceTotal === 0 ? (
          <p className="muted">No attendance records yet.</p>
        ) : (
          <div className="attendance-summary-grid">
            <article>
              <strong>{attendanceSummary.present}</strong>
              <span>Present</span>
              <small>{Math.round((attendanceSummary.present / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.absent}</strong>
              <span>Absent</span>
              <small>{Math.round((attendanceSummary.absent / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.late}</strong>
              <span>Late</span>
              <small>{Math.round((attendanceSummary.late / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.leftEarly}</strong>
              <span>Left Early</span>
              <small>{Math.round((attendanceSummary.leftEarly / attendanceTotal) * 100)}%</small>
            </article>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="student-section-title">
          <h3>Running Records</h3>
          <NavLink to="/running-records" className="student-view-all-btn">
            View all
          </NavLink>
        </div>
        {records.length === 0 ? (
          <p className="muted">No running records yet.</p>
        ) : (
          <>
            <div className="student-running-stats">
              <article>
                <strong>{records.length}</strong>
                <span>Total</span>
              </article>
              <article>
                <strong>{avgAccuracy.toFixed(1)}%</strong>
                <span>Avg. Accuracy</span>
              </article>
              <article>
                <strong style={{ color: latestLevel?.color }}>{latestLevel?.short || "-"}</strong>
                <span>Latest</span>
              </article>
            </div>
            <ul className="list student-mini-list">
              {records.slice(0, 3).map((record) => {
                const level = normalizedLevel(record.level);
                return (
                  <li key={record.id}>
                    <span>{record.record_date || "No date"} · {record.text_title || "Untitled text"}</span>
                    <strong style={{ color: level.color }}>{record.accuracy_pct ?? 0}%</strong>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h3>Performance by Subject</h3>
        {performanceBySubject.length === 0 ? (
          <p className="muted">No subjects in this class yet.</p>
        ) : (
          <div className="student-subject-grid">
            {performanceBySubject.map((item) => (
              <article key={item.subject.id}>
                <div>
                  <strong>{item.subject.name}</strong>
                  <p className="muted">{item.count} assessments</p>
                </div>
                <p style={{ color: averageColor(item.average) }}>{item.average.toFixed(1)}%</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>Recent Assessments</h3>
        {recentAssessments.length === 0 ? (
          <p className="muted">No assessments yet.</p>
        ) : (
          <ul className="list student-mini-list">
            {recentAssessments.map((item) => (
              <li key={item.id}>
                <span>
                  {item.title}
                  {item.subjectName ? ` · ${item.subjectName}` : ""}
                  {item.assessmentDate ? ` · ${item.assessmentDate}` : ""}
                </span>
                {item.isGraded ? (
                  <strong style={{ color: averageColor(item.percent) }}>{item.percent.toFixed(1)}%</strong>
                ) : (
                  <strong className="muted">Not graded</strong>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default StudentOverviewSections;
