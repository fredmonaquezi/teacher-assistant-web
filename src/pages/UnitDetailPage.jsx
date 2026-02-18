import { useState } from "react";
import { useTranslation } from "react-i18next";
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
  const { t } = useTranslation();
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
  const isMobileReorderActive = isMobileLayout && isReorderMode;
  const {
    onHandlePointerDown: onAssessmentHandlePointerDown,
    onHandlePointerMove: onAssessmentHandlePointerMove,
    onHandlePointerUp: onAssessmentHandlePointerUp,
    isDragAllowed: isAssessmentDragAllowed,
    resetHandleDrag: resetAssessmentHandleDrag,
  } = useHandleDrag(isReorderEnabled && !isMobileLayout);
  const draggedAssessmentId = dragAssessmentId;
  const assessmentHandleClassName = `drag-handle${isReorderEnabled && !isMobileLayout ? "" : " disabled"}`;
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
        <h2>{t("unitDetail.notFoundTitle")}</h2>
        <p className="muted">{t("unitDetail.notFoundDescription")}</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel unit-detail-header unit-hero">
        <p className="unit-hero-kicker">{t("unitDetail.kicker")}</p>
        <h2>{unit.name}</h2>
        <p className="muted">
          {subject ? t("unitDetail.subjectLabel", { subjectName: subject.name }) : ""}{" "}
          {unit.description ? `• ${unit.description}` : `• ${t("unitDetail.noNotesYet")}`}
        </p>
      </section>

      <section className="unit-stat-row">
        <article className="panel unit-stat-card">
          <p className="muted">{t("unitDetail.stats.unitAverage")}</p>
          <p style={{ color: averageColor }}>{unitAverage.toFixed(1)}%</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">{t("unitDetail.stats.assessments")}</p>
          <p style={{ color: "#8a5c34" }}>{unitAssessments.length}</p>
        </article>
        <article className="panel unit-stat-card">
          <p className="muted">{t("unitDetail.stats.totalGrades")}</p>
          <p style={{ color: "#9b6a3f" }}>{gradedEntries.length}</p>
        </article>
      </section>

      <section className="panel unit-actions-panel">
        <h3>{t("unitDetail.quickActions.title")}</h3>
        <div className="unit-actions-grid">
          <NavLink to="/assessments" className="unit-action-card action-green">
            <strong>{t("unitDetail.quickActions.gradebook")}</strong>
            <span>{t("unitDetail.quickActions.viewAllGrades")}</span>
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
            <strong>{t("unitDetail.quickActions.copyCriteria")}</strong>
            <span>{t("unitDetail.quickActions.importAssessments")}</span>
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="unit-assessment-title">
          <h3>{t("unitDetail.assessmentsTitle")}</h3>
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
              {t("unitDetail.addAssessment")}
            </button>
          </div>
        </div>
        <div className="unit-reorder-tip">{t("unitDetail.reorderTip")}</div>
        {unitAssessments.length === 0 ? (
          <div className="unit-empty">
            <h4>{t("unitDetail.emptyTitle")}</h4>
            <p className="muted">{t("unitDetail.emptyDescription")}</p>
            <button
              type="button"
              onClick={() => {
                setNewAssessment({ title: "", assessmentDate: "", maxScore: "" });
                setShowAddAssessmentDialog(true);
              }}
            >
              {t("unitDetail.createFirstAssessment")}
            </button>
          </div>
        ) : (
          <div className="unit-assessment-grid">
            {unitAssessments.map((item, index) => {
              const previousAssessment = index > 0 ? unitAssessments[index - 1] : null;
              const nextAssessment = index < unitAssessments.length - 1 ? unitAssessments[index + 1] : null;
              return (
              <article
                key={item.id}
                className={`unit-assessment-card draggable${isMobileReorderActive ? " mobile-reorder-active" : ""}`}
                role="button"
                tabIndex={0}
                draggable={isReorderEnabled && !isMobileLayout}
                onClick={() => {
                  if (isMobileReorderActive) return;
                  navigate(`/assessments/${item.id}`);
                }}
                onKeyDown={(event) => {
                  if (isMobileReorderActive) return;
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
                  if (!isReorderEnabled || isMobileLayout) return;
                  event.preventDefault();
                }}
                onDrop={() =>
                  handleSwapSortOrder("assessments", unitAssessments, draggedAssessmentId, item.id)
                }
                >
                <div className="unit-assessment-main">
                  <p className="unit-assessment-kicker">{t("unitDetail.assessmentKicker")}</p>
                  <div className="unit-assessment-name">{item.title}</div>
                  <p className="muted">
                    {item.assessment_date || t("unitDetail.noDate")} {item.max_score ? `• ${item.max_score} ${t("unitDetail.points")}` : ""}
                  </p>
                </div>
                <div className="unit-assessment-actions">
                  {isMobileReorderActive && (
                    <div className="reorder-mobile-controls">
                      <button
                        type="button"
                        className="reorder-mobile-btn"
                        aria-label={t("unitDetail.aria.moveUp", { title: item.title })}
                        disabled={!previousAssessment}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!previousAssessment) return;
                          handleSwapSortOrder(
                            "assessments",
                            unitAssessments,
                            item.id,
                            previousAssessment.id
                          );
                        }}
                      >
                        ↑
                      </button>
                      <button
                        type="button"
                        className="reorder-mobile-btn"
                        aria-label={t("unitDetail.aria.moveDown", { title: item.title })}
                        disabled={!nextAssessment}
                        onClick={(event) => {
                          event.stopPropagation();
                          if (!nextAssessment) return;
                          handleSwapSortOrder(
                            "assessments",
                            unitAssessments,
                            item.id,
                            nextAssessment.id
                          );
                        }}
                      >
                        ↓
                      </button>
                    </div>
                  )}
                  {!isMobileLayout && (
                    <button
                      type="button"
                      className={assessmentHandleClassName}
                      aria-label={t("unitDetail.aria.drag", { title: item.title })}
                      onClick={(event) => event.stopPropagation()}
                      onPointerDown={(event) => onAssessmentHandlePointerDown(item.id, event)}
                      onPointerMove={onAssessmentHandlePointerMove}
                      onPointerUp={onAssessmentHandlePointerUp}
                      onPointerCancel={onAssessmentHandlePointerUp}
                    >
                      ⠿
                    </button>
                  )}
                  <button
                    type="button"
                    className="icon-button"
                    aria-label={t("unitDetail.aria.deleteAssessment")}
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
            );
            })}
          </div>
        )}
      </section>

      {showAddAssessmentDialog && (
        <div className="modal-overlay">
          <div className="modal-card assessment-add-modal">
            <div className="assessment-add-header">
              <p className="assessment-add-kicker">{t("unitDetail.assessmentsTitle")}</p>
              <h3>{t("unitDetail.modal.addTitle")}</h3>
              <p className="muted">{t("unitDetail.modal.addDescription")}</p>
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
                <span>{t("unitDetail.modal.assessmentName")}</span>
                <input
                  name="title"
                  value={newAssessment.title}
                  onChange={(event) =>
                    setNewAssessment((prev) => ({ ...prev, title: event.target.value }))
                  }
                  placeholder={t("unitDetail.modal.assessmentNamePlaceholder")}
                  required
                />
              </label>
              <label className="stack">
                <span>{t("unitDetail.modal.date")}</span>
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
                <span>{t("unitDetail.modal.maxScore")}</span>
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
                  <strong>{t("unitDetail.modal.preview")}</strong>
                  <p>{newAssessment.title}</p>
                </div>
              )}
              <div className="modal-actions assessment-add-actions">
                <button type="button" className="secondary" onClick={() => setShowAddAssessmentDialog(false)}>
                  {t("common.actions.cancel")}
                </button>
                <button type="submit">{t("common.actions.add")}</button>
              </div>
            </form>
          </div>
        </div>
      )}

        {showDeleteAssessmentAlert && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t("unitDetail.deleteAssessment.title")}</h3>
            <p className="muted">
              {assessmentToDelete
                ? t("unitDetail.deleteAssessment.description", { title: assessmentToDelete.title })
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
                {t("common.actions.cancel")}
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
                {t("common.actions.delete")}
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
                  <h3>{t("unitDetail.copy.subjectStepTitle")}</h3>
                  <label className="stack">
                    <span>{t("unitDetail.copy.subject")}</span>
                    <select
                      value={copySourceSubjectId}
                      onChange={(event) => {
                        setCopySourceSubjectId(event.target.value);
                        setCopySourceUnitId("");
                      }}
                    >
                      <option value="">{t("unitDetail.copy.selectSubject")}</option>
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
                      {t("common.actions.cancel")}
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceSubjectId}
                      onClick={() => setCopyStep("unit")}
                    >
                      {t("common.actions.next")}
                    </button>
                  </div>
                </>
              )}

              {copyStep === "unit" && (
                <>
                  <h3>{t("unitDetail.copy.unitStepTitle")}</h3>
                  <label className="stack">
                    <span>{t("unitDetail.copy.unit")}</span>
                    <select
                      value={copySourceUnitId}
                      onChange={(event) => setCopySourceUnitId(event.target.value)}
                    >
                      <option value="">{t("unitDetail.copy.selectUnit")}</option>
                      {sourceUnits.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("subject")}>
                      {t("common.actions.back")}
                    </button>
                    <button
                      type="button"
                      disabled={!copySourceUnitId}
                      onClick={() => setCopyStep("confirm")}
                    >
                      {t("common.actions.next")}
                    </button>
                  </div>
                </>
              )}

              {copyStep === "confirm" && (
                <>
                  <h3>{t("unitDetail.copy.confirmTitle")}</h3>
                  <p className="muted">
                    {t("unitDetail.copy.confirmDescription", { count: sourceAssessments.length })}
                  </p>
                  {sourceAssessments.length > 0 && (
                    <ul className="list">
                      {sourceAssessments.slice(0, 8).map((item) => (
                        <li key={item.id}>{item.title}</li>
                      ))}
                      {sourceAssessments.length > 8 && (
                        <li className="muted">{t("unitDetail.copy.moreCount", { count: sourceAssessments.length - 8 })}</li>
                      )}
                    </ul>
                  )}
                  <div className="modal-actions">
                    <button type="button" className="secondary" onClick={() => setCopyStep("unit")}>
                      {t("common.actions.back")}
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
                      {t("unitDetail.copy.copy")}
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
