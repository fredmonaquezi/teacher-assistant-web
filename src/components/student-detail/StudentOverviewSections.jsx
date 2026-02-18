import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";

function genderOptionLabelKey(option) {
  const normalized = String(option || "").trim().toLowerCase();
  if (["male", "masculino"].includes(normalized)) return "male";
  if (["female", "feminino"].includes(normalized)) return "female";
  if (["non-binary", "non binary", "gender neutral", "gênero neutro", "genero neutro"].includes(normalized)) {
    return "nonBinary";
  }
  if (["prefer not to say", "prefiro não informar", "prefiro nao informar"].includes(normalized)) {
    return "preferNotToSay";
  }
  return null;
}

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
  const { t } = useTranslation();
  const genderKey = genderOptionLabelKey(student.gender);
  const genderLabel = genderKey
    ? t(`common.gender.${genderKey}`)
    : student.gender || t("common.gender.preferNotToSay");

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
              <span className="student-chip">{genderLabel}</span>
              <span className={`student-chip ${student.notes ? "" : "subtle"}`}>
                {student.notes ? t("studentOverview.notesSaved") : t("studentOverview.noNotes")}
              </span>
            </div>
          </div>
        </div>
        <button type="button" className="secondary" onClick={onOpenEditInfo}>
          {t("studentOverview.editInfo")}
        </button>
      </section>

      <section className="panel student-status-panel">
        <h3>{t("studentOverview.quickStatus")}</h3>
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
              <strong>{t("studentOverview.status.participatingWell")}</strong>
              <p>{student.is_participating_well ? t("studentOverview.status.active") : t("studentOverview.status.inactive")}</p>
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
              <strong>{t("studentOverview.status.needsHelp")}</strong>
              <p>{student.needs_help ? t("studentOverview.status.active") : t("studentOverview.status.inactive")}</p>
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
              <strong>{t("studentOverview.status.missingHomework")}</strong>
              <p>{student.missing_homework ? t("studentOverview.status.active") : t("studentOverview.status.inactive")}</p>
            </div>
          </button>
        </div>
      </section>

      <section className="student-stat-row">
        <article className="panel student-stat-card">
          <p className="muted">{t("studentOverview.stats.overallAverage")}</p>
          <p style={{ color: averageColor(overallAverage) }}>{overallAverage.toFixed(1)}%</p>
        </article>
        <article className="panel student-stat-card">
          <p className="muted">{t("studentOverview.stats.totalAssessments")}</p>
          <p style={{ color: "#8a5c34" }}>{totalAssessments}</p>
        </article>
      </section>

      <section className="panel">
        <h3>{t("studentOverview.attendanceSummary")}</h3>
        {attendanceTotal === 0 ? (
          <p className="muted">{t("studentOverview.noAttendance")}</p>
        ) : (
          <div className="attendance-summary-grid">
            <article>
              <strong>{attendanceSummary.present}</strong>
              <span>{t("attendance.status.present.short")}</span>
              <small>{Math.round((attendanceSummary.present / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.absent}</strong>
              <span>{t("attendance.status.absent.short")}</span>
              <small>{Math.round((attendanceSummary.absent / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.late}</strong>
              <span>{t("attendance.status.late.short")}</span>
              <small>{Math.round((attendanceSummary.late / attendanceTotal) * 100)}%</small>
            </article>
            <article>
              <strong>{attendanceSummary.leftEarly}</strong>
              <span>{t("attendance.status.leftEarly.short")}</span>
              <small>{Math.round((attendanceSummary.leftEarly / attendanceTotal) * 100)}%</small>
            </article>
          </div>
        )}
      </section>

      <section className="panel">
        <div className="student-section-title">
          <h3>{t("studentOverview.runningRecords")}</h3>
          <NavLink to="/running-records" className="student-view-all-btn">
            {t("studentOverview.viewAll")}
          </NavLink>
        </div>
        {records.length === 0 ? (
          <p className="muted">{t("studentOverview.noRunningRecords")}</p>
        ) : (
          <>
            <div className="student-running-stats">
              <article>
                <strong>{records.length}</strong>
                <span>{t("studentOverview.stats.total")}</span>
              </article>
              <article>
                <strong>{avgAccuracy.toFixed(1)}%</strong>
                <span>{t("studentOverview.stats.avgAccuracy")}</span>
              </article>
              <article>
                <strong style={{ color: latestLevel?.color }}>{latestLevel?.short || "-"}</strong>
                <span>{t("studentOverview.stats.latest")}</span>
              </article>
            </div>
            <ul className="list student-mini-list">
              {records.slice(0, 3).map((record) => {
                const level = normalizedLevel(record.level);
                return (
                  <li key={record.id}>
                    <span>{record.record_date || t("runningRecords.noDate")} · {record.text_title || t("runningRecords.untitledText")}</span>
                    <strong style={{ color: level.color }}>{record.accuracy_pct ?? 0}%</strong>
                  </li>
                );
              })}
            </ul>
          </>
        )}
      </section>

      <section className="panel">
        <h3>{t("studentOverview.performanceBySubject")}</h3>
        {performanceBySubject.length === 0 ? (
          <p className="muted">{t("studentOverview.noSubjects")}</p>
        ) : (
          <div className="student-subject-grid">
            {performanceBySubject.map((item) => (
              <article key={item.subject.id}>
                <div>
                  <strong>{item.subject.name}</strong>
                  <p className="muted">{t("studentOverview.assessmentsCount", { count: item.count })}</p>
                </div>
                <p style={{ color: averageColor(item.average) }}>{item.average.toFixed(1)}%</p>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="panel">
        <h3>{t("studentOverview.recentAssessments")}</h3>
        {recentAssessments.length === 0 ? (
          <p className="muted">{t("studentOverview.noAssessments")}</p>
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
                  <strong className="muted">{t("studentOverview.notGraded")}</strong>
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
