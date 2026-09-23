import { format } from "date-fns";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import ActivityCriteriaSection from "../components/activity-assessment/ActivityCriteriaSection";
import useActivityAssessmentEditor from "../features/activity-assessments/useActivityAssessmentEditor";
import {
  OTHER_SUBJECT_VALUE,
  criterionResultKey,
  emptyStudentResult,
} from "../features/activity-assessments/activityAssessmentEditorModel";
import { criterionKey } from "../utils/activityAssessmentCriteria";
import { ACTIVITY_ASSESSMENT_SCALES } from "../utils/activityAssessmentScale";
import "../styles/activity-assessment.css";

function ActivityAssessmentPage({ classes, students, subjects = [], preferences, loading = false }) {
  const { classId, activityAssessmentId } = useParams();
  const navigate = useNavigate();
  const classItem = classes.find((item) => item.id === classId);
  const {
    isExistingActivity, classStudents, classSubjects, activity, setActivity,
    studentResults, criteria, criterionResults, assessmentMode, setAssessmentMode,
    activeCriterionKey, setActiveCriterionKey, saving, assessmentScale, assessmentOptions, resultLabel,
    loadingActivity, displayError, assessedCount, suggestedOutcomeForStudent,
    updateStudentResult, setOutcomeForAll, changeAssessmentScale, addCriterion, updateCriterion,
    moveCriterion, removeCriterion, updateCriterionResult, saveAssessment,
  } = useActivityAssessmentEditor({
    classId,
    activityAssessmentId,
    students,
    subjects,
    preferences,
    onSaved: () => navigate(`/classes/${classId}`, {
      replace: true,
      state: { activityAssessmentSaved: true },
    }),
  });

  if (loading) {
    return <section className="panel"><p className="muted">Loading class…</p></section>;
  }

  if (!classItem) {
    return (
      <section className="panel">
        <h2>Class not found</h2>
        <NavLink to="/classes">Back to classes</NavLink>
      </section>
    );
  }

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

      {displayError && <div className="error">{displayError}</div>}
      {loadingActivity && <p className="muted">Loading activity…</p>}

      {!loadingActivity && <form className="activity-assessment-form" onSubmit={saveAssessment}>
        <section className="activity-details-card">
          <div className="activity-details-heading">
            <h3>Activity details</h3>
            {!isExistingActivity && (
              <div className="activity-scale-control">
                <span>Assessment scale</span>
                <div className="activity-scale-toggle" role="group" aria-label="Assessment scale">
                  <button
                    type="button"
                    aria-pressed={assessmentScale === ACTIVITY_ASSESSMENT_SCALES.OUTCOME}
                    onClick={() => changeAssessmentScale(ACTIVITY_ASSESSMENT_SCALES.OUTCOME)}
                  >
                    Written levels
                  </button>
                  <button
                    type="button"
                    aria-pressed={assessmentScale === ACTIVITY_ASSESSMENT_SCALES.GRADE}
                    onClick={() => changeAssessmentScale(ACTIVITY_ASSESSMENT_SCALES.GRADE)}
                  >
                    0–10 grades
                  </button>
                </div>
                <small>Applies to this activity. Existing selections are converted when you switch.</small>
              </div>
            )}
          </div>
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
          outcomeOptions={assessmentOptions}
          resultLabel={resultLabel}
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
                <p className="simple-kicker">{criteria.length > 0 ? "Overall summary" : `Individual ${resultLabel.toLowerCase()}s`}</p>
                <h3>{criteria.length > 0 ? `Confirm overall ${resultLabel.toLowerCase()}s` : "Assess participating students"}</h3>
                {criteria.length > 0 && (
                  <p className="activity-overall-hint">
                    Suggestions use the completed criteria. Keep them or choose a different professional judgment.
                  </p>
                )}
              </div>
              <label>
                <span>Set all {resultLabel.toLowerCase()}s to</span>
                <select
                  aria-label={`Set ${resultLabel.toLowerCase()} for all students`}
                  defaultValue=""
                  onChange={(event) => {
                    if (event.target.value) setOutcomeForAll(event.target.value);
                  }}
                >
                  <option value="" disabled>Choose {resultLabel.toLowerCase()}</option>
                  {assessmentOptions.map((option) => (
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
                        {resultLabel}
                        {suggestedOutcome && (
                          <small className="activity-suggested-outcome">
                            Suggested: {assessmentOptions.find((option) => option.value === suggestedOutcome)?.label}
                          </small>
                        )}
                      </span>
                      <select
                        aria-label={`${resultLabel} for ${student.first_name} ${student.last_name}`}
                        value={displayedOutcome}
                        onChange={(event) =>
                          updateStudentResult(student.id, "outcome", event.target.value)
                        }
                      >
                        <option value="" disabled={Boolean(result.assessedAt) || Boolean(suggestedOutcome)}>Not assessed yet</option>
                        {assessmentOptions.map((option) => (
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
