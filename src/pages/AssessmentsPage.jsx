import { format, parseISO } from "date-fns";
import { NavLink } from "react-router-dom";
import { averageFromPercents, getAssessmentMaxScore, performanceColor, scoreToPercent } from "../utils/assessmentMetrics";

const AssessmentsPage = ({
  formError,
  handleCreateAssessment,
  assessmentForm,
  setAssessmentForm,
  classOptions,
  loading,
  assessments,
  assessmentEntries,
}) => (
  <>
    {formError && <div className="error">{formError}</div>}
    <section className="panel gradebook-page">
      <h2>Gradebook</h2>
      <form onSubmit={handleCreateAssessment} className="grid">
        <label className="stack">
          <span>Title</span>
          <input
            value={assessmentForm.title}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, title: event.target.value }))
            }
            placeholder="Unit 2 Quiz"
            required
          />
        </label>
        <label className="stack">
          <span>Subject</span>
          <input
            value={assessmentForm.subject}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, subject: event.target.value }))
            }
            placeholder="Math"
          />
        </label>
        <label className="stack">
          <span>Date</span>
          <input
            type="date"
            value={assessmentForm.assessmentDate}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, assessmentDate: event.target.value }))
            }
          />
        </label>
        <label className="stack">
          <span>Class</span>
          <select
            value={assessmentForm.classId}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, classId: event.target.value }))
            }
          >
            <option value="">No class</option>
            {classOptions.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="stack">
          <span>Max score</span>
          <input
            type="number"
            min="0"
            value={assessmentForm.maxScore}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, maxScore: event.target.value }))
            }
            placeholder="100"
          />
        </label>
        <label className="stack">
          <span>Notes</span>
          <textarea
            rows="3"
            value={assessmentForm.notes}
            onChange={(event) => setAssessmentForm((prev) => ({ ...prev, notes: event.target.value }))}
            placeholder="Optional"
          />
        </label>
        <label className="stack">
          <span>Sort order</span>
          <input
            type="number"
            min="0"
            value={assessmentForm.sortOrder}
            onChange={(event) =>
              setAssessmentForm((prev) => ({ ...prev, sortOrder: event.target.value }))
            }
            placeholder="0"
          />
        </label>
        <button type="submit">Add assessment</button>
      </form>

      {loading ? (
        <p className="muted">Loading assessments...</p>
      ) : (
        <div className="gradebook-grid">
          {assessments.map((assessment) => {
            const entries = assessmentEntries.filter(
              (entry) => entry.assessment_id === assessment.id && entry.score !== null
            );
            const maxScore = getAssessmentMaxScore(assessment);
            const percents = entries
              .map((entry) => scoreToPercent(entry.score, maxScore))
              .filter((value) => Number.isFinite(value));
            const average = averageFromPercents(percents);
            const averageColor = performanceColor(average);

            return (
              <NavLink key={assessment.id} to={`/assessments/${assessment.id}`} className="gradebook-card">
                <div className="gradebook-card-title">{assessment.title}</div>
                <div className="muted">
                  {assessment.assessment_date
                    ? format(parseISO(assessment.assessment_date), "PPP")
                    : "No date"}
                </div>
                <div className="gradebook-card-meta">
                  {assessment.max_score ? `${assessment.max_score} pts` : "No max score"}
                </div>
                <div className="gradebook-card-average" style={{ color: averageColor }}>
                  Avg {average.toFixed(1)}%
                </div>
              </NavLink>
            );
          })}
          {assessments.length === 0 && <p className="muted">No assessments yet.</p>}
        </div>
      )}
    </section>
  </>
);

export default AssessmentsPage;
