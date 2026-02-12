import { useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { averageFromPercents, entryToPercent, performanceColor } from "../utils/assessmentMetrics";

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
  const { classId } = useParams();
  const ReorderModeToggle = ReorderModeToggleComponent;
  const classItem = classes.find((item) => item.id === classId);
  const classSubjects = subjects.filter((subject) => subject.class_id === classId);
  const classStudents = students.filter((student) => student.class_id === classId);
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [showAddStudent, setShowAddStudent] = useState(false);
  const [addStudentError, setAddStudentError] = useState("");
  const [dragSubjectId, setDragSubjectId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderModeHook();
  const {
    onHandlePointerDown: onSubjectHandlePointerDown,
    onHandlePointerMove: onSubjectHandlePointerMove,
    onHandlePointerUp: onSubjectHandlePointerUp,
    isDragAllowed: isSubjectDragAllowed,
    resetHandleDrag: resetSubjectHandleDrag,
  } = useHandleDragHook(isReorderEnabled);
  const draggedSubjectId = dragSubjectId;
  const subjectHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;
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
  const presentCount = classAttendanceResults.filter((entry) => entry.status === "Present").length;
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
      const absentCount = studentRows.filter((entry) => entry.status === "Didn't come").length;
      const flags = [];
      if (row.student.needs_help) flags.push("Needs help");
      if (row.student.missing_homework) flags.push("Missing homework");
      if (absentCount > 3) flags.push("Absent often");
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
        <h2>Class not found</h2>
        <p className="muted">Select a class from the Classes page.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <div className="class-top-grid">
        <section className="panel class-overview-panel compact">
          <p className="class-overview-kicker">Class Overview</p>
          <h2>{classItem.name}</h2>
          <div className="class-overview-metrics">
            <article className="class-overview-metric">
              <span>Grade</span>
              <strong>{classItem.grade_level || "Not set"}</strong>
            </article>
            <article className="class-overview-metric">
              <span>Students</span>
              <strong>{classStudents.length}</strong>
            </article>
            <article className="class-overview-metric">
              <span>Subjects</span>
              <strong>{classSubjects.length}</strong>
            </article>
          </div>
          {classItem.school_year ? (
            <p className="muted class-overview-year">School year: {classItem.school_year}</p>
          ) : null}
        </section>

        <section className="panel class-quick-panel compact">
          <h3>Quick Actions</h3>
          <div className="quick-actions class-quick-actions">
            <NavLink to={`/random?classId=${classId}`} className="quick-action action-orange">
              <span className="class-quick-icon" aria-hidden="true">🎲</span>
              <span>Random Picker</span>
            </NavLink>
            <NavLink to={`/groups?classId=${classId}`} className="quick-action action-purple">
              <span className="class-quick-icon" aria-hidden="true">👥</span>
              <span>Groups</span>
            </NavLink>
            <NavLink to={`/attendance?classId=${classId}`} className="quick-action action-blue">
              <span className="class-quick-icon" aria-hidden="true">✅</span>
              <span>Attendance</span>
            </NavLink>
          </div>
        </section>
      </div>

      <section className="panel class-students-panel">
        <div className="class-students-header">
          <h3>Students</h3>
          <button
            type="button"
            className="students-add-btn"
            onClick={() => {
              setStudentForm((prev) => ({ ...prev, classId }));
              setAddStudentError("");
              setShowAddStudent(true);
            }}
          >
            + Add Student
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
          + Add Student
        </button>
        <ul className="student-card-grid">
          {classStudents.map((student) => {
            const tone = student.missing_homework
              ? "red"
              : student.needs_help
                ? "orange"
                : student.is_participating_well
                  ? "green"
                  : "blue";
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
                  <span>Open student profile</span>
                </div>
                <div className="student-card-flags">
                  {student.is_participating_well && (
                    <span className="student-flag green" title="Participating well" aria-label="Participating well">
                      ⭐
                    </span>
                  )}
                  {student.needs_help && (
                    <span className="student-flag orange" title="Needs help" aria-label="Needs help">
                      ⚠️
                    </span>
                  )}
                  {student.missing_homework && (
                    <span className="student-flag red" title="Missing homework" aria-label="Missing homework">
                      📚
                    </span>
                  )}
                </div>
              </NavLink>
            </li>
          );
          })}
          {classStudents.length === 0 && <li className="muted">No students yet.</li>}
        </ul>
      </section>

      <section className="panel">
        <div className="panel-heading-row">
          <h3>Subjects</h3>
          {isMobileLayout && classSubjects.length > 1 && (
            <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
          )}
        </div>
        <form onSubmit={(event) => handleCreateSubject(event, classId)} className="grid">
          <label className="stack">
            <span>Subject name</span>
            <input
              value={subjectForm.name}
              onChange={(event) =>
                setSubjectForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="ELA"
              required
            />
          </label>
          <label className="stack">
            <span>Notes</span>
            <input
              value={subjectForm.description}
              onChange={(event) =>
                setSubjectForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Optional notes"
            />
          </label>
          <button type="submit">Add subject</button>
        </form>

        <ul className="subject-card-grid">
          {classSubjects.map((subject) => (
            <li
              key={subject.id}
              className="subject-card draggable"
              draggable={isReorderEnabled}
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
                if (!isReorderEnabled) return;
                event.preventDefault();
              }}
              onDrop={() =>
                handleSwapSortOrder("subjects", classSubjects, draggedSubjectId, subject.id)
              }
            >
              <NavLink to={`/subjects/${subject.id}`} className="subject-card-link">
                <div className="subject-card-name">{subject.name}</div>
                <div className="subject-card-description">
                  {subject.description || "Open to manage units and assessments"}
                </div>
              </NavLink>
              <button
                type="button"
                className={subjectHandleClassName}
                aria-label={`Drag ${subject.name}`}
                onClick={(event) => event.stopPropagation()}
                onPointerDown={(event) => onSubjectHandlePointerDown(subject.id, event)}
                onPointerMove={onSubjectHandlePointerMove}
                onPointerUp={onSubjectHandlePointerUp}
                onPointerCancel={onSubjectHandlePointerUp}
              >
                ⠿
              </button>
            </li>
          ))}
          {classSubjects.length === 0 && <li className="muted">No subjects yet.</li>}
        </ul>
      </section>

      <section className="panel class-analytics">
        <div className="class-analytics-header">
          <h3>Class Analytics</h3>
          <div className="class-subject-filter">
            <button
              type="button"
              className={selectedSubjectId === "" ? "active" : ""}
              onClick={() => setSelectedSubjectId("")}
            >
              All subjects
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
            <p>Class Average</p>
            <strong style={{ color: performanceColor(classAverage) }}>
              {classAverage.toFixed(1)}%
            </strong>
          </article>
          <article className="class-analytics-card">
            <p>Attendance</p>
            <strong style={{ color: attendanceRate >= 90 ? "#16a34a" : attendanceRate >= 75 ? "#f59e0b" : "#ef4444" }}>
              {attendanceRate.toFixed(0)}%
            </strong>
          </article>
          <article className="class-analytics-card">
            <p>Development</p>
            <strong style={{ color: "#7c3aed" }}>{developmentAverage > 0 ? developmentAverage.toFixed(1) : "—"}</strong>
          </article>
        </div>

        <div className="class-analytics-grid">
          <article className="class-analytics-block">
            <h4>Performance Distribution</h4>
            <div className="distribution-row">
              <span>Excellent (70%+)</span>
              <span>{excellentCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(excellentCount), background: "#16a34a" }} /></div>
            <div className="distribution-row">
              <span>Good (50-69.9%)</span>
              <span>{goodCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(goodCount), background: "#f59e0b" }} /></div>
            <div className="distribution-row">
              <span>Needs Work (&lt;50%)</span>
              <span>{needsWorkCount}</span>
            </div>
            <div className="distribution-track"><span style={{ width: distributionBar(needsWorkCount), background: "#ef4444" }} /></div>
          </article>

          <article className="class-analytics-block">
            <h4>Top Performers</h4>
            {topPerformers.length === 0 ? (
              <p className="muted">No graded data yet.</p>
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
            <h4>Needs Attention</h4>
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
            <h4>Subject Performance</h4>
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
              <h3>Add Student</h3>
              <p className="muted">Basic profile details only. You can update more information later.</p>
            </div>
            <div className="add-student-form">
            {(addStudentError || formError) && <div className="error">{addStudentError || formError}</div>}
            <label className="stack">
              <span>First name</span>
              <input
                value={studentForm.firstName}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, firstName: event.target.value }))
                }
                placeholder="Maya"
                required
              />
            </label>
            <label className="stack">
              <span>Last name</span>
              <input
                value={studentForm.lastName}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, lastName: event.target.value }))
                }
                placeholder="Lopez"
                required
              />
            </label>
            <label className="stack">
              <span>Gender</span>
              <select
                value={studentForm.gender}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, gender: event.target.value }))
                }
              >
                {studentGenderOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack">
              <span>Notes</span>
              <textarea
                rows="2"
                value={studentForm.notes}
                onChange={(event) =>
                  setStudentForm((prev) => ({ ...prev, notes: event.target.value }))
                }
                placeholder="Optional"
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
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setAddStudentError("");
                  if (!studentForm.firstName.trim() || !studentForm.lastName.trim()) {
                    setAddStudentError("Student first and last name are required.");
                    return;
                  }
                  const created = await handleCreateStudent({ preventDefault: () => {} });
                  if (created) {
                    setShowAddStudent(false);
                  }
                }}
              >
                Add
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
