import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import "../styles/activity-assessment.css";

const OUTCOME_OPTIONS = [
  { value: "needs_support", label: "Needs support" },
  { value: "working_towards", label: "Working towards" },
  { value: "met", label: "Met" },
  { value: "exceeded", label: "Exceeded" },
];

const OTHER_SUBJECT_VALUE = "__other__";

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
  const [loadingActivity, setLoadingActivity] = useState(isExistingActivity);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const assessedCount = Object.values(studentResults).filter((result) => result.outcome).length;

  useEffect(() => {
    if (!activityAssessmentId) return;
    let active = true;

    const loadActivity = async () => {
      setLoadingActivity(true);
      const [{ data: activityRow, error: activityError }, { data: entryRows, error: entriesError }] = await Promise.all([
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
      ]);

      if (!active) return;
      if (activityError || entriesError || !activityRow) {
        setError(activityError?.message || entriesError?.message || "Activity not found.");
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

  const saveAssessment = async (event) => {
    event.preventDefault();
    setError("");

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

    const studentIdsToSave = isExistingActivity
      ? dirtyStudentIds
      : classStudents
          .filter((student) => studentResults[student.id]?.outcome)
          .map((student) => student.id);
    const rows = studentIdsToSave
      .filter((studentId) => studentResults[studentId]?.outcome)
      .map((studentId) => ({
        activity_assessment_id: savedActivity.id,
        student_id: studentId,
        outcome: studentResults[studentId].outcome,
        notes: studentResults[studentId].notes.trim() || null,
      }));
    const { error: entriesError } = rows.length > 0
      ? await supabase
          .from("activity_assessment_entries")
          .upsert(rows, { onConflict: "activity_assessment_id,student_id" })
      : { error: null };

    if (entriesError) {
      if (!isExistingActivity) {
        await supabase.from("activity_assessments").delete().eq("id", savedActivity.id);
      }
      setSaving(false);
      setError(entriesError.message || "The student assessments could not be saved.");
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
          <span className="activity-assessment-count">{assessedCount} of {classStudents.length} assessed</span>
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

        {classStudents.length === 0 ? (
          <div className="simple-empty">
            <h3>No students to assess</h3>
            <p>Add students to this class before assessing an activity.</p>
          </div>
        ) : (
          <section className="activity-student-section">
            <div className="activity-student-heading">
              <div>
                <p className="simple-kicker">Individual outcomes</p>
                <h3>Assess participating students</h3>
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
                return (
                  <article className={`activity-student-card${result.assessedAt ? " assessed" : ""}`} key={student.id}>
                    <div className="activity-student-identity">
                      <span className="simple-avatar">
                        {`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}
                      </span>
                      <span>
                        <strong>{student.first_name} {student.last_name}</strong>
                        {result.assessedAt && <small>Assessed {format(new Date(result.assessedAt), "d MMM yyyy")}</small>}
                      </span>
                    </div>
                    <label className="stack">
                      <span>Outcome</span>
                      <select
                        aria-label={`Outcome for ${student.first_name} ${student.last_name}`}
                        value={result.outcome}
                        onChange={(event) =>
                          updateStudentResult(student.id, "outcome", event.target.value)
                        }
                      >
                        <option value="" disabled={Boolean(result.assessedAt)}>Not assessed yet</option>
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
          <span className="activity-save-summary">{assessedCount} of {classStudents.length} assessed</span>
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
