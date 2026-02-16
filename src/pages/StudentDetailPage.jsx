import { useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { NavLink, useParams } from "react-router-dom";
import { STUDENT_GENDER_OPTIONS } from "../constants/options";
import { averageFromPercents, entryToPercent, performanceColor } from "../utils/assessmentMetrics";

function StudentDetailPage({
  students,
  classes,
  subjects,
  assessments,
  attendanceEntries,
  runningRecords,
  assessmentEntries,
  rubricCriteria,
  rubricCategories,
  rubrics,
  developmentScores,
  developmentScoreForm,
  setDevelopmentScoreForm,
  handleCreateDevelopmentScore,
  handleCreateDevelopmentScoreEntry,
  handleUpdateDevelopmentScore,
  handleUpdateStudent,
  formError,
}) {
  const { studentId } = useParams();
  const student = students.find((item) => item.id === studentId);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showDevelopmentForm, setShowDevelopmentForm] = useState(false);
  const [activeDevelopmentCriterionId, setActiveDevelopmentCriterionId] = useState("");
  const [editingDevelopmentScoreId, setEditingDevelopmentScoreId] = useState("");
  const [showAddDevelopmentHistoryForm, setShowAddDevelopmentHistoryForm] = useState(false);
  const [developmentHistoryEditForm, setDevelopmentHistoryEditForm] = useState({
    rating: "3",
    date: "",
    notes: "",
  });
  const [newDevelopmentHistoryForm, setNewDevelopmentHistoryForm] = useState({
    rating: "3",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    gender: "Prefer not to say",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
  });
  const records = runningRecords
    .filter((record) => record.student_id === studentId)
    .sort((a, b) => (b.record_date || "").localeCompare(a.record_date || ""));
  const assessmentsForStudent = assessmentEntries.filter(
    (entry) => entry.student_id === studentId
  );
  const scoredAssessments = assessmentsForStudent.filter(
    (entry) => entry.score !== null && Number.isFinite(Number(entry.score))
  );
  const studentScores = developmentScores
    .filter((score) => score.student_id === studentId)
    .sort((a, b) => (b.score_date || b.created_at || "").localeCompare(a.score_date || a.created_at || ""));
  const classItem = classes.find((item) => item.id === student?.class_id);
  const attendanceForStudent = attendanceEntries.filter((entry) => entry.student_id === studentId);
  const attendanceSummary = {
    present: attendanceForStudent.filter((entry) => entry.status === "Present").length,
    absent: attendanceForStudent.filter((entry) => entry.status === "Didn't come").length,
    late: attendanceForStudent.filter((entry) => entry.status === "Arrived late").length,
    leftEarly: attendanceForStudent.filter((entry) => entry.status === "Left early").length,
  };
  const attendanceTotal =
    attendanceSummary.present +
    attendanceSummary.absent +
    attendanceSummary.late +
    attendanceSummary.leftEarly;
  const assessmentLookup = useMemo(() => {
    const map = new Map();
    assessments.forEach((assessment) => map.set(assessment.id, assessment));
    return map;
  }, [assessments]);
  const overallAverage = averageFromPercents(
    scoredAssessments.map((entry) => entryToPercent(entry, assessmentLookup))
  );
  const subjectLookup = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => map.set(subject.id, subject));
    return map;
  }, [subjects]);
  const criteriaLookup = useMemo(() => {
    const map = new Map();
    rubricCriteria.forEach((criterion) => map.set(criterion.id, criterion));
    return map;
  }, [rubricCriteria]);
  const categoryLookup = useMemo(() => {
    const map = new Map();
    rubricCategories.forEach((category) => map.set(category.id, category));
    return map;
  }, [rubricCategories]);
  const rubricLookup = useMemo(() => {
    const map = new Map();
    rubrics.forEach((rubric) => map.set(rubric.id, rubric));
    return map;
  }, [rubrics]);
  const [developmentYearFilter, setDevelopmentYearFilter] = useState("all");

  const normalizedLevel = (value) => {
    const level = (value || "").toLowerCase();
    if (level.startsWith("independent")) return { label: "Independent", color: "#16a34a", short: "Ind." };
    if (level.startsWith("instructional")) return { label: "Instructional", color: "#ea580c", short: "Inst." };
    return { label: "Frustration", color: "#dc2626", short: "Frust." };
  };

  const latestLevel = records.length ? normalizedLevel(records[0].level) : null;
  const avgAccuracy = records.length
    ? records.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) / records.length
    : 0;

  const subjectsForClass = subjects
    .filter((subject) => subject.class_id === student?.class_id)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.created_at || "").localeCompare(b.created_at || "")
    );

  const performanceBySubject = subjectsForClass.map((subject) => {
    const assessmentIds = new Set(
      assessments.filter((assessment) => assessment.subject_id === subject.id).map((assessment) => assessment.id)
    );
    const subjectScores = assessmentsForStudent.filter(
      (entry) =>
        assessmentIds.has(entry.assessment_id) &&
        entry.score !== null &&
        Number.isFinite(Number(entry.score))
    );
    const average = averageFromPercents(
      subjectScores.map((entry) => entryToPercent(entry, assessmentLookup))
    );
    return { subject, count: subjectScores.length, average };
  });

  const recentAssessments = assessmentsForStudent
    .map((entry) => ({ entry, assessment: assessmentLookup.get(entry.assessment_id) }))
    .sort((a, b) => {
      const dateA = a.assessment?.assessment_date || "";
      const dateB = b.assessment?.assessment_date || "";
      if (dateA !== dateB) return dateB.localeCompare(dateA);
      return Number(b.assessment?.sort_order ?? 0) - Number(a.assessment?.sort_order ?? 0);
    })
    .slice(0, 10);

  const latestScoresByCriterion = [];
  const seenCriteria = new Set();
  for (const score of studentScores) {
    if (!score.criterion_id || seenCriteria.has(score.criterion_id)) continue;
    seenCriteria.add(score.criterion_id);
    latestScoresByCriterion.push(score);
  }
  const groupedDevelopment = latestScoresByCriterion.reduce((acc, score) => {
    const criterion = criteriaLookup.get(score.criterion_id);
    const categoryName = categoryLookup.get(criterion?.category_id)?.name || "Other";
    if (!acc[categoryName]) acc[categoryName] = [];
    acc[categoryName].push(score);
    return acc;
  }, {});

  const ratingLabel = (rating) => {
    if (rating === 1) return "Needs Significant Support";
    if (rating === 2) return "Beginning to Develop";
    if (rating === 3) return "Developing";
    if (rating === 4) return "Proficient";
    if (rating === 5) return "Mastering / Exceeding";
    return "Not Rated";
  };

  const averageColor = (value) => {
    return performanceColor(value);
  };
  const activeDevelopmentHistory = activeDevelopmentCriterionId
    ? studentScores.filter((score) => score.criterion_id === activeDevelopmentCriterionId)
    : [];
  const activeDevelopmentHistoryChronological = [...activeDevelopmentHistory].reverse();
  const activeDevelopmentCriterion = activeDevelopmentCriterionId
    ? criteriaLookup.get(activeDevelopmentCriterionId)
    : null;
  const activeDevelopmentCategoryName = activeDevelopmentCriterion
    ? categoryLookup.get(activeDevelopmentCriterion.category_id)?.name || "Other"
    : "";

  const trendLabel = (current, previous) => {
    if (!previous) return "Baseline";
    const currentRating = Number(current?.rating || 0);
    const previousRating = Number(previous?.rating || 0);
    if (currentRating > previousRating) return "Improved";
    if (currentRating < previousRating) return "Needs Support";
    return "Steady";
  };

  const startEditingDevelopmentHistory = (score) => {
    setEditingDevelopmentScoreId(score.id);
    setDevelopmentHistoryEditForm({
      rating: String(Number(score.rating || 3)),
      date: score.score_date || "",
      notes: score.notes || "",
    });
  };
  const sparklineData = useMemo(() => {
    const ratings = activeDevelopmentHistoryChronological
      .map((item) => Number(item.rating))
      .filter((value) => Number.isFinite(value));
    if (!ratings.length) return null;
    const width = 320;
    const height = ratings.length <= 2 ? 56 : 88;
    const padX = 12;
    const padY = 12;
    const usableWidth = width - padX * 2;
    const usableHeight = height - padY * 2;
    const xForIndex = (index) =>
      ratings.length === 1 ? width / 2 : padX + (usableWidth * index) / (ratings.length - 1);
    const yForRating = (rating) => padY + ((5 - rating) / 4) * usableHeight;
    const points = ratings.map((rating, index) => `${xForIndex(index)},${yForRating(rating)}`).join(" ");
    return {
      width,
      height,
      points,
      dots: ratings.map((rating, index) => ({
        x: xForIndex(index),
        y: yForRating(rating),
        rating,
      })),
      first: ratings[0],
      last: ratings[ratings.length - 1],
      total: ratings.length,
    };
  }, [activeDevelopmentHistoryChronological]);

  useEffect(() => {
    setEditingDevelopmentScoreId("");
    setShowAddDevelopmentHistoryForm(false);
    setNewDevelopmentHistoryForm({
      rating: "3",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  }, [activeDevelopmentCriterionId]);

  const rubricYearOptions = useMemo(() => {
    const values = new Set();
    rubrics.forEach((rubric) => {
      const gradeBand = (rubric.grade_band || "").trim();
      if (gradeBand) values.add(gradeBand);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rubrics]);

  const rubricCriteriaWithMeta = useMemo(() => {
    return rubricCriteria.map((criterion) => {
      const category = categoryLookup.get(criterion.category_id);
      const rubric = rubricLookup.get(category?.rubric_id);
      return {
        ...criterion,
        categoryName: category?.name || "Other",
        gradeBand: (rubric?.grade_band || "General").trim() || "General",
      };
    });
  }, [rubricCriteria, categoryLookup, rubricLookup]);

  const filteredCriteriaForForm = useMemo(() => {
    const byYear =
      developmentYearFilter === "all"
        ? rubricCriteriaWithMeta
        : rubricCriteriaWithMeta.filter((criterion) => criterion.gradeBand === developmentYearFilter);
    return byYear.sort((a, b) => {
      const groupA = `${a.gradeBand} ${a.categoryName}`;
      const groupB = `${b.gradeBand} ${b.categoryName}`;
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return (a.label || a.description || "").localeCompare(b.label || b.description || "");
    });
  }, [rubricCriteriaWithMeta, developmentYearFilter]);

  const selectedCriterionMeta = useMemo(
    () => rubricCriteriaWithMeta.find((criterion) => criterion.id === developmentScoreForm.criterionId) || null,
    [rubricCriteriaWithMeta, developmentScoreForm.criterionId]
  );

  const filteredCriteriaIds = useMemo(
    () => new Set(filteredCriteriaForForm.map((criterion) => criterion.id)),
    [filteredCriteriaForForm]
  );

  useEffect(() => {
    if (!developmentScoreForm.criterionId) return;
    if (filteredCriteriaIds.has(developmentScoreForm.criterionId)) return;
    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: "" }));
  }, [developmentScoreForm.criterionId, filteredCriteriaIds, setDevelopmentScoreForm]);

  const groupedCriterionOptions = useMemo(() => {
    const groupMap = new Map();
    filteredCriteriaForForm.forEach((criterion) => {
      const groupLabel = `${criterion.gradeBand} • ${criterion.categoryName}`;
      if (!groupMap.has(groupLabel)) groupMap.set(groupLabel, []);
      groupMap.get(groupLabel).push(criterion);
    });
    return Array.from(groupMap.entries());
  }, [filteredCriteriaForForm]);

  const toggleStatus = async (field) => {
    if (!student) return;
    const next = {
      gender: student.gender || "Prefer not to say",
      notes: student.notes || "",
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
      [field]:
        field === "isParticipatingWell"
          ? !student.is_participating_well
          : field === "needsHelp"
            ? !student.needs_help
            : !student.missing_homework,
    };
    await handleUpdateStudent(studentId, next);
  };

  if (!student) {
    return (
      <section className="panel">
        <h2>Student not found</h2>
        <p className="muted">Select a student from a class.</p>
      </section>
    );
  }

  const studentInitials = `${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`
    .toUpperCase()
    .trim() || "S";
  const classLabel = classItem
    ? `${classItem.name}${classItem.grade_level ? ` (${classItem.grade_level})` : ""}`
    : "No class";

  const StudentStatusIcon = ({ kind }) => {
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
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
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
        <button
          type="button"
          className="secondary"
          onClick={() => {
            setEditForm({
              gender: student.gender || "Prefer not to say",
              notes: student.notes || "",
              isParticipatingWell: !!student.is_participating_well,
              needsHelp: !!student.needs_help,
              missingHomework: !!student.missing_homework,
            });
            setShowEditInfo(true);
          }}
        >
          Edit Info
        </button>
      </section>

      <section className="panel student-status-panel">
        <h3>Quick Status</h3>
        <div className="student-status-grid">
          <button
            type="button"
            className={`student-status-card status-participating ${student.is_participating_well ? "active green" : ""}`}
            onClick={() => toggleStatus("isParticipatingWell")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="participating" />
            </span>
            <div>
              <strong>Participating Well</strong>
              <p>{student.is_participating_well ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-needs-help ${student.needs_help ? "active orange" : ""}`}
            onClick={() => toggleStatus("needsHelp")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="needsHelp" />
            </span>
            <div>
              <strong>Needs Help</strong>
              <p>{student.needs_help ? "Active" : "Inactive"}</p>
            </div>
          </button>
          <button
            type="button"
            className={`student-status-card status-missing-homework ${student.missing_homework ? "active red" : ""}`}
            onClick={() => toggleStatus("missingHomework")}
          >
            <span className="student-status-icon" aria-hidden="true">
              <StudentStatusIcon kind="homework" />
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
          <p style={{ color: "#8a5c34" }}>{assessmentsForStudent.length}</p>
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
            {recentAssessments.map(({ entry, assessment }) => {
              const subjectName = subjectLookup.get(assessment?.subject_id)?.name;
              const percent = entryToPercent(entry, assessmentLookup);
              return (
                <li key={entry.id}>
                  <span>
                    {assessment?.title || "Assessment"}
                    {subjectName ? ` · ${subjectName}` : ""}
                    {assessment?.assessment_date ? ` · ${assessment.assessment_date}` : ""}
                  </span>
                  {entry.score !== null && Number.isFinite(Number(entry.score)) && percent !== null ? (
                    <strong style={{ color: averageColor(percent) }}>{percent.toFixed(1)}%</strong>
                  ) : (
                    <strong className="muted">Not graded</strong>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="panel">
        <div className="student-section-title">
          <h3>Development Tracking</h3>
          <button type="button" onClick={() => setShowDevelopmentForm(true)}>
            Update
          </button>
        </div>
        {Object.keys(groupedDevelopment).length === 0 ? (
          <p className="muted">No development tracking yet.</p>
        ) : (
          <div className="student-development-groups">
            {Object.entries(groupedDevelopment)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([categoryName, scores]) => (
                <article key={categoryName} className="student-development-category">
                  <h4>{categoryName}</h4>
                  <ul className="list student-dev-list">
                    {scores.map((score) => {
                      const criterion = criteriaLookup.get(score.criterion_id);
                      const scoreValue = Math.max(0, Number(score.rating || 0));
                      return (
                        <li key={score.id}>
                          <button
                            type="button"
                            className="student-dev-row-btn"
                            onClick={() => {
                              setActiveDevelopmentCriterionId(score.criterion_id || "");
                              setEditingDevelopmentScoreId("");
                            }}
                          >
                            <span className="student-dev-criterion">
                              <span className="student-dev-criterion-title">
                                {criterion?.label || "Criterion"}
                              </span>
                              {score.notes ? (
                                <span className="student-dev-criterion-note">{score.notes}</span>
                              ) : (
                                <span className="student-dev-criterion-note subtle">No notes added</span>
                              )}
                            </span>
                            <span className="student-dev-rating">
                              <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                                {"★".repeat(scoreValue)}
                                {"☆".repeat(Math.max(0, 5 - scoreValue))}
                              </span>
                              <span className="student-dev-label">{ratingLabel(scoreValue)}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        )}
      </section>

      {activeDevelopmentCriterion && (
        <div className="modal-overlay">
          <div className="modal-card development-history-modal">
            <div className="development-history-header">
              <div>
                <h3>{activeDevelopmentCriterion.label || "Criterion History"}</h3>
                <p className="muted">{activeDevelopmentCategoryName}</p>
                {activeDevelopmentCriterion.description ? (
                  <p className="development-history-description">{activeDevelopmentCriterion.description}</p>
                ) : null}
              </div>
              <div className="development-history-header-actions">
                <button
                  type="button"
                  onClick={() => setShowAddDevelopmentHistoryForm((prev) => !prev)}
                >
                  {showAddDevelopmentHistoryForm ? "Cancel new rating" : "+ Add New Rating"}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => {
                    setActiveDevelopmentCriterionId("");
                    setEditingDevelopmentScoreId("");
                    setShowAddDevelopmentHistoryForm(false);
                  }}
                  aria-label="Close history"
                >
                  ×
                </button>
              </div>
            </div>

            {activeDevelopmentHistory.length === 0 ? (
              <p className="muted">No history yet for this criterion.</p>
            ) : (
              <>
                {sparklineData && (
                  <section
                    className={`development-sparkline-card ${sparklineData.total <= 2 ? "compact" : ""}`}
                    aria-label="Progress trend"
                  >
                    <div className="development-sparkline-meta">
                      <strong>Trend</strong>
                      <span>{sparklineData.total} entries</span>
                    </div>
                    <svg
                      className="development-sparkline"
                      viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                      role="img"
                      aria-label={`Ratings moved from ${sparklineData.first} to ${sparklineData.last}`}
                    >
                      <polyline
                        className="development-sparkline-line"
                        points={sparklineData.points}
                      />
                      {sparklineData.dots.map((dot, idx) => (
                        <circle key={idx} cx={dot.x} cy={dot.y} r="3.2" className="development-sparkline-dot" />
                      ))}
                    </svg>
                    <div className="development-sparkline-labels">
                      <span>Earlier: {sparklineData.first}/5</span>
                      <span>Latest: {sparklineData.last}/5</span>
                    </div>
                    {sparklineData.total === 1 && (
                      <p className="development-sparkline-hint">Add one more rating to start visual trend tracking.</p>
                    )}
                  </section>
                )}
                {showAddDevelopmentHistoryForm && (
                  <form
                    className="development-history-add"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const success = await handleCreateDevelopmentScoreEntry({
                        studentId,
                        criterionId: activeDevelopmentCriterionId,
                        rating: newDevelopmentHistoryForm.rating,
                        date: newDevelopmentHistoryForm.date,
                        notes: newDevelopmentHistoryForm.notes,
                      });
                      if (!success) return;
                      setShowAddDevelopmentHistoryForm(false);
                      setNewDevelopmentHistoryForm({
                        rating: "3",
                        date: format(new Date(), "yyyy-MM-dd"),
                        notes: "",
                      });
                    }}
                  >
                    <label className="stack">
                      <span>Rating</span>
                      <select
                        value={newDevelopmentHistoryForm.rating}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, rating: event.target.value }))
                        }
                      >
                        <option value="1">1 - Needs Significant Support</option>
                        <option value="2">2 - Beginning to Develop</option>
                        <option value="3">3 - Developing</option>
                        <option value="4">4 - Proficient</option>
                        <option value="5">5 - Mastering / Exceeding</option>
                      </select>
                    </label>
                    <label className="stack">
                      <span>Date</span>
                      <input
                        type="date"
                        value={newDevelopmentHistoryForm.date}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, date: event.target.value }))
                        }
                      />
                    </label>
                    <label className="stack">
                      <span>Notes</span>
                      <textarea
                        rows="2"
                        value={newDevelopmentHistoryForm.notes}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        placeholder="Optional notes"
                      />
                    </label>
                    <div className="modal-actions">
                      <button type="submit">Save new rating</button>
                    </div>
                  </form>
                )}
                <ul className="list development-history-list">
                {activeDevelopmentHistory.map((score, index) => {
                  const nextOlderScore = activeDevelopmentHistory[index + 1];
                  const trend = trendLabel(score, nextOlderScore);
                  const scoreValue = Math.max(0, Number(score.rating || 0));
                  const trendClass =
                    trend === "Improved" ? "improved" : trend === "Needs Support" ? "declined" : "steady";
                  const dateLabel = score.score_date || score.created_at?.slice(0, 10) || "No date";
                  return (
                    <li key={score.id}>
                      <div className="development-history-item-head">
                        <div className="development-history-rating">
                          <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                            {"★".repeat(scoreValue)}
                            {"☆".repeat(Math.max(0, 5 - scoreValue))}
                          </span>
                          <span>{ratingLabel(scoreValue)}</span>
                        </div>
                        <div className={`development-trend ${trendClass}`}>{trend}</div>
                      </div>
                      <p className="development-history-date">{dateLabel}</p>
                      {editingDevelopmentScoreId === score.id ? (
                        <form
                          className="development-history-edit"
                          onSubmit={async (event) => {
                            event.preventDefault();
                            const success = await handleUpdateDevelopmentScore(score.id, {
                              rating: developmentHistoryEditForm.rating,
                              date: developmentHistoryEditForm.date,
                              notes: developmentHistoryEditForm.notes,
                            });
                            if (!success) return;
                            setEditingDevelopmentScoreId("");
                          }}
                        >
                          <label className="stack">
                            <span>Rating</span>
                            <select
                              value={developmentHistoryEditForm.rating}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  rating: event.target.value,
                                }))
                              }
                            >
                              <option value="1">1 - Needs Significant Support</option>
                              <option value="2">2 - Beginning to Develop</option>
                              <option value="3">3 - Developing</option>
                              <option value="4">4 - Proficient</option>
                              <option value="5">5 - Mastering / Exceeding</option>
                            </select>
                          </label>
                          <label className="stack">
                            <span>Date</span>
                            <input
                              type="date"
                              value={developmentHistoryEditForm.date}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  date: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <label className="stack">
                            <span>Notes</span>
                            <textarea
                              rows="2"
                              value={developmentHistoryEditForm.notes}
                              onChange={(event) =>
                                setDevelopmentHistoryEditForm((prev) => ({
                                  ...prev,
                                  notes: event.target.value,
                                }))
                              }
                              placeholder="Optional notes"
                            />
                          </label>
                          <div className="modal-actions">
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setEditingDevelopmentScoreId("")}
                            >
                              Cancel
                            </button>
                            <button type="submit">Save changes</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          {score.notes ? (
                            <p className="development-history-note">{score.notes}</p>
                          ) : (
                            <p className="development-history-note muted">No notes for this record.</p>
                          )}
                          <div className="development-history-actions">
                            <button type="button" className="secondary" onClick={() => startEditingDevelopmentHistory(score)}>
                              Edit
                            </button>
                          </div>
                        </>
                      )}
                    </li>
                  );
                })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {showDevelopmentForm && (
        <div className="modal-overlay">
          <div className="modal-card development-modal">
            <div className="development-modal-header">
              <h3>Update Development Tracking</h3>
              <p className="muted">Choose the year range first, then pick the criterion with context.</p>
            </div>
            <form
              onSubmit={async (event) => {
                await handleCreateDevelopmentScore(event, studentId);
                setShowDevelopmentForm(false);
              }}
              className="development-modal-form"
            >
              <label className="stack">
                <span>Year Range</span>
                <select
                  value={developmentYearFilter}
                  onChange={(event) => setDevelopmentYearFilter(event.target.value)}
                >
                  <option value="all">All year ranges</option>
                  {rubricYearOptions.map((yearRange) => (
                    <option key={yearRange} value={yearRange}>
                      {yearRange}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Criterion</span>
                <select
                  value={developmentScoreForm.criterionId}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select criterion</option>
                  {groupedCriterionOptions.map(([groupLabel, criteria]) => (
                    <optgroup key={groupLabel} label={groupLabel}>
                      {criteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.label || criterion.description || "Criterion"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="development-criterion-preview">
                {selectedCriterionMeta ? (
                  <>
                    <strong>{selectedCriterionMeta.label || "Selected criterion"}</strong>
                    <p className="muted">
                      {selectedCriterionMeta.description || "No extra description for this criterion yet."}
                    </p>
                    <div className="development-criterion-meta">
                      <span>{selectedCriterionMeta.gradeBand}</span>
                      <span>{selectedCriterionMeta.categoryName}</span>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    Select a criterion to see what it measures before saving.
                  </p>
                )}
              </div>
              <label className="stack">
                <span>Rating (1-5)</span>
                <select
                  value={developmentScoreForm.rating}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                >
                  <option value="1">1 - Needs Significant Support</option>
                  <option value="2">2 - Beginning to Develop</option>
                  <option value="3">3 - Developing</option>
                  <option value="4">4 - Proficient</option>
                  <option value="5">5 - Mastering / Exceeding</option>
                </select>
              </label>
              <label className="stack">
                <span>Date</span>
                <input
                  type="date"
                  value={developmentScoreForm.date}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>Notes</span>
                <input
                  value={developmentScoreForm.notes}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <div className="modal-actions development-modal-actions">
                <button type="button" className="secondary" onClick={() => setShowDevelopmentForm(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditInfo && (
        <div className="modal-overlay">
          <div className="modal-card student-edit-modal">
            <div className="student-edit-header">
              <h3>Edit Student</h3>
              <p className="muted">
                Update student info and reminders for {student.first_name} {student.last_name}.
              </p>
            </div>
            <form
              className="student-edit-form"
              onSubmit={async (event) => {
                event.preventDefault();
                await handleUpdateStudent(studentId, editForm);
                setShowEditInfo(false);
              }}
            >
              <label className="stack">
                <span>Gender</span>
                <select
                  value={editForm.gender}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))}
                >
                  {STUDENT_GENDER_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Notes</span>
                <textarea
                  rows="3"
                  value={editForm.notes}
                  onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
                  placeholder="Optional notes about this student"
                />
              </label>
              <p className="muted student-edit-help">
                To keep students apart during group generation, use{" "}
                <NavLink to={`/groups?classId=${student.class_id || ""}`}>Groups → Separations</NavLink>.
              </p>
              <div className="modal-actions student-edit-actions">
                <button type="button" className="secondary" onClick={() => setShowEditInfo(false)}>
                  Cancel
                </button>
                <button type="submit">Done</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default StudentDetailPage;
