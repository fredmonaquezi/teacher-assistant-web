import { useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useParams } from "react-router-dom";
import { averageFromPercents, entryToPercent, performanceColor } from "../utils/assessmentMetrics";
import { ATTENDANCE_STATUS_BY_KEY } from "../constants/attendance";

function studentToneFromGender(gender) {
  const value = (gender || "").trim().toLowerCase();
  if (value === "female") return "pink";
  if (value === "non-binary") return "yellow";
  return "blue";
}

function genderOptionLabelKey(option) {
  if (option === "Male") return "male";
  if (option === "Female") return "female";
  if (option === "Non-binary") return "nonBinary";
  return "preferNotToSay";
}

function compareStudentsAlphabetically(studentA, studentB) {
  const firstNameA = (studentA.first_name || "").trim();
  const firstNameB = (studentB.first_name || "").trim();
  const firstNameComparison = firstNameA.localeCompare(firstNameB, undefined, {
    sensitivity: "base",
  });
  if (firstNameComparison !== 0) return firstNameComparison;

  const lastNameA = (studentA.last_name || "").trim();
  const lastNameB = (studentB.last_name || "").trim();
  const lastNameComparison = lastNameA.localeCompare(lastNameB, undefined, {
    sensitivity: "base",
  });
  if (lastNameComparison !== 0) return lastNameComparison;

  const createdAtA = studentA.created_at || "";
  const createdAtB = studentB.created_at || "";
  const createdAtComparison = createdAtA.localeCompare(createdAtB);
  if (createdAtComparison !== 0) return createdAtComparison;

  return String(studentA.id || "").localeCompare(String(studentB.id || ""));
}

function ClassQuickIcon({ kind }) {
  switch (kind) {
    case "random":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="5" y="5" width="14" height="14" rx="3" />
          <circle cx="9" cy="9" r="1" />
          <circle cx="15" cy="9" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="9" cy="15" r="1" />
          <circle cx="15" cy="15" r="1" />
        </svg>
      );
    case "groups":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <circle cx="8" cy="9" r="2" />
          <circle cx="16" cy="9" r="2" />
          <circle cx="12" cy="7" r="2" />
          <path d="M5.5 17c0-1.7 1.4-3 3-3h7c1.6 0 3 1.3 3 3" />
        </svg>
      );
    case "attendance":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <rect x="4.5" y="4.5" width="15" height="15" rx="3" />
          <path d="M8.2 12.4l2.2 2.3 5-5.1" />
          <line x1="8" y1="8" x2="16" y2="8" />
        </svg>
      );
    default:
      return null;
  }
}

function StudentFlagIcon({ kind }) {
  switch (kind) {
    case "star":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 4.5l2.2 4.5 4.8.7-3.5 3.4.8 4.9L12 16l-4.3 2.3.8-4.9L5 9.7l4.8-.7Z" />
        </svg>
      );
    case "warning":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M12 5l8 14H4L12 5Z" />
          <line x1="12" y1="9" x2="12" y2="13" />
          <circle cx="12" cy="16.3" r="0.9" />
        </svg>
      );
    case "book":
      return (
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M5.5 6a2 2 0 0 1 2-2h10v15H7.5a2 2 0 0 0-2 2V6Z" />
          <line x1="9" y1="8" x2="15" y2="8" />
          <line x1="9" y1="11" x2="15" y2="11" />
          <line x1="9" y1="14" x2="13.5" y2="14" />
        </svg>
      );
    default:
      return null;
  }
}

