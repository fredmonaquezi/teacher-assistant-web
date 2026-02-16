import { useEffect, useState } from "react";
import { format, parseISO } from "date-fns";
import { useParams } from "react-router-dom";
import { averageFromPercents, getAssessmentMaxScore, performanceColor, scoreToPercent } from "../utils/assessmentMetrics";

const AssessmentEntryRow = ({ entry, student, handleUpdateAssessmentEntry, assessmentMaxScore }) => {
  const [scoreValue, setScoreValue] = useState(
    entry.score !== null && entry.score !== undefined ? String(entry.score) : ""
  );
  const [noteValue, setNoteValue] = useState(entry.notes || "");

  const scoreNumber = scoreValue === "" ? null : Number(scoreValue);
  const scorePercent = scoreToPercent(scoreNumber, assessmentMaxScore);
  const scoreColor = scorePercent === null ? "#8b6f4c" : performanceColor(scorePercent);

  return (
    <div className="grade-entry-card">
      <div className="grade-entry-header">
        <div className="grade-entry-name">
          {student.first_name} {student.last_name}
        </div>
        <div className="grade-entry-score">
          <span className="muted">Score:</span>
          <input
            type="number"
            step="0.1"
            min="0"
            value={scoreValue}
            onChange={(event) => setScoreValue(event.target.value)}
            onBlur={() =>
              handleUpdateAssessmentEntry(entry.id, {
                score: scoreValue === "" ? null : Number(scoreValue),
              })
            }
            style={{ color: scoreColor }}
          />
          <span className="grade-entry-percent">
            {scorePercent === null ? "—" : `${scorePercent.toFixed(1)}%`}
          </span>
        </div>
      </div>
      <div className="grade-entry-notes">
        <span className="muted">Notes</span>
        <input
          value={noteValue}
          onChange={(event) => setNoteValue(event.target.value)}
          onBlur={() =>
            handleUpdateAssessmentEntry(entry.id, {
              notes: noteValue.trim() || null,
            })
          }
          placeholder="Add notes"
        />
      </div>
    </div>
  );
};

const AssessmentDetailPage = ({
  assessments,
  assessmentEntries,
  classes,
  subjects,
  units,
  students,
  handleUpdateAssessmentEntry,
  setAssessments,
  handleEnsureAssessmentEntries,
  handleUpdateAssessmentNotes,
}) => {
  const { assessmentId } = useParams();
  const assessment = assessments.find((item) => item.id === assessmentId);
  const assessmentEntriesForAssessment = assessmentEntries.filter(
    (entry) => entry.assessment_id === assessmentId
  );
  const classItem = classes.find((item) => item.id === assessment?.class_id);
  const subjectItem = subjects.find((item) => item.id === assessment?.subject_id);
  const unitItem = units.find((item) => item.id === assessment?.unit_id);
  const classStudents = students
    .filter((student) => student.class_id === assessment?.class_id)
    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  useEffect(() => {
    if (!assessment?.id || classStudents.length === 0) return;
    handleEnsureAssessmentEntries(assessment.id);
  }, [
    assessment,
    classStudents,
    assessmentEntriesForAssessment,
    handleEnsureAssessmentEntries,
  ]);

  if (!assessment) {
    return (
      <section className="panel">
        <h2>Assessment not found</h2>
        <p className="muted">Select an assessment from the gradebook.</p>
      </section>
    );
  }

  const maxScore = getAssessmentMaxScore(assessment);
  const scored = assessmentEntriesForAssessment
    .map((entry) => scoreToPercent(entry.score, maxScore))
    .filter((score) => score !== null && score !== undefined && Number(score) >= 0)
    .map(Number);

  const average = averageFromPercents(scored);
  const highest = scored.length > 0 ? Math.max(...scored) : 0;
  const lowest = scored.length > 0 ? Math.min(...scored) : 0;

  const averageColor = performanceColor(average);

  return (
    <section className="panel gradebook-detail">
      <div className="gradebook-header gradebook-detail-hero">
        <div>
          <p className="gradebook-kicker">Assessment Details</p>
          <h2>{assessment.title}</h2>
        </div>
        <div className="gradebook-date-pill">
          {assessment.assessment_date ? format(parseISO(assessment.assessment_date), "PPP") : ""}
        </div>
      </div>

      <div className="gradebook-stats">
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">Class Average</div>
            <div className="stat-value" style={{ color: averageColor }}>
            {average.toFixed(1)}%
            </div>
          </div>
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">Highest</div>
            <div className="stat-value" style={{ color: "#16a34a" }}>
            {highest.toFixed(1)}%
            </div>
          </div>
        <div className="stat-card gradebook-stat-card">
            <div className="stat-label">Lowest</div>
            <div className="stat-value" style={{ color: "#ef4444" }}>
            {lowest.toFixed(1)}%
            </div>
          </div>
      </div>

      <div className="gradebook-info">
        <h3>Assessment Info</h3>
        <div className="gradebook-info-grid">
          {classItem && (
            <div className="gradebook-info-item">
              <span className="muted">Class</span>
              <strong>{classItem.name}</strong>
            </div>
          )}
          {subjectItem && (
            <div className="gradebook-info-item">
              <span className="muted">Subject</span>
              <strong>{subjectItem.name}</strong>
            </div>
          )}
          {unitItem && (
            <div className="gradebook-info-item">
              <span className="muted">Unit</span>
              <strong>{unitItem.name}</strong>
            </div>
          )}
        </div>
      </div>

      <div className="gradebook-notes">
        <h3>Description</h3>
        <textarea
          rows="4"
          value={assessment.notes || ""}
          onChange={(event) =>
            setAssessments((prev) =>
              prev.map((item) =>
                item.id === assessment.id ? { ...item, notes: event.target.value } : item
              )
            )
          }
          onBlur={(event) =>
            handleUpdateAssessmentNotes(assessment.id, event.target.value)
          }
          placeholder="Add description"
        />
      </div>

      <div className="gradebook-students">
        <div className="gradebook-students-header">
          <h3>Student Grades</h3>
          <span className="muted">
            {scored.length} / {assessmentEntriesForAssessment.length} graded
          </span>
        </div>

        {assessmentEntriesForAssessment.length === 0 ? (
          <div className="muted">No students yet.</div>
        ) : (
          <div className="gradebook-entries">
            {classStudents.map((student) => {
              const entry = assessmentEntriesForAssessment.find(
                (item) => item.student_id === student.id
              );
              return entry ? (
                <AssessmentEntryRow
                  key={`${entry.id}-${entry.score ?? ""}-${entry.notes ?? ""}`}
                  entry={entry}
                  student={student}
                  handleUpdateAssessmentEntry={handleUpdateAssessmentEntry}
                  assessmentMaxScore={maxScore}
                />
              ) : null;
            })}
          </div>
        )}
      </div>
    </section>
  );
};

export default AssessmentDetailPage;
