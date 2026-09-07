import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import ActivityCriteriaSection, { criterionKey } from "../components/activity-assessment/ActivityCriteriaSection";
import "../styles/activity-assessment.css";

const OUTCOME_OPTIONS = [
  { value: "needs_support", label: "Needs support" },
  { value: "working_towards", label: "Working towards" },
  { value: "met", label: "Met" },
  { value: "exceeded", label: "Exceeded" },
];

const OTHER_SUBJECT_VALUE = "__other__";
const OUTCOME_RANK = ["needs_support", "working_towards", "met", "exceeded"];
let newCriterionSequence = 0;

function byName(first, second) {
  return `${first.first_name || ""} ${first.last_name || ""}`.localeCompare(
    `${second.first_name || ""} ${second.last_name || ""}`,
    undefined,
    { sensitivity: "base" }
  );
}

function emptyStudentResult() {
  return { outcome: "", notes: "", assessedAt: "" };
}

function createEmptyCriterion() {
  newCriterionSequence += 1;
  return {
    clientId: `new-criterion-${newCriterionSequence}`,
    title: "",
    description: "",
  };
}

function criterionResultKey(criterionId, studentId) {
  return `${criterionId}:${studentId}`;
}

function ActivityAssessmentPage({ classes, students, subjects = [] }) {
  const { classId, activityAssessmentId } = useParams();
  const navigate = useNavigate();
  const isExistingActivity = Boolean(activityAssessmentId);
  const classItem = classes.find((item) => item.id === classId);
  const classStudents = useMemo(
    () => students.filter((student) => student.class_id === classId).sort(byName),
    [classId, students]
  );
  const classSubjects = useMemo(
    () => subjects
      .filter((subject) => subject.class_id === classId)
      .sort((first, second) => {
        const sortDifference = Number(first.sort_order || 0) - Number(second.sort_order || 0);
        return sortDifference || first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
      }),
    [classId, subjects]
  );
  const [activity, setActivity] = useState({
    activityDate: format(new Date(), "yyyy-MM-dd"),
    subjectId: "",
    customSubject: "",
    title: "",
    description: "",
  });
  const [studentResults, setStudentResults] = useState({});
  const [dirtyStudentIds, setDirtyStudentIds] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [criterionResults, setCriterionResults] = useState({});
  const [dirtyCriterionResultKeys, setDirtyCriterionResultKeys] = useState([]);
  const [removedCriterionIds, setRemovedCriterionIds] = useState([]);
  const [assessmentMode, setAssessmentMode] = useState("criterion");
  const [activeCriterionKey, setActiveCriterionKey] = useState("");
  const [loadingActivity, setLoadingActivity] = useState(isExistingActivity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const suggestedOutcomeForStudent = (studentId) => {
    const outcomes = criteria
      .map((criterion) => criterionResults[criterionResultKey(criterionKey(criterion), studentId)]?.outcome)
      .filter(Boolean);
    if (outcomes.length === 0) return "";
    const averageRank = outcomes.reduce(
      (total, outcome) => total + OUTCOME_RANK.indexOf(outcome),
      0
    ) / outcomes.length;
    return OUTCOME_RANK[Math.round(averageRank)] || "";
  };

  const effectiveOutcomeForStudent = (studentId) =>
    studentResults[studentId]?.outcome || suggestedOutcomeForStudent(studentId);
  const assessedCount = criteria.length > 0
    ? classStudents.filter((student) =>
        criteria.every((criterion) =>
          criterionResults[criterionResultKey(criterionKey(criterion), student.id)]?.outcome
        )
      ).length
    : classStudents.filter((student) => effectiveOutcomeForStudent(student.id)).length;

  useEffect(() => {
    if (!activityAssessmentId) return;
    let active = true;

    const loadActivity = async () => {
      setLoadingActivity(true);
      const [
        { data: activityRow, error: activityError },
        { data: entryRows, error: entriesError },
        { data: criterionRows, error: criteriaError },
      ] = await Promise.all([
        supabase
          .from("activity_assessments")
          .select("id,class_id,activity_date,subject_id,subject,title,description")
          .eq("id", activityAssessmentId)
          .eq("class_id", classId)
          .single(),
        supabase
          .from("activity_assessment_entries")
          .select("id,student_id,outcome,notes,created_at")
          .eq("activity_assessment_id", activityAssessmentId),
        supabase
          .from("activity_assessment_criteria")
          .select("id,title,description,sort_order,activity_assessment_criterion_results(id,student_id,outcome,notes,observed_at)")
          .eq("activity_assessment_id", activityAssessmentId)
          .order("sort_order", { ascending: true })
          .order("created_at", { ascending: true }),
      ]);

      if (!active) return;
      if (activityError || entriesError || criteriaError || !activityRow) {
        setError(
          activityError?.message || entriesError?.message || criteriaError?.message || "Activity not found."
        );
        setLoadingActivity(false);
        return;
      }

      const matchingSubject = classSubjects.find((subject) =>
        subject.id === activityRow.subject_id ||
        subject.name.trim().toLocaleLowerCase() === activityRow.subject.trim().toLocaleLowerCase()
      );
      setActivity({
        activityDate: activityRow.activity_date,
        subjectId: matchingSubject?.id || OTHER_SUBJECT_VALUE,
        customSubject: matchingSubject ? "" : activityRow.subject,
        title: activityRow.title || activityRow.subject,
        description: activityRow.description,
      });
      setStudentResults(
        Object.fromEntries(
          (entryRows || []).map((entry) => [
            entry.student_id,
            {
              outcome: entry.outcome,
              notes: entry.notes || "",
              assessedAt: entry.created_at,
            },
          ])
        )
      );
      setDirtyStudentIds([]);
      const loadedCriteria = (criterionRows || []).map((criterion) => ({
        id: criterion.id,
        title: criterion.title,
        description: criterion.description || "",
      }));
      setCriteria(loadedCriteria);
      setActiveCriterionKey(loadedCriteria[0]?.id || "");
      setCriterionResults(
        Object.fromEntries(
          (criterionRows || []).flatMap((criterion) =>
            (criterion.activity_assessment_criterion_results || []).map((result) => [
              criterionResultKey(criterion.id, result.student_id),
              {
                id: result.id,
                outcome: result.outcome,
                notes: result.notes || "",
                observedAt: result.observed_at,
              },
            ])
          )
        )
      );
      setDirtyCriterionResultKeys([]);
      setRemovedCriterionIds([]);
      setError("");
      setLoadingActivity(false);
    };

    loadActivity();
    return () => { active = false; };
  }, [activityAssessmentId, classId, classSubjects]);

  if (!classItem) {
    return (
      <section className="panel">
        <h2>Class not found</h2>
        <NavLink to="/classes">Back to classes</NavLink>
      </section>
    );
  }

  const updateStudentResult = (studentId, field, value) => {
    setStudentResults((current) => ({
      ...current,
      [studentId]: {
        ...(current[studentId] || emptyStudentResult()),
        [field]: value,
      },
    }));
    setDirtyStudentIds((current) => current.includes(studentId) ? current : [...current, studentId]);
  };

  const setOutcomeForAll = (outcome) => {
    setStudentResults((current) => {
      const next = { ...current };
      classStudents.forEach((student) => {
        next[student.id] = {
          ...(next[student.id] || emptyStudentResult()),
          outcome,
        };
      });
      return next;
    });
    setDirtyStudentIds(classStudents.map((student) => student.id));
  };

  const addCriterion = () => {
    const criterion = createEmptyCriterion();
    setCriteria((current) => [...current, criterion]);
    setActiveCriterionKey(criterion.clientId);
  };

  const updateCriterion = (key, field, value) => {
    setCriteria((current) =>
      current.map((criterion) =>
        criterionKey(criterion) === key ? { ...criterion, [field]: value } : criterion
      )
    );
  };

  const moveCriterion = (index, direction) => {
    setCriteria((current) => {
      const targetIndex = index + direction;
      if (targetIndex < 0 || targetIndex >= current.length) return current;
      const next = [...current];
      [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
      return next;
    });
  };

  const removeCriterion = (key) => {
    const criterion = criteria.find((item) => criterionKey(item) === key);
    if (!criterion) return;
    if (criterion.id && !window.confirm(`Remove “${criterion.title}” and its recorded results?`)) return;

    const nextCriteria = criteria.filter((item) => criterionKey(item) !== key);
    setCriteria(nextCriteria);
    setCriterionResults((current) =>
      Object.fromEntries(
        Object.entries(current).filter(([resultKey]) => !resultKey.startsWith(`${key}:`))
      )
    );
    setDirtyCriterionResultKeys((current) =>
      current.filter((resultKey) => !resultKey.startsWith(`${key}:`))
    );
    if (criterion.id) {
      setRemovedCriterionIds((current) => [...current, criterion.id]);
    }
    if (activeCriterionKey === key) {
      setActiveCriterionKey(nextCriteria[0] ? criterionKey(nextCriteria[0]) : "");
    }
  };

  const updateCriterionResult = (criterionId, studentId, field, value) => {
    const key = criterionResultKey(criterionId, studentId);
    setCriterionResults((current) => ({
      ...current,
      [key]: {
        ...(current[key] || { outcome: "", notes: "", observedAt: "" }),
        [field]: value,
      },
    }));
    setDirtyCriterionResultKeys((current) => current.includes(key) ? current : [...current, key]);
    setDirtyStudentIds((current) => current.includes(studentId) ? current : [...current, studentId]);
  };

  const saveAssessment = async (event) => {
    event.preventDefault();
    setError("");

    if (criteria.some((criterion) => !criterion.title.trim())) {
      setError("Give every assessment criterion a title, or remove the empty criterion.");
      return;
    }

    setSaving(true);
    const selectedSubject = classSubjects.find((subject) => subject.id === activity.subjectId);
    const activityPayload = {
      class_id: classId,
      activity_date: activity.activityDate,
      subject_id: selectedSubject?.id || null,
      subject: selectedSubject?.name || activity.customSubject.trim(),
      title: activity.title.trim(),
      description: activity.description.trim(),
    };
    const activityMutation = isExistingActivity
      ? supabase
          .from("activity_assessments")
          .update(activityPayload)
          .eq("id", activityAssessmentId)
          .eq("class_id", classId)
          .select("id")
          .single()
      : supabase
          .from("activity_assessments")
          .insert(activityPayload)
          .select("id")
          .single();
    const { data: savedActivity, error: activityError } = await activityMutation;

    if (activityError || !savedActivity?.id) {
      setSaving(false);
      setError(activityError?.message || "The activity assessment could not be saved.");
      return;
    }

    const failSave = async (message) => {
      if (!isExistingActivity) {
        await supabase.from("activity_assessments").delete().eq("id", savedActivity.id);
      }
      setSaving(false);
      setError(message);
    };

    const criterionIdByKey = new Map();
    criteria.filter((criterion) => criterion.id).forEach((criterion) => {
      criterionIdByKey.set(criterionKey(criterion), criterion.id);
    });

    const persistedCriteria = criteria.filter((criterion) => criterion.id);
    if (persistedCriteria.length > 0) {
      const { error: criteriaUpdateError } = await supabase
        .from("activity_assessment_criteria")
        .upsert(
          persistedCriteria.map((criterion, index) => ({
            id: criterion.id,
            activity_assessment_id: savedActivity.id,
            title: criterion.title.trim(),
            description: criterion.description.trim() || null,
            sort_order: index,
          })),
          { onConflict: "id" }
        );
      if (criteriaUpdateError) {
        await failSave(criteriaUpdateError.message || "The assessment criteria could not be saved.");
        return;
      }
    }

    for (const [index, criterion] of criteria.entries()) {
      if (criterion.id) continue;
      const { data: insertedCriterion, error: criterionInsertError } = await supabase
        .from("activity_assessment_criteria")
        .insert({
          activity_assessment_id: savedActivity.id,
          title: criterion.title.trim(),
          description: criterion.description.trim() || null,
          sort_order: index,
        })
        .select("id")
        .single();
      if (criterionInsertError || !insertedCriterion?.id) {
        await failSave(
          criterionInsertError?.message || "An assessment criterion could not be saved."
        );
        return;
      }
      criterionIdByKey.set(criterionKey(criterion), insertedCriterion.id);
    }

    if (removedCriterionIds.length > 0) {
      const { error: criteriaDeleteError } = await supabase
        .from("activity_assessment_criteria")
        .delete()
        .in("id", removedCriterionIds)
        .eq("activity_assessment_id", savedActivity.id);
      if (criteriaDeleteError) {
        await failSave(criteriaDeleteError.message || "A removed criterion could not be deleted.");
        return;
      }
    }

    const observedAt = new Date().toISOString();
    const criterionRows = [];
    criteria.forEach((criterion) => {
      const localCriterionKey = criterionKey(criterion);
      const savedCriterionId = criterionIdByKey.get(localCriterionKey);
      if (!savedCriterionId) return;
      classStudents.forEach((student) => {
        const localResultKey = criterionResultKey(localCriterionKey, student.id);
        const result = criterionResults[localResultKey];
        const shouldSave = !isExistingActivity || dirtyCriterionResultKeys.includes(localResultKey);
        if (!shouldSave || !result?.outcome) return;
        criterionRows.push({
          criterion_id: savedCriterionId,
          student_id: student.id,
          outcome: result.outcome,
          notes: result.notes?.trim() || null,
          observed_at: observedAt,
        });
      });
    });

    const { error: criterionResultsError } = criterionRows.length > 0
      ? await supabase
          .from("activity_assessment_criterion_results")
          .upsert(criterionRows, { onConflict: "criterion_id,student_id" })
      : { error: null };
    if (criterionResultsError) {
      await failSave(
        criterionResultsError.message || "The criterion results could not be saved."
      );
      return;
    }

    const studentIdsToSave = isExistingActivity
      ? dirtyStudentIds
      : classStudents
          .filter((student) => effectiveOutcomeForStudent(student.id))
          .map((student) => student.id);
    const rows = studentIdsToSave
      .filter((studentId) => effectiveOutcomeForStudent(studentId))
      .map((studentId) => ({
        activity_assessment_id: savedActivity.id,
        student_id: studentId,
        outcome: effectiveOutcomeForStudent(studentId),
        notes: studentResults[studentId]?.notes?.trim() || null,
      }));
    const { error: entriesError } = rows.length > 0
      ? await supabase
          .from("activity_assessment_entries")
          .upsert(rows, { onConflict: "activity_assessment_id,student_id" })
      : { error: null };

    if (entriesError) {
      await failSave(entriesError.message || "The student assessments could not be saved.");
      return;
    }

    navigate(`/classes/${classId}`, {
      replace: true,
      state: { activityAssessmentSaved: true },
    });
  };

  return (
    <section className="panel simple-page activity-assessment-page">
      <NavLink className="simple-back" to={`/classes/${classId}`}>
        ← {classItem.name}
      </NavLink>

      <header className="activity-assessment-header">
        <div>
          <p className="simple-kicker">{classItem.name}</p>
          <h2>{isExistingActivity ? "Continue assessing activity" : "Assess an activity"}</h2>
          <p className="muted">
            Assess only the students who did this activity today. Leave the others blank and return later.
          </p>
        </div>
        <div className="activity-assessment-progress">
          <span className="activity-assessment-count">
            {assessedCount} of {classStudents.length} {criteria.length > 0 ? "complete" : "assessed"}
          </span>
          <progress aria-label="Assessment progress" value={assessedCount} max={classStudents.length || 1} />
        </div>
      </header>

      {error && <div className="error">{error}</div>}
      {loadingActivity && <p className="muted">Loading activity…</p>}

      {!loadingActivity && <form className="activity-assessment-form" onSubmit={saveAssessment}>
        <section className="activity-details-card">
          <h3>Activity details</h3>
          <div className="activity-details-grid">
            <label className="stack">
              <span>Date</span>
              <input
                type="date"
                required
                value={activity.activityDate}
                onChange={(event) =>
                  setActivity((current) => ({
                    ...current,
                    activityDate: event.target.value,
                  }))
                }
              />
            </label>
            <label className="stack">
              <span>Subject</span>
              <select
                required
                value={activity.subjectId}
                onChange={(event) =>
                  setActivity((current) => ({ ...current, subjectId: event.target.value }))
                }
              >
                <option value="" disabled>Choose a subject</option>
                {classSubjects.map((subject) => (
                  <option key={subject.id} value={subject.id}>{subject.name}</option>
                ))}
                <option value={OTHER_SUBJECT_VALUE}>Other subject</option>
              </select>
            </label>
          </div>
          {activity.subjectId === OTHER_SUBJECT_VALUE && (
            <label className="stack">
              <span>Subject name</span>
              <input
                required
                value={activity.customSubject}
                onChange={(event) =>
                  setActivity((current) => ({ ...current, customSubject: event.target.value }))
                }
                placeholder="e.g. Guided reading"
              />
            </label>
          )}
          <label className="stack">
            <span>Activity title</span>
            <input
              required
              value={activity.title}
              onChange={(event) =>
                setActivity((current) => ({ ...current, title: event.target.value }))
              }
              placeholder="e.g. Retelling the main events"
            />
          </label>
          <label className="stack">
            <span>Brief activity description</span>
            <textarea
              rows="3"
              required
              value={activity.description}
              onChange={(event) =>
                setActivity((current) => ({ ...current, description: event.target.value }))
              }
              placeholder="What did the students do, and what were you looking for?"
            />
          </label>
        </section>

        <ActivityCriteriaSection
          criteria={criteria}
          students={classStudents}
          results={criterionResults}
          outcomeOptions={OUTCOME_OPTIONS}
          assessmentMode={assessmentMode}
          activeCriterionKey={activeCriterionKey}
          onAssessmentModeChange={setAssessmentMode}
          onActiveCriterionChange={setActiveCriterionKey}
          onAddCriterion={addCriterion}
          onUpdateCriterion={updateCriterion}
          onMoveCriterion={moveCriterion}
          onRemoveCriterion={removeCriterion}
          onResultChange={updateCriterionResult}
        />

        {classStudents.length === 0 ? (
          <div className="simple-empty">
            <h3>No students to assess</h3>
            <p>Add students to this class before assessing an activity.</p>
          </div>
        ) : (
          <section className="activity-student-section">
            <div className="activity-student-heading">
              <div>
                <p className="simple-kicker">{criteria.length > 0 ? "Overall summary" : "Individual outcomes"}</p>
                <h3>{criteria.length > 0 ? "Confirm overall outcomes" : "Assess participating students"}</h3>
                {criteria.length > 0 && (
                  <p className="activity-overall-hint">
                    Suggestions use the completed criteria. Keep them or choose a different professional judgment.
                  </p>
                )}
              </div>
              <label>
                <span>Set all to</span>
                <select
                  aria-label="Set outcome for all students"
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) setOutcomeForAll(event.target.value);
                  }}
                >
                  <option value="" disabled>Choose outcome</option>
                  {OUTCOME_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="activity-student-list">
              {classStudents.map((student) => {
                const result = studentResults[student.id] || emptyStudentResult();
                const suggestedOutcome = suggestedOutcomeForStudent(student.id);
                const completedCriterionCount = criteria.filter((criterion) =>
                  criterionResults[criterionResultKey(criterionKey(criterion), student.id)]?.outcome
                ).length;
                const displayedOutcome = result.outcome || suggestedOutcome;
                return (
                  <article className={`activity-student-card${result.assessedAt ? " assessed" : ""}`} key={student.id}>
                    <div className="activity-student-identity">
                      <span className="simple-avatar">
                        {`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}
                      </span>
                      <span>
                        <strong>{student.first_name} {student.last_name}</strong>
                        {result.assessedAt && <small>Assessed {format(new Date(result.assessedAt), "d MMM yyyy")}</small>}
                        {criteria.length > 0 && (
                          <small>{completedCriterionCount} of {criteria.length} criteria assessed</small>
                        )}
                      </span>
                    </div>
                    <label className="stack">
                      <span>
                        Outcome
                        {suggestedOutcome && (
                          <small className="activity-suggested-outcome">
                            Suggested: {OUTCOME_OPTIONS.find((option) => option.value === suggestedOutcome)?.label}
                          </small>
                        )}
                      </span>
                      <select
                        aria-label={`Outcome for ${student.first_name} ${student.last_name}`}
                        value={displayedOutcome}
                        onChange={(event) =>
                          updateStudentResult(student.id, "outcome", event.target.value)
                        }
                      >
                        <option value="" disabled={Boolean(result.assessedAt) || Boolean(suggestedOutcome)}>Not assessed yet</option>
                        {OUTCOME_OPTIONS.map((option) => (
                          <option key={option.value} value={option.value}>{option.label}</option>
                        ))}
                      </select>
                    </label>
                    <label className="stack activity-student-note">
                      <span>Observation (optional)</span>
                      <input
                        aria-label={`Observation for ${student.first_name} ${student.last_name}`}
                        value={result.notes}
                        onChange={(event) =>
                          updateStudentResult(student.id, "notes", event.target.value)
                        }
                        placeholder="A short note specific to this student"
                      />
                    </label>
                  </article>
                );
              })}
            </div>
          </section>
        )}

        <div className="activity-assessment-actions">
          <span className="activity-save-summary">
            {assessedCount} of {classStudents.length} {criteria.length > 0 ? "students complete" : "assessed"}
          </span>
          <div className="activity-save-buttons">
            <NavLink className="button secondary" to={`/classes/${classId}`}>Cancel</NavLink>
            <button type="submit" disabled={saving || classStudents.length === 0}>
              {saving ? "Saving assessments…" : isExistingActivity ? "Save progress" : "Save activity"}
            </button>
          </div>
        </div>
      </form>}
    </section>
  );
}

export default ActivityAssessmentPage;