function ClassDetailPage({
  formError,
  classes,
  subjects,
  students,
  assessments,
  assessmentEntries,
  attendanceSessions,
  attendanceEntries,
  developmentScores,
  subjectForm,
  setSubjectForm,
  handleCreateSubject,
  handleSwapSortOrder,
  studentForm,
  setStudentForm,
  handleCreateStudent,
  useReorderModeHook,
  useHandleDragHook,
  ReorderModeToggleComponent,
  studentGenderOptions,
}) {
  const { t } = useTranslation();
  const { classId } = useParams();
  const ReorderModeToggle = ReorderModeToggleComponent;
  const classItem = classes.find((item) => item.id === classId);
  const classSubjects = subjects.filter((subject) => subject.class_id === classId);
  const classStudents = students
    .filter((student) => student.class_id === classId)
    .sort(compareStudentsAlphabetically);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState("");
  const [dragSubjectId, setDragSubjectId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderModeHook();
  const isMobileReorderActive = isMobileLayout && isReorderMode;
  const {
    onHandlePointerDown: onSubjectHandlePointerDown,
    onHandlePointerMove: onSubjectHandlePointerMove,
    onHandlePointerUp: onSubjectHandlePointerUp,
    isDragAllowed: isSubjectDragAllowed,
    resetHandleDrag: resetSubjectHandleDrag,
  } = useHandleDragHook(isReorderEnabled && !isMobileLayout);
  const draggedSubjectId = dragSubjectId;
  const subjectHandleClassName = `drag-handle${isReorderEnabled && !isMobileLayout ? "" : " disabled"}`;
  const classStudentIdSet = new Set(classStudents.map((student) => student.id));
  const classAssessmentList = assessments.filter((assessment) => assessment.class_id === classId);
  const filteredAssessmentList = selectedSubjectId
    ? classAssessmentList.filter((assessment) => assessment.subject_id === selectedSubjectId)
    : classAssessmentList;
  const filteredAssessmentIdSet = new Set(filteredAssessmentList.map((assessment) => assessment.id));
  const assessmentLookup = new Map(classAssessmentList.map((assessment) => [assessment.id, assessment]));
  const filteredResults = assessmentEntries.filter(
    (entry) =>
      filteredAssessmentIdSet.has(entry.assessment_id) &&
      classStudentIdSet.has(entry.student_id) &&
      entry.score !== null &&
      entry.score !== undefined
  );
  const classAverage = averageFromPercents(
    filteredResults.map((entry) => entryToPercent(entry, assessmentLookup))
  );
  const classSessionIdSet = new Set(
    attendanceSessions
      .filter((session) => session.class_id === classId)
      .map((session) => session.id)
  );
  const classAttendanceResults = attendanceEntries.filter((entry) => classSessionIdSet.has(entry.session_id));
  const presentCount = classAttendanceResults.filter(
    (entry) => entry.status === ATTENDANCE_STATUS_BY_KEY.present.value
  ).length;
  const attendanceRate = classAttendanceResults.length > 0 ? (presentCount / classAttendanceResults.length) * 100 : 0;
  const classDevelopmentScores = developmentScores.filter((item) => classStudentIdSet.has(item.student_id));
  const developmentAverage =
    classDevelopmentScores.length > 0
      ? classDevelopmentScores.reduce((sum, item) => sum + Number(item.rating || 0), 0) /
        classDevelopmentScores.length
      : 0;
  const studentAverageRows = classStudents
    .map((student) => {
      const rows = filteredResults.filter((entry) => entry.student_id === student.id);
      if (rows.length === 0) return null;
      const avg = averageFromPercents(rows.map((row) => entryToPercent(row, assessmentLookup)));
      return { student, average: avg };
    })
    .filter(Boolean);
  const topPerformers = [...studentAverageRows].sort((a, b) => b.average - a.average).slice(0, 3);
  const studentsNeedingAttention = studentAverageRows
    .filter((row) => row.average < 50)
    .map((row) => {
      const studentRows = classAttendanceResults.filter((entry) => entry.student_id === row.student.id);
      const absentCount = studentRows.filter(
        (entry) => entry.status === ATTENDANCE_STATUS_BY_KEY.absent.value
      ).length;
      const flags = [];
      if (row.student.needs_help) flags.push(t("classDetail.flags.needsHelp"));
      if (row.student.missing_homework) flags.push(t("classDetail.flags.missingHomework"));
      if (absentCount > 3) flags.push(t("classDetail.flags.absentOften"));
      return { ...row, flags };
    })
    .sort((a, b) => a.average - b.average);
  const excellentCount = studentAverageRows.filter((row) => row.average >= 70).length;
  const goodCount = studentAverageRows.filter((row) => row.average >= 50 && row.average < 70).length;
  const needsWorkCount = studentAverageRows.filter((row) => row.average < 50).length;
  const subjectPerformanceRows = classSubjects
    .map((subject) => {
      const subjectAssessmentIds = new Set(
        classAssessmentList.filter((assessment) => assessment.subject_id === subject.id).map((assessment) => assessment.id)
      );
      const subjectRows = assessmentEntries.filter(
        (entry) =>
          subjectAssessmentIds.has(entry.assessment_id) &&
          classStudentIdSet.has(entry.student_id) &&
          entry.score !== null &&
          entry.score !== undefined
      );
      if (subjectRows.length === 0) return { subject, average: 0, count: 0 };
      const average = averageFromPercents(
        subjectRows.map((row) => entryToPercent(row, assessmentLookup))
      );
      return { subject, average, count: subjectRows.length };
    })
    .sort((a, b) => b.average - a.average);
  const totalWithAverages = studentAverageRows.length;
  const distributionBar = (count) => (totalWithAverages > 0 ? `${(count / totalWithAverages) * 100}%` : "0%");

  if (!classItem) {
    return (
      <section className="panel">
        <h2>{t("classDetail.notFoundTitle")}</h2>
        <p className="muted">{t("classDetail.notFoundDescription")}</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <div className="class-top-grid">
        <section className="panel class-overview-panel compact">
          <p className="class-overview-kicker">{t("classDetail.overview.kicker")}</p>
          <h2>{classItem.name}</h2>
          <div className="class-overview-metrics">
            <article className="class-overview-metric">
              <span>{t("classDetail.overview.grade")}</span>
              <strong>{classItem.grade_level || t("classDetail.overview.notSet")}</strong>
            </article>
            <article className="class-overview-metric">
              <span>{t("classDetail.overview.students")}</span>
              <strong>{classStudents.length}</strong>
            </article>
            <article className="class-overview-metric">
              <span>{t("classDetail.overview.subjects")}</span>
              <strong>{classSubjects.length}</strong>
            </article>
          </div>
          {classItem.school_year ? (
            <p className="muted class-overview-year">{t("classDetail.overview.schoolYear", { year: classItem.school_year })}</p>
          ) : null}
        </section>

        <section className="panel class-quick-panel compact">
          <h3>{t("classDetail.quickActions.title")}</h3>
          <div className="quick-actions class-quick-actions">
            <NavLink to={`/random?classId=${classId}`} className="quick-action action-orange">
              <span className="class-quick-icon" aria-hidden="true"><ClassQuickIcon kind="random" /></span>
              <span>{t("classDetail.quickActions.randomPicker")}</span>
            </NavLink>
            <NavLink to={`/groups?classId=${classId}`} className="quick-action action-purple">
              <span className="class-quick-icon" aria-hidden="true"><ClassQuickIcon kind="groups" /></span>
              <span>{t("classDetail.quickActions.groups")}</span>
            </NavLink>
            <NavLink to={`/attendance?classId=${classId}`} className="quick-action action-blue">
              <span className="class-quick-icon" aria-hidden="true"><ClassQuickIcon kind="attendance" /></span>
              <span>{t("classDetail.quickActions.attendance")}</span>
            </NavLink>
          </div>
        </section>
      </div>

      <section className="panel class-students-panel">
        <div className="class-students-header">
          <h3>{t("classDetail.students.title")}</h3>
          <button
            type="button"
            className="students-add-btn"
            onClick={() => {
              setStudentForm((prev) => ({ ...prev, classId }));
              setAddStudentError("");
              setShowAddStudent(true);
            }}
          >
            {t("classDetail.students.addStudent")}
          </button>
        </div>
        <button
          type="button"
          className="students-add-btn mobile-only"
          onClick={() => {
            setStudentForm((prev) => ({ ...prev, classId }));
            setAddStudentError("");
            setShowAddStudent(true);
          }}
        >
          {t("classDetail.students.addStudent")}
        </button>
        <ul className="student-card-grid">
          {classStudents.map((student) => {
            const tone = studentToneFromGender(student.gender);
            return (
            <li key={student.id}>
              <NavLink to={`/students/${student.id}`} className={`student-card-link student-tone-${tone}`}>
                <span className="student-card-avatar">
                  {(student.first_name || "S").charAt(0).toUpperCase()}
                </span>
                <div className="student-card-content">
                  <strong>
                    {student.first_name} {student.last_name}
                  </strong>
                  <span>{t("classDetail.students.openProfile")}</span>
                </div>
                <div className="student-card-flags">
                  {student.is_participating_well && (
                    <span className="student-flag green" title={t("classDetail.students.participatingWell")} aria-label={t("classDetail.students.participatingWell")}>
                      <StudentFlagIcon kind="star" />
                    </span>
                  )}
                  {student.needs_help && (
                    <span className="student-flag orange" title={t("classDetail.flags.needsHelp")} aria-label={t("classDetail.flags.needsHelp")}>
                      <StudentFlagIcon kind="warning" />
                    </span>
                  )}
                  {student.missing_homework && (
                    <span className="student-flag red" title={t("classDetail.flags.missingHomework")} aria-label={t("classDetail.flags.missingHomework")}>
                      <StudentFlagIcon kind="book" />
                    </span>
                  )}
                </div>
              </NavLink>
            </li>
          );
          })}
          {classStudents.length === 0 && <li className="muted">{t("classDetail.students.empty")}</li>}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading-row">
          <h3>{t("classDetail.subjects.title")}</h3>
          {isMobileLayout && classSubjects.length > 1 && (
            <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
          )}
        </div>
        <form onSubmit={(event) => handleCreateSubject(event, classId)} className="grid">
          <label className="stack">
            <span>{t("classDetail.subjects.subjectName")}</span>
            <input
              value={subjectForm.name}
              onChange={(event) =>
                setSubjectForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder={t("classDetail.subjects.subjectNamePlaceholder")}
              required
            />
          </label>
          <label className="stack">
            <span>{t("classDetail.subjects.notes")}</span>
            <input
              value={subjectForm.description}
              onChange={(event) =>
                setSubjectForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder={t("classDetail.subjects.notesPlaceholder")}
            />
          </label>
          <button type="submit">{t("classDetail.subjects.addSubject")}</button>
        </form>

        <ul className="subject-card-grid">
          {classSubjects.map((subject, index) => {
            const previousSubject = index > 0 ? classSubjects[index - 1] : null;
            const nextSubject = index < classSubjects.length - 1 ? classSubjects[index + 1] : null;
            return (
            <li
              key={subject.id}
              className={`subject-card draggable${isMobileReorderActive ? " reorder-mobile-active" : ""}`}
              draggable={isReorderEnabled && !isMobileLayout}
              onDragStart={(event) => {
                if (!isSubjectDragAllowed(subject.id)) {
                  event.preventDefault();
                  return;
                }
                setDragSubjectId(subject.id);
              }}
              onDragEnd={() => {
                setDragSubjectId(null);
                resetSubjectHandleDrag();
              }}
              onDragOver={(event) => {
                if (!isReorderEnabled || isMobileLayout) return;
                event.preventDefault();
              }}
              onDrop={() =>
                handleSwapSortOrder("subjects", classSubjects, draggedSubjectId, subject.id)
              }
            >
              <NavLink
                to={`/subjects/${subject.id}`}
                className={`subject-card-link${isMobileReorderActive ? " reorder-disabled" : ""}`}
                onClick={(event) => {
                  if (!isMobileReorderActive) return;
                  event.preventDefault();
                }}
              >
                <div className="subject-card-name">{subject.name}</div>
                <div className="subject-card-description">
                  {subject.description || t("classDetail.subjects.openToManage")}
                </div>
              </NavLink>
              {isMobileReorderActive && (
                <div className="reorder-mobile-controls">
                  <button
                    type="button"
                    className="reorder-mobile-btn"
                    aria-label={t("classDetail.aria.moveSubjectUp", { name: subject.name })}
                    disabled={!previousSubject}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!previousSubject) return;
                      handleSwapSortOrder("subjects", classSubjects, subject.id, previousSubject.id);
                    }}
                  >
                    ↑
                  </button>
                  <button
                    type="button"
                    className="reorder-mobile-btn"
                    aria-label={t("classDetail.aria.moveSubjectDown", { name: subject.name })}
                    disabled={!nextSubject}
                    onClick={(event) => {
                      event.stopPropagation();
                      if (!nextSubject) return;
                      handleSwapSortOrder("subjects", classSubjects, subject.id, nextSubject.id);
                    }}
                  >
                    ↓
                  </button>
                </div>
              )}
              {!isMobileLayout && (
                <button
                  type="button"
                  className={subjectHandleClassName}
                  aria-label={t("classDetail.aria.dragSubject", { name: subject.name })}
                  onClick={(event) => event.stopPropagation()}
                  onPointerDown={(event) => onSubjectHandlePointerDown(subject.id, event)}
                  onPointerMove={onSubjectHandlePointerMove}
                  onPointerUp={onSubjectHandlePointerUp}
                  onPointerCancel={onSubjectHandlePointerUp}
                >
                  ⠿
                </button>
              )}
            </li>
          );
          })}
          {classSubjects.length === 0 && <li className="muted">{t("classDetail.subjects.empty")}</li>}
        </ul>
      </section>

      <section className="panel class-analytics">
        <div className="class-analytics-header">
          <h3>{t("classDetail.analytics.title")}</h3>
          <div className="class-subject-filter">
            <button
              type="button"
              className={selectedSubjectId === "" ? "active" : ""}
              onClick={() => setSelectedSubjectId("")}
            >
              {t("classDetail.analytics.allSubjects")}
            </button>
            {classSubjects.map((subject) => (
              <button
                key={subject.id}
                type="button"
                className={selectedSubjectId === subject.id ? "active" : ""}
                onClick={() => setSelectedSubjectId(subject.id)}
              >
                {subject.name}
              </button>
            ))}
          </div>
        </div>

        <div className="class-analytics-stats">
          <article className="class-analytics-card">
            <p>{t("classDetail.analytics.classAverage")}</p>
            <strong style={{ color: performanceColor(classAverage) }}>
              {classAverage.toFixed(1)}%
            </strong>
          </article>
          <article className="class-analytics-card">
            <p>{t("classDetail.analytics.attendance")}</p>
            <strong style={{ color: attendanceRate >= 90 ? "#16a34a" : attendanceRate >= 75 ? "#f59e0b" : "#ef4444" }}>
              {attendanceRate.toFixed(0)}%
            </strong>
          </article>
          <article className="class-analytics-card">
            <p>{t("classDetail.analytics.development")}</p>
            <strong style={{ color: "#7c3aed" }}>{developmentAverage > 0 ? developmentAverage.toFixed(1) : "—"}</strong>
          </article>
        </div>

        <div className="class-analytics-grid">
          <article className="class-analytics-block">
            <h4>{t("classDetail.analytics.performanceDistribution")}</h4>
            <div className="distribution-row">
              <span>{t("classDetail.analytics.excellent")}</span>
              <span>{excellentCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(excellentCount), background: "#16a34a" }} /></div>
            <div className="distribution-row">
              <span>{t("classDetail.analytics.good")}</span>
              <span>{goodCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(goodCount), background: "#f59e0b" }} /></div>
            <div className="distribution-row">
              <span>{t("classDetail.analytics.needsWork")}</span>
              <span>{needsWorkCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(needsWorkCount), background: "#ef4444" }} /></div>
          </article>

          <article className="class-analytics-block">
            <h4>{t("classDetail.analytics.topPerformers")}</h4>
            {topPerformers.length === 0 ? (
              <p className="muted">{t("classDetail.analytics.noGradedData")}</p>
            ) : (
              <ul className="list compact">
                {topPerformers.map((row, idx) => (
                  <li key={row.student.id}>
                    <span>{idx + 1}. {row.student.first_name} {row.student.last_name}</span>
                    <strong>{row.average.toFixed(1)}%</strong>
                  </li>
                ))}
              </ul>
            )}
          </article>
        </div>

        {studentsNeedingAttention.length > 0 && (
          <article className="class-analytics-block">
            <h4>{t("classDetail.analytics.needsAttention")}</h4>
            <ul className="list compact">
              {studentsNeedingAttention.map((row) => (
                <li key={row.student.id}>
                  <span>
                    {row.student.first_name} {row.student.last_name}
                    {row.flags.length > 0 ? ` • ${row.flags.join(" • ")}` : ""}
                  </span>
                  <strong style={{ color: "#ef4444" }}>{row.average.toFixed(1)}%</strong>
                </li>
              ))}
            </ul>
          </article>
        )}

        {classSubjects.length > 1 && (
          <article className="class-analytics-block">
            <h4>{t("classDetail.analytics.subjectPerformance")}</h4>
            <ul className="list compact">
              {subjectPerformanceRows.map((row) => (
                <li key={row.subject.id}>
                  <span>{row.subject.name}</span>
                  <strong>{row.count > 0 ? `${row.average.toFixed(1)}%` : "—"}</strong>
                </li>
              ))}
            </ul>
          </article>
        )}
      </section>

      {showAddStudent && (
        <div className="modal-overlay">
          <div className="modal-card add-student-modal">
            <div className="add-student-header">
              <h3>{t("classDetail.addStudent.title")}</h3>
              <p className="muted">{t("classDetail.addStudent.description")}</p>
            </div>
            <div className="add-student-form">
            {(addStudentError || formError) && <div className="error">{addStudentError || formError}</div>}
            <label className="stack">
              <span>{t("classDetail.addStudent.firstName")}</span>
              <input
                value={studentForm.firstName}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                placeholder={t("classDetail.addStudent.firstNamePlaceholder")}
                required
              />
            </label>
            <label className="stack">
              <span>{t("classDetail.addStudent.lastName")}</span>
              <input
                value={studentForm.lastName}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                placeholder={t("classDetail.addStudent.lastNamePlaceholder")}
                required
              />
            </label>
            <label className="stack">
              <span>{t("classDetail.addStudent.gender")}</span>
              <select
                value={studentForm.gender}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, gender: event.target.value }))
                }
              >
                {studentGenderOptions.map((option) => (
                  <option key={option} value={option}>
                    {t(`common.gender.${genderOptionLabelKey(option)}`)}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack">
              <span>{t("classDetail.addStudent.notes")}</span>
              <textarea
                rows="3"
                value={studentForm.notes}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder={t("classDetail.addStudent.notesPlaceholder")}
              />
            </label>
            <div className="modal-actions add-student-actions">
              <button
                type="button"
                className="link"
                onClick={() => {
                  setAddStudentError("");
                  setShowAddStudent(false);
                }}
              >
                {t("common.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  setAddStudentError("");
                  if (!studentForm.firstName.trim() || !studentForm.lastName.trim()) {
                    setAddStudentError(t("classDetail.addStudent.errorNameRequired"));
                    return;
                  }
                  const created = await handleCreateStudent({ preventDefault: () => {} });
                  if (created) {
                    setShowAddStudent(false);
                  }
                }}
              >
                {t("common.actions.add")}
              </button>
            </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}


export default ClassDetailPage;
