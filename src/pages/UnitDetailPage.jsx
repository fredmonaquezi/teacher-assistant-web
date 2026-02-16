import { useState } from "react";
import { NavLink, useNavigate, useParams } from "react-router-dom";
import ReorderModeToggle from "../components/common/ReorderModeToggle";
import { useHandleDrag } from "../hooks/useHandleDrag";
import { useReorderMode } from "../hooks/useReorderMode";
import { averageFromPercents, entryToPercent, performanceColor } from "../utils/assessmentMetrics";

function UnitDetailPage({
  formError,
  units,
  subjects,
  assessments,
  assessmentEntries,
  handleCreateAssessmentForUnit,
  handleSwapSortOrder,
  handleDeleteAssessment,
  handleCopyAssessmentsFromUnit,
}) {
  const navigate = useNavigate();
  const { unitId } = useParams();
  const unit = units.find((item) => item.id === unitId);
  const subject = subjects.find((item) => item.id === unit?.subject_id);
  const unitAssessments = assessments
    .filter((item) => item.unit_id === unitId)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.assessment_date || "").localeCompare(b.assessment_date || "")
    );
  const unitAssessmentIds = new Set(unitAssessments.map((item) => item.id));
  const unitAssessmentLookup = new Map(unitAssessments.map((assessment) => [assessment.id, assessment]));
  const gradedEntries = assessmentEntries.filter(
    (entry) =>
      unitAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const unitAverage = averageFromPercents(
    gradedEntries.map((entry) => entryToPercent(entry, unitAssessmentLookup))
  );
  const averageColor = performanceColor(unitAverage);
  const [showAddAssessmentDialog, setShowAddAssessmentDialog] = useState(false);
  const [showDeleteAssessmentAlert, setShowDeleteAssessmentAlert] = useState(false);
  const [showCopyCriteriaFlow, setShowCopyCriteriaFlow] = useState(false);
  const [copyStep, setCopyStep] = useState("subject");
  const [copySourceSubjectId, setCopySourceSubjectId] = useState("");
  const [copySourceUnitId, setCopySourceUnitId] = useState("");
  const [assessmentToDelete, setAssessmentToDelete] = useState(null);
  const [newAssessment, setNewAssessment] = useState({
    title: "",
    assessmentDate: "",
    maxScore: "",
  });
  const [dragAssessmentId, setDragAssessmentId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onAssessmentHandlePointerDown,
    onHandlePointerMove: onAssessmentHandlePointerMove,
    onHandlePointerUp: onAssessmentHandlePointerUp,
    isDragAllowed: isAssessmentDragAllowed,
    resetHandleDrag: resetAssessmentHandleDrag,
  } = useHandleDrag(isReorderEnabled);
  const draggedAssessmentId = dragAssessmentId;
  const assessmentHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;
  const subjectsInClass = subject?.class_id
    ? subjects
        .filter((item) => item.class_id === subject.class_id)
        .sort((a, b) => (a.name || "").localeCompare(b.name || ""))
    : [];
  const sourceUnits = copySourceSubjectId
    ? units
        .filter((item) => item.subject_id === copySourceSubjectId && item.id !== unitId)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    : [];
  const sourceAssessments = copySourceUnitId
    ? assessments
        .filter((item) => item.unit_id === copySourceUnitId)
        .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    : [];

  if (!unit) {
    return (
      <section className="panel">
        <h2>Unit not found</h2>
        <p className="muted">Select a unit from a subject.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel unit-detail-header unit-hero">
        <p className="unit-hero-kicker">Unit Workspace</p>
        <h2>{unit.name}</h2>
        <p className="muted">
          {subject ? `Subject: ${subject.name}` : ""} {unit.description ? `• ${unit.description}` : "• No notes yet"}
        </p>
      </section>

      <section className="unit-stat-row">
        <article className="panel unit-stat-card">
          <p className="muted">Unit Average</p>
          <p style={{ color: averageColor }}>{unitAverage.toFixed(1)}%</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Assessments</p>
          <p style={{ color: "#8a5c34" }}>{unitAssessments.length}</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">Total Grades</p>
          <p style={{ color: "#9b6a3f" }}>{gradedEntries.length}</p>
        </article>
      </section>

      <section className="panel unit-actions-panel">
        <h3>Quick Actions</h3>
        <div className="unit-actions-grid">
          <NavLink to="/assessments" className="unit-action-card action-green">
            <strong>Gradebook</strong>
            <span>View all grades</span>
          </NavLink>
          <button
            type="button"
            className="unit-action-card action-amber"
            onClick={() => {
              setCopySourceSubjectId("");
              setCopySourceUnitId("");
              setCopyStep("subject");
              setShowCopyCriteriaFlow(true);
            }}
          >
            <strong>Copy Criteria</strong>
            <span>Import assessments from another unit</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="unit-assessment-title">
          <h3>Assessments</h3>
          <div className="unit-assessment-actions-row">
            {isMobileLayout && unitAssessments.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button
              type="button"
              onClick={() => {
                setNewAssessment({ title: "", assessmentDate: "", maxScore: "" });
                setShowAddAssessmentDialog(true);
              }}
            >
              + Add Assessment
            </button>
          </div>
        </div>
        <div className="unit-reorder-tip">Drag ⠿ to reorder assessments. On mobile, use Reorder Mode.</div>
        {unitAssessments.length === 0 ? (
          <div className="unit-empty">
            <h4>No assessments yet</h4>
            <p className="muted">Create your first assessment or copy criteria from another unit.</p>
            <button
              type="button"
              onClick={() => {
                setNewAssessment({ title: "", assessmentDate: "", maxScore: "" });
                setShowAddAssessmentDialog(true);
              }}
            >
              Create First Assessment
            </button>
          </div>
        ) : (
          <div className="unit-assessment-grid">
            {unitAssessments.map((item) => (
              <article
                key={item.id}
                className="unit-assessment-card draggable"
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled}
                onClick={() => navigate(`/assessments/${item.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/assessments/${item.id}`);
                  }
                }}
                onDragStart={(event) => {
                  if (!isAssessmentDragAllowed(item.id)) {
                    event.preventDefault();
                    return;
                  }
                  setDragAssessmentId(item.id);
                }}
                onDragEnd={() => {
                  setDragAssessmentId(null);
                  resetAssessmentHandleDrag();
                }}
                onDragOver={(event) => {
                  if (!isReorderEnabled) return;
                  event.preventDefault();
                }}
                onDrop={() =>
                  handleSwapSortOrder("assessments", unitAssessments, draggedAssessmentId, item.id)
                }
              >
                <div className="unit-assessment-main">
                  <p className="unit-assessment-kicker">Assessment</p>
                  <div className="unit-assessment-name">{item.title}</div>
                  <p className="muted">
                    {item.assessment_date || "No date"} {item.max_score ? `• ${item.max_score} pts` : ""}
                  </p>
                </div>
                <div className="unit-assessment-actions">
                  <button
                    type="button"
                    className={assessmentHandleClassName}
                    aria-label={`Drag ${item.title}`}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => onAssessmentHandlePointerDown(item.id, event)}
                    onPointerMove={onAssessmentHandlePointerMove}
                    onPointerUp={onAssessmentHandlePointerUp}
                    onPointerCancel={onAssessmentHandlePointerUp}
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete assessment"
                    onClick={(event) => {
                      event.stopPropagation();
                      setAssessmentToDelete(item);
                      setShowDeleteAssessmentAlert(true);
                    }}
                  >
                    🗑
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {showAddAssessmentDialog && (
        <div className="modal-overlay">
          <div className="modal-card assessment-add-modal">
            <div className="assessment-add-header">
              <p className="assessment-add-kicker">Assessments</p>
              <h3>Add New Assessment</h3>
              <p className="muted">Create a clear assessment so grading stays simple and organized.</p>
            </div>
            <form
              className="assessment-add-form"
              onSubmit={async (event) => {
                const ok = await handleCreateAssessmentForUnit(
                  event,
                  unitId,
                  subject?.id,
                  subject?.class_id,
                  newAssessment
                );
                if (ok) setShowAddAssessmentDialog(false);
              }}
            >
              <label className="stack">
                <span>Assessment Name</span>
                <input
                  name="title"
                  value={newAssessment.title}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder="e.g. Quiz 1, Chapter Test, Midterm Exam"
                  required
                />
              </label>
              <label className="stack">
                <span>Date</span>
                <input
                  name="assessmentDate"
                  type="date"
                  value={newAssessment.assessmentDate}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, assessmentDate: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>Max Score</span>
                <input
                  name="maxScore"
                  type="number"
                  min="0"
                  value={newAssessment.maxScore}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, maxScore: event.target.value }))
                  }
                />
              </label>
              {!!newAssessment.title.trim() && (
                <div className="subject-unit-preview">
                  <strong>Preview</strong>
                  <p>{newAssessment.title}</p>
                </div>
              )}
              <div className="modal-actions assessment-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddAssessmentDialog(false)}>
                  Cancel
                </button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {showDeleteAssessmentAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete Assessment?</h3>
            <p className="muted">
              {assessmentToDelete
                ? `Are you sure you want to delete "${assessmentToDelete.title}"?`
                : ""}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setShowDeleteAssessmentAlert(false);
                  setAssessmentToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (assessmentToDelete?.id) {
                    await handleDeleteAssessment(assessmentToDelete.id);
                  }
                  setShowDeleteAssessmentAlert(false);
                  setAssessmentToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
        )}

        {showCopyCriteriaFlow && (
          <div className="modal-overlay">
            <div className="modal-card copy-criteria-modal">
              {copyStep === "subject" && (
                <>
                  <h3>Copy Criteria: Choose Subject</h3>
                  <label className="stack">
                    <span>Subject</span>
                    <select
                      value={copySourceSubjectId}
                      onChange={(event) => {
                        setCopySourceSubjectId(event.target.value);
                        setCopySourceUnitId("");
                      }}
                    >
                      <option value="">Select subject</option>
                      {subjectsInClass.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-actions">
                    <button
                      type="button"
                      className="secondary"
                      onClick={() => setShowCopyCriteriaFlow(false)}
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceSubjectId}
                      onClick={() => setCopyStep("unit")}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {copyStep === "unit" && (
                <>
                  <h3>Copy Criteria: Choose Unit</h3>
                  <label className="stack">
                    <span>Unit</span>
                    <select
                      value={copySourceUnitId}
                      onChange={(event) => setCopySourceUnitId(event.target.value)}
                    >
                      <option value="">Select unit</option>
                      {sourceUnits.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("subject")}>
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceUnitId}
                      onClick={() => setCopyStep("confirm")}
                    >
                      Next
                    </button>
                  </div>
                </>
              )}

              {copyStep === "confirm" && (
                <>
                  <h3>Confirm Copy</h3>
                  <p className="muted">
                    Copy {sourceAssessments.length} assessment
                    {sourceAssessments.length === 1 ? "" : "s"} into this unit?
                  </p>
                  {sourceAssessments.length > 0 && (
                    <ul className="list">
                      {sourceAssessments.slice(0, 8).map((item) => (
                        <li key={item.id}>{item.title}</li>
                      ))}
                      {sourceAssessments.length > 8 && (
                        <li className="muted">+{sourceAssessments.length - 8} more</li>
                      )}
                    </ul>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("unit")}>
                      Back
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceUnitId}
                      onClick={async () => {
                        await handleCopyAssessmentsFromUnit(
                          copySourceUnitId,
                          unitId,
                          subject?.id,
                          subject?.class_id
                        );
                        setShowCopyCriteriaFlow(false);
                      }}
                    >
                      Copy
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
    </>
  );
}

export default UnitDetailPage;
