import { useCallback, useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { NavLink, useNavigate } from "react-router-dom";
import { averageFromPercents, getAssessmentMaxScore, performanceColor, scoreToPercent } from "../utils/assessmentMetrics";

const bySortThenName = (a, b) => {
  const orderDiff = Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0);
  if (orderDiff !== 0) return orderDiff;
  return String(a.name || a.title || "").localeCompare(String(b.name || b.title || ""));
};

const scoreLabel = (score) => {
  if (score === null || score === undefined || !Number.isFinite(Number(score)) || Number(score) <= 0) {
    return "—";
  }
  return Number(score).toFixed(1);
};

const AssessmentsPage = ({
  formError,
  loading,
  classes = [],
  subjects = [],
  units = [],
  students = [],
  assessments = [],
  assessmentEntries = [],
  handleSetAssessmentEntryScore,
}) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const sortedClasses = useMemo(() => [...classes].sort(bySortThenName), [classes]);
  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedUnitId, setSelectedUnitId] = useState("");
  const [activeGradeEditor, setActiveGradeEditor] = useState(null);
  const [gradeValue, setGradeValue] = useState("");
  const [gradeSaveError, setGradeSaveError] = useState("");
  const [isSavingGrade, setIsSavingGrade] = useState(false);

  const selectedClass = sortedClasses.find((item) => item.id === selectedClassId) || null;
  const subjectsForClass = useMemo(
    () => subjects.filter((item) => item.class_id === selectedClassId).sort(bySortThenName),
    [subjects, selectedClassId]
  );
  const selectedSubject = subjectsForClass.find((item) => item.id === selectedSubjectId) || null;

  const unitsForSubject = useMemo(
    () => units.filter((item) => item.subject_id === selectedSubjectId).sort(bySortThenName),
    [units, selectedSubjectId]
  );
  const selectedUnit = unitsForSubject.find((item) => item.id === selectedUnitId) || null;

  const assessmentsForUnit = useMemo(
    () =>
      assessments
        .filter((item) => item.unit_id === selectedUnitId)
        .sort(
          (a, b) =>
            Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
            String(a.assessment_date || "").localeCompare(String(b.assessment_date || ""))
        ),
    [assessments, selectedUnitId]
  );

  const studentsForClass = useMemo(
    () => students.filter((item) => item.class_id === selectedClassId).sort(bySortThenName),
    [students, selectedClassId]
  );

  const assessmentById = useMemo(
    () => new Map(assessmentsForUnit.map((item) => [item.id, item])),
    [assessmentsForUnit]
  );

  const entryByAssessmentAndStudent = useMemo(() => {
    const map = new Map();
    for (const entry of assessmentEntries) {
      const key = `${entry.assessment_id}:${entry.student_id}`;
      map.set(key, entry);
    }
    return map;
  }, [assessmentEntries]);

  const unitPercents = useMemo(() => {
    const unitAssessmentIds = new Set(assessmentsForUnit.map((item) => item.id));
    return assessmentEntries
      .filter((entry) => unitAssessmentIds.has(entry.assessment_id))
      .map((entry) => {
        const assessment = assessmentById.get(entry.assessment_id);
        return scoreToPercent(entry.score, getAssessmentMaxScore(assessment));
      })
      .filter((value) => Number.isFinite(value));
  }, [assessmentEntries, assessmentById, assessmentsForUnit]);

  const unitAverage = averageFromPercents(unitPercents);
  const unitAverageColor = performanceColor(unitAverage);

  const activeAssessment = useMemo(() => {
    if (!activeGradeEditor) return null;
    return assessmentsForUnit.find((item) => item.id === activeGradeEditor.assessmentId) || null;
  }, [activeGradeEditor, assessmentsForUnit]);

  const activeStudent = useMemo(() => {
    if (!activeGradeEditor) return null;
    return studentsForClass.find((item) => item.id === activeGradeEditor.studentId) || null;
  }, [activeGradeEditor, studentsForClass]);

  const resetGradeEditor = useCallback(() => {
    setActiveGradeEditor(null);
    setGradeValue("");
    setGradeSaveError("");
  }, []);

  const pickClass = (classId) => {
    resetGradeEditor();
    setSelectedClassId(classId);
    setSelectedSubjectId("");
    setSelectedUnitId("");
  };

  const pickSubject = (subjectId) => {
    resetGradeEditor();
    setSelectedSubjectId(subjectId);
    setSelectedUnitId("");
  };

  const closeGradeEditor = useCallback(() => {
    if (isSavingGrade) return;
    resetGradeEditor();
  }, [isSavingGrade, resetGradeEditor]);

  const openGradeEditor = (assessment, student, entry) => {
    setActiveGradeEditor({
      assessmentId: assessment.id,
      studentId: student.id,
    });
    setGradeValue(
      entry?.score === null || entry?.score === undefined ? "" : String(entry.score)
    );
    setGradeSaveError("");
  };

  useEffect(() => {
    if (!activeGradeEditor) return;
    const onKeyDown = (event) => {
      if (event.key === "Escape") {
        closeGradeEditor();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeGradeEditor, closeGradeEditor]);

  const submitGrade = async (event) => {
    event.preventDefault();
    if (!activeGradeEditor || typeof handleSetAssessmentEntryScore !== "function") return;

    const normalizedValue = gradeValue.trim();
    const parsedScore = normalizedValue === "" ? null : Number(normalizedValue);

    if (
      normalizedValue !== "" &&
      (!Number.isFinite(parsedScore) || Number(parsedScore) < 0)
    ) {
      setGradeSaveError(t("assessments.inlineEditor.invalidScore"));
      return;
    }

    setGradeSaveError("");
    setIsSavingGrade(true);
    const ok = await handleSetAssessmentEntryScore(
      activeGradeEditor.assessmentId,
      activeGradeEditor.studentId,
      parsedScore
    );
    setIsSavingGrade(false);

    if (ok) {
      resetGradeEditor();
      return;
    }

    setGradeSaveError(t("assessments.inlineEditor.saveFailed"));
  };

  const activePercent = scoreToPercent(
    gradeValue.trim() === "" ? null : Number(gradeValue),
    getAssessmentMaxScore(activeAssessment)
  );
  const activePercentColor =
    activePercent === null ? "#7c6446" : performanceColor(activePercent);

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel gradebook-page">
        <div className="gradebook-page-header">
          <div>
            <h2>{t("assessments.title")}</h2>
          </div>
          {selectedUnit && (
            <NavLink to={`/units/${selectedUnit.id}`} className="gradebook-open-unit">
              {t("assessments.openUnitWorkspace")}
            </NavLink>
          )}
        </div>

        <div className="gradebook-launcher-grid">
          <article className="gradebook-step-card">
            <p className="gradebook-step-title">{t("assessments.steps.chooseClass")}</p>
            {sortedClasses.length === 0 ? (
              <p className="muted">{t("assessments.empty.noClasses")}</p>
            ) : (
              <div className="gradebook-step-list">
                {sortedClasses.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`gradebook-step-item ${selectedClassId === item.id ? "active" : ""}`}
                    onClick={() => pickClass(item.id)}
                  >
                    <span>{item.name}</span>
                    <span>›</span>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="gradebook-step-card">
            <p className="gradebook-step-title">{t("assessments.steps.chooseSubject")}</p>
            {!selectedClass ? (
              <p className="muted">{t("assessments.empty.pickClassFirst")}</p>
            ) : subjectsForClass.length === 0 ? (
              <p className="muted">{t("assessments.empty.classNoSubjects")}</p>
            ) : (
              <div className="gradebook-step-list">
                {subjectsForClass.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`gradebook-step-item ${selectedSubjectId === item.id ? "active" : ""}`}
                    onClick={() => pickSubject(item.id)}
                  >
                    <span>{item.name}</span>
                    <span>›</span>
                  </button>
                ))}
              </div>
            )}
          </article>

          <article className="gradebook-step-card">
            <p className="gradebook-step-title">{t("assessments.steps.chooseUnit")}</p>
            {!selectedSubject ? (
              <p className="muted">{t("assessments.empty.pickSubjectFirst")}</p>
            ) : unitsForSubject.length === 0 ? (
              <p className="muted">{t("assessments.empty.subjectNoUnits")}</p>
            ) : (
              <div className="gradebook-step-list">
                {unitsForSubject.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    className={`gradebook-step-item ${selectedUnitId === item.id ? "active" : ""}`}
                    onClick={() => {
                      resetGradeEditor();
                      setSelectedUnitId(item.id);
                    }}
                  >
                    <span>{item.name}</span>
                    <span>›</span>
                  </button>
                ))}
              </div>
            )}
          </article>
        </div>

        {selectedUnit && (
          <>
            <div className="gradebook-matrix-stats">
              <div className="stat-card gradebook-stat-card">
                <div className="stat-label">{t("assessments.stats.students")}</div>
                <div className="stat-value" style={{ color: "#8a5c34" }}>
                  {studentsForClass.length}
                </div>
              </div>
              <div className="stat-card gradebook-stat-card">
                <div className="stat-label">{t("assessments.stats.assessments")}</div>
                <div className="stat-value" style={{ color: "#9b6a3f" }}>
                  {assessmentsForUnit.length}
                </div>
              </div>
              <div className="stat-card gradebook-stat-card">
                <div className="stat-label">{t("assessments.stats.unitAverage")}</div>
                <div className="stat-value" style={{ color: unitAverageColor }}>
                  {unitAverage.toFixed(1)}%
                </div>
              </div>
            </div>

            <div className="gradebook-table-scroll">
              {loading ? (
                <p className="muted">{t("assessments.loading")}</p>
              ) : assessmentsForUnit.length === 0 ? (
                <p className="muted">{t("assessments.empty.unitNoAssessments")}</p>
              ) : studentsForClass.length === 0 ? (
                <p className="muted">{t("assessments.empty.classNoStudents")}</p>
              ) : (
                <table className="gradebook-matrix-table">
                  <thead>
                    <tr>
                      <th className="student-col">{t("assessments.table.student")}</th>
                      {assessmentsForUnit.map((assessment) => (
                        <th key={assessment.id} className="grade-col">
                          <button
                            type="button"
                            className="gradebook-assessment-link"
                            onClick={() => navigate(`/assessments/${assessment.id}`)}
                            aria-label={t("assessments.aria.openAssessment", {
                              assessmentTitle: assessment.title,
                            })}
                          >
                            {assessment.title}
                          </button>
                        </th>
                      ))}
                      <th className="grade-col">{t("assessments.table.average")}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {studentsForClass.map((student) => {
                      const studentPercents = assessmentsForUnit
                        .map((assessment) => {
                          const key = `${assessment.id}:${student.id}`;
                          const entry = entryByAssessmentAndStudent.get(key);
                          return scoreToPercent(entry?.score, getAssessmentMaxScore(assessment));
                        })
                        .filter((value) => Number.isFinite(value));
                      const studentAverage = averageFromPercents(studentPercents);
                      const studentAverageColor = performanceColor(studentAverage);

                      return (
                        <tr key={student.id}>
                          <td className="student-col">
                            {student.first_name} {student.last_name}
                          </td>
                          {assessmentsForUnit.map((assessment) => {
                            const key = `${assessment.id}:${student.id}`;
                            const entry = entryByAssessmentAndStudent.get(key);
                            const percent = scoreToPercent(entry?.score, getAssessmentMaxScore(assessment));
                            const cellColor =
                              percent === null ? "#7c6446" : performanceColor(percent);
                            const cellBg =
                              percent === null
                                ? "rgba(201, 164, 110, 0.18)"
                                : percent >= 70
                                ? "rgba(22, 163, 74, 0.12)"
                                : percent >= 50
                                    ? "rgba(234, 88, 12, 0.14)"
                                    : "rgba(220, 38, 38, 0.12)";

                            return (
                              <td key={assessment.id} className="grade-col">
                                <button
                                  type="button"
                                  className="gradebook-grade-cell"
                                  style={{ color: cellColor, background: cellBg }}
                                  onClick={() => openGradeEditor(assessment, student, entry)}
                                  aria-label={t("assessments.aria.editAssessmentForStudent", {
                                    assessmentTitle: assessment.title,
                                    studentName: `${student.first_name} ${student.last_name}`,
                                  })}
                                >
                                  {scoreLabel(entry?.score)}
                                </button>
                              </td>
                            );
                          })}
                          <td className="grade-col gradebook-average-cell" style={{ color: studentAverageColor }}>
                            {studentAverage.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </>
        )}
      </section>

      {activeGradeEditor && activeAssessment && activeStudent && (
        <div className="modal-overlay" onClick={closeGradeEditor}>
          <div
            className="modal-card gradebook-grade-modal"
            role="dialog"
            aria-modal="true"
            aria-label={t("assessments.inlineEditor.title")}
            onClick={(event) => event.stopPropagation()}
          >
            <h3>{t("assessments.inlineEditor.title")}</h3>
            <div className="gradebook-grade-modal-copy">
              <p>
                <span>{t("assessments.inlineEditor.student")}:</span>
                <strong>{activeStudent.first_name} {activeStudent.last_name}</strong>
              </p>
              <p>
                <span>{t("assessments.inlineEditor.assessment")}:</span>
                <strong>{activeAssessment.title}</strong>
              </p>
            </div>
            <form className="gradebook-grade-modal-form" onSubmit={submitGrade}>
              <label className="stack">
                <span>{t("assessments.inlineEditor.score")}</span>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  value={gradeValue}
                  onChange={(event) => setGradeValue(event.target.value)}
                  autoFocus
                />
              </label>
              <div className="gradebook-grade-modal-meta">
                <span>{t("assessments.inlineEditor.maxScore", { max: getAssessmentMaxScore(activeAssessment) })}</span>
                <strong style={{ color: activePercentColor }}>
                  {activePercent === null ? "—" : `${activePercent.toFixed(1)}%`}
                </strong>
              </div>
              {gradeSaveError && <p className="error">{gradeSaveError}</p>}
              <div className="modal-actions">
                <button type="button" className="secondary" onClick={closeGradeEditor}>
                  {t("common.actions.cancel")}
                </button>
                <button type="submit" disabled={isSavingGrade}>
                  {t("assessments.inlineEditor.save")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};

export default AssessmentsPage;
