import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import ReorderModeToggle from "../components/common/ReorderModeToggle";
import { useHandleDrag } from "../hooks/useHandleDrag";
import { useReorderMode } from "../hooks/useReorderMode";
import { averageFromPercents, entryToPercent, performanceColor } from "../utils/assessmentMetrics";

function SubjectDetailPage({
  formError,
  subjects,
  units,
  assessments,
  assessmentEntries,
  unitForm,
  setUnitForm,
  handleCreateUnit,
  handleSwapSortOrder,
  handleDeleteUnit,
}) {
  const navigate = useNavigate();
  const { subjectId } = useParams();
  const subject = subjects.find((item) => item.id === subjectId);
  const subjectUnits = units
    .filter((unit) => unit.subject_id === subjectId)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
        (a.created_at || "").localeCompare(b.created_at || "")
    );
  const subjectAssessments = assessments.filter((assessment) => assessment.subject_id === subjectId);
  const subjectAssessmentIds = new Set(subjectAssessments.map((assessment) => assessment.id));
  const subjectAssessmentLookup = new Map(subjectAssessments.map((assessment) => [assessment.id, assessment]));
  const subjectResults = assessmentEntries.filter(
    (entry) =>
      subjectAssessmentIds.has(entry.assessment_id) &&
      entry.score !== null &&
      Number.isFinite(Number(entry.score))
  );
  const subjectAverage = averageFromPercents(
    subjectResults.map((entry) => entryToPercent(entry, subjectAssessmentLookup))
  );
  const averageColor = performanceColor(subjectAverage);
  const [showAddUnitDialog, setShowAddUnitDialog] = useState(false);
  const [showDeleteUnitAlert, setShowDeleteUnitAlert] = useState(false);
  const [unitToDelete, setUnitToDelete] = useState(null);
  const [dragUnitId, setDragUnitId] = useState(null);
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const {
    onHandlePointerDown: onUnitHandlePointerDown,
    onHandlePointerMove: onUnitHandlePointerMove,
    onHandlePointerUp: onUnitHandlePointerUp,
    isDragAllowed: isUnitDragAllowed,
    resetHandleDrag: resetUnitHandleDrag,
  } = useHandleDrag(isReorderEnabled);
  const draggedUnitId = dragUnitId;
  const unitHandleClassName = `drag-handle${isReorderEnabled ? "" : " disabled"}`;

  if (!subject) {
    return (
      <section className="panel">
        <h2>Subject not found</h2>
        <p className="muted">Select a subject from a class.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel subject-detail-header">
        <h2>{subject.name}</h2>
        <p className="muted">{subject.description || "No description"}</p>
      </section>

      <section className="subject-stat-row">
        <article className="panel subject-stat-card">
          <p className="muted">Subject Average</p>
          <p style={{ color: averageColor }}>{subjectAverage.toFixed(1)}%</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">Total Units</p>
          <p style={{ color: "#2563eb" }}>{subjectUnits.length}</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">Total Assessments</p>
          <p style={{ color: "#7c3aed" }}>{subjectAssessments.length}</p>
        </article>
      </section>

      <section className="panel">
        <div className="subject-units-title">
          <h3>Units</h3>
          <div className="subject-units-actions">
            {isMobileLayout && subjectUnits.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button
              type="button"
              onClick={() => {
                setUnitForm((prev) => ({ ...prev, name: "", description: "" }));
                setShowAddUnitDialog(true);
              }}
            >
              + Add Unit
            </button>
          </div>
        </div>
        <div className="unit-reorder-tip">Drag ⠿ to reorder units. On mobile, use Reorder Mode.</div>
        {subjectUnits.length === 0 ? (
          <div className="subject-empty">
            <h4>No units yet</h4>
            <p className="muted">Create your first unit to start adding assessments.</p>
            <button
              type="button"
              onClick={() => {
                setUnitForm((prev) => ({ ...prev, name: "", description: "" }));
                setShowAddUnitDialog(true);
              }}
            >
              Create First Unit
            </button>
          </div>
        ) : (
          <div className="subject-units-grid">
            {subjectUnits.map((unit) => (
              <article
                key={unit.id}
                className="subject-unit-card draggable"
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled}
                onClick={() => navigate(`/units/${unit.id}`)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    navigate(`/units/${unit.id}`);
                  }
                }}
                onDragStart={(event) => {
                  if (!isUnitDragAllowed(unit.id)) {
                    event.preventDefault();
                    return;
                  }
                  setDragUnitId(unit.id);
                }}
                onDragEnd={() => {
                  setDragUnitId(null);
                  resetUnitHandleDrag();
                }}
                onDragOver={(event) => {
                  if (!isReorderEnabled) return;
                  event.preventDefault();
                }}
                onDrop={() => handleSwapSortOrder("units", subjectUnits, draggedUnitId, unit.id)}
              >
                <div className="subject-unit-main">
                  <p className="subject-unit-kicker">Unit</p>
                  <div className="subject-unit-name">{unit.name}</div>
                  <p className="muted">{unit.description || "No description"}</p>
                </div>
                <div className="subject-unit-actions">
                  <button
                    type="button"
                    className={unitHandleClassName}
                    aria-label={`Drag ${unit.name}`}
                    onClick={(event) => event.stopPropagation()}
                    onPointerDown={(event) => onUnitHandlePointerDown(unit.id, event)}
                    onPointerMove={onUnitHandlePointerMove}
                    onPointerUp={onUnitHandlePointerUp}
                    onPointerCancel={onUnitHandlePointerUp}
                  >
                    ⠿
                  </button>
                  <button
                    type="button"
                    className="icon-button"
                    aria-label="Delete unit"
                    onClick={(event) => {
                      event.stopPropagation();
                      setUnitToDelete(unit);
                      setShowDeleteUnitAlert(true);
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

      {showAddUnitDialog && (
        <div className="modal-overlay">
          <div className="modal-card unit-add-modal">
            <div className="unit-add-header">
              <p className="unit-add-kicker">Units</p>
              <h3>Add New Unit</h3>
              <p className="muted">Create a clear unit name so teachers can find it quickly.</p>
            </div>
            <form
              className="unit-add-form"
              onSubmit={async (event) => {
                await handleCreateUnit(event, subjectId);
                setShowAddUnitDialog(false);
              }}
            >
              <label className="stack">
                <span>Unit name</span>
                <input
                  value={unitForm.name}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder="e.g. Unit 1, Fractions, Ancient Rome"
                  required
                />
              </label>
              <label className="stack">
                <span>Description</span>
                <input
                  value={unitForm.description}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder="Optional notes"
                />
              </label>
              {!!unitForm.name.trim() && (
                <div className="subject-unit-preview">
                  <strong>Preview</strong>
                  <p>{unitForm.name}</p>
                </div>
              )}
              <div className="modal-actions unit-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddUnitDialog(false)}>
                  Cancel
                </button>
                <button type="submit">Add</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showDeleteUnitAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>Delete Unit?</h3>
            <p className="muted">
              {unitToDelete
                ? `Are you sure you want to delete "${unitToDelete.name}"? All assessments and grades inside this unit will be lost.`
                : ""}
            </p>
            <div className="modal-actions">
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setShowDeleteUnitAlert(false);
                  setUnitToDelete(null);
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                className="danger"
                onClick={async () => {
                  if (unitToDelete?.id) {
                    await handleDeleteUnit(unitToDelete.id);
                  }
                  setShowDeleteUnitAlert(false);
                  setUnitToDelete(null);
                }}
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SubjectDetailPage;
