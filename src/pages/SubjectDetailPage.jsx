import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate, useParams } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";
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
  const { t } = useTranslation();
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
  const isMobileReorderActive = isMobileLayout && isReorderMode;
  const {
    onHandlePointerDown: onUnitHandlePointerDown,
    onHandlePointerMove: onUnitHandlePointerMove,
    onHandlePointerUp: onUnitHandlePointerUp,
    isDragAllowed: isUnitDragAllowed,
    resetHandleDrag: resetUnitHandleDrag,
  } = useHandleDrag(isReorderEnabled && !isMobileLayout);
  const draggedUnitId = dragUnitId;
  const unitHandleClassName = `drag-handle${isReorderEnabled && !isMobileLayout ? "" : " disabled"}`;

  if (!subject) {
    return (
      <section className="panel">
        <h2>{t("subjectDetail.notFoundTitle")}</h2>
        <p className="muted">{t("subjectDetail.notFoundDescription")}</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel subject-detail-header">
        <h2>{subject.name}</h2>
        <p className="muted">{subject.description || t("subjectDetail.noDescription")}</p>
      </section>

      <section className="subject-stat-row">
        <article className="panel subject-stat-card">
          <p className="muted">{t("subjectDetail.stats.subjectAverage")}</p>
          <p style={{ color: averageColor }}>{subjectAverage.toFixed(1)}%</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">{t("subjectDetail.stats.totalUnits")}</p>
          <p style={{ color: "#2563eb" }}>{subjectUnits.length}</p>
        </article>
        <article className="panel subject-stat-card">
          <p className="muted">{t("subjectDetail.stats.totalAssessments")}</p>
          <p style={{ color: "#7c3aed" }}>{subjectAssessments.length}</p>
        </article>
      </section>

      <section className="panel">
        <div className="subject-units-title">
          <h3>{t("subjectDetail.unitsTitle")}</h3>
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
              {t("subjectDetail.addUnit")}
            </button>
          </div>
        </div>
        {subjectUnits.length === 0 ? (
          <div className="subject-empty">
            <h4>{t("subjectDetail.emptyTitle")}</h4>
            <p className="muted">{t("subjectDetail.emptyDescription")}</p>
            <button
              type="button"
              onClick={() => {
                setUnitForm((prev) => ({ ...prev, name: "", description: "" }));
                setShowAddUnitDialog(true);
              }}
            >
              {t("subjectDetail.createFirstUnit")}
            </button>
          </div>
        ) : (
          <div className="subject-units-grid">
            {subjectUnits.map((unit, index) => {
              const previousUnit = index > 0 ? subjectUnits[index - 1] : null;
              const nextUnit = index < subjectUnits.length - 1 ? subjectUnits[index + 1] : null;
              return (
              <article
                key={unit.id}
                className={`subject-unit-card draggable${isMobileReorderActive ? " mobile-reorder-active" : ""}`}
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled && !isMobileLayout}
                onClick={() => {
                  if (isMobileReorderActive) return;
                  navigate(`/units/${unit.id}`);
                }}
                onKeyDown={(event) => {
                  if (isMobileReorderActive) return;
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
                  if (!isReorderEnabled || isMobileLayout) return;
                  event.preventDefault();
                }}
                onDrop={() => handleSwapSortOrder("units", subjectUnits, draggedUnitId, unit.id)}
              >
                <div className="subject-unit-main">
                  <p className="subject-unit-kicker">{t("subjectDetail.unitKicker")}</p>
                  <div className="subject-unit-name">{unit.name}</div>
                  <p className="muted">{unit.description || t("subjectDetail.noDescription")}</p>
                </div>
                <div className="subject-unit-actions">
                  {isMobileReorderActive && (
                    <div className="reorder-mobile-controls">
                      <button
                        type="button"
                        className="reorder-mobile-btn"
                        aria-label={t("subjectDetail.aria.moveUp", { name: unit.name })}
                        disabled={!previousUnit}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!previousUnit) return;
                          handleSwapSortOrder("units", subjectUnits, unit.id, previousUnit.id);
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="reorder-mobile-btn"
                        aria-label={t("subjectDetail.aria.moveDown", { name: unit.name })}
                        disabled={!nextUnit}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!nextUnit) return;
                          handleSwapSortOrder("units", subjectUnits, unit.id, nextUnit.id);
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  {!isMobileLayout && (
                    <button
                      type="button"
                      className={unitHandleClassName}
                      aria-label={t("subjectDetail.aria.drag", { name: unit.name })}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => onUnitHandlePointerDown(unit.id, event)}
                      onPointerMove={onUnitHandlePointerMove}
                      onPointerUp={onUnitHandlePointerUp}
                      onPointerCancel={onUnitHandlePointerUp}
                    >
                      ⠿
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("subjectDetail.aria.deleteUnit")}
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
            );
            })}
          </div>
        )}
      </section>

      {showAddUnitDialog && (
        <div className="modal-overlay">
          <div className="modal-card unit-add-modal">
            <div className="unit-add-header">
              <p className="unit-add-kicker">{t("subjectDetail.unitsTitle")}</p>
              <h3>{t("subjectDetail.modal.addTitle")}</h3>
              <p className="muted">{t("subjectDetail.modal.addDescription")}</p>
            </div>
            <form
              className="unit-add-form"
              onSubmit={async (event) => {
                await handleCreateUnit(event, subjectId);
                setShowAddUnitDialog(false);
              }}
            >
              <label className="stack">
                <span>{t("subjectDetail.modal.unitName")}</span>
                <input
                  value={unitForm.name}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, name: event.target.value }))}
                  placeholder={t("subjectDetail.modal.unitNamePlaceholder")}
                  required
                />
              </label>
              <label className="stack">
                <span>{t("subjectDetail.modal.description")}</span>
                <input
                  value={unitForm.description}
                  onChange={(event) => setUnitForm((prev) => ({ ...prev, description: event.target.value }))}
                  placeholder={t("subjectDetail.modal.descriptionPlaceholder")}
                />
              </label>
              {!!unitForm.name.trim() && (
                <div className="subject-unit-preview">
                  <strong>{t("subjectDetail.modal.preview")}</strong>
                  <p>{unitForm.name}</p>
                </div>
              )}
              <div className="modal-actions unit-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddUnitDialog(false)}>
                  {t("common.actions.cancel")}
                </button>
                <button type="submit">{t("common.actions.add")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={showDeleteUnitAlert}
        title={t("subjectDetail.delete.title")}
        description={unitToDelete ? t("subjectDetail.delete.description", { name: unitToDelete.name }) : ""}
        onCancel={() => {
          setShowDeleteUnitAlert(false);
          setUnitToDelete(null);
        }}
        onConfirm={async () => {
          if (unitToDelete?.id) {
            await handleDeleteUnit(unitToDelete.id);
          }
          setShowDeleteUnitAlert(false);
          setUnitToDelete(null);
        }}
      />
    </>
  );
}

export default SubjectDetailPage;
