import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";
import ReorderModeToggle from "../components/common/ReorderModeToggle";
import { useHandleDrag } from "../hooks/useHandleDrag";
import { useReorderMode } from "../hooks/useReorderMode";

function ClassesPage({
  formError,
  classForm,
  setClassForm,
  handleCreateClass,
  handleDeleteClass,
  handleSwapSortOrder,
  classes,
  students,
  subjects,
  loading,
}) {
  const { t } = useTranslation();
  const [showAddClass, setShowAddClass] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [dragClassId, setDragClassId] = useState(null);
  const navigate = useNavigate();
  const { isMobileLayout, isReorderMode, setIsReorderMode, isReorderEnabled } = useReorderMode();
  const isMobileReorderActive = isMobileLayout && isReorderMode;
  const {
    onHandlePointerDown: onClassHandlePointerDown,
    onHandlePointerMove: onClassHandlePointerMove,
    onHandlePointerUp: onClassHandlePointerUp,
    isDragAllowed: isClassDragAllowed,
    resetHandleDrag: resetClassHandleDrag,
  } = useHandleDrag(isReorderEnabled && !isMobileLayout);

  const classHandleClassName = `drag-handle${isReorderEnabled && !isMobileLayout ? "" : " disabled"}`;
  const classCount = classes.length;
  const classCountLabel = t("classes.count.class", { count: classCount });
  const studentCountLabel = t("classes.count.student", { count: students.length });
  const subjectCountLabel = t("classes.count.subject", { count: subjects.length });
  const classSummaryLabel = loading
    ? t("classes.summary.loading")
    : t("classes.summary.loaded", {
        classCountLabel,
        studentCountLabel,
        subjectCountLabel,
      });

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel classes-page">
        <div className="classes-header">
          <div className="classes-header-copy">
            <h2>{t("classes.title")}</h2>
            <p>{classSummaryLabel}</p>
          </div>
          <div className="classes-header-actions">
            {isMobileLayout && classes.length > 1 && (
              <ReorderModeToggle isReorderMode={isReorderMode} setIsReorderMode={setIsReorderMode} />
            )}
            <button type="button" className="classes-add-btn" onClick={() => setShowAddClass(true)}>
              {t("classes.addClass")}
            </button>
          </div>
        </div>

        {loading ? (
          <p className="muted">{t("classes.loadingClasses")}</p>
        ) : (
          <div className="class-card-grid">
            {classes.map((item, index) => {
              const studentCount = students.filter((s) => s.class_id === item.id).length;
              const subjectCount = subjects.filter((s) => s.class_id === item.id).length;
              const previousClass = index > 0 ? classes[index - 1] : null;
              const nextClass = index < classes.length - 1 ? classes[index + 1] : null;
              return (
                <div
                  key={item.id}
                  className="class-card draggable"
                  role="button"
                  tabIndex={0}
                  draggable={isReorderEnabled && !isMobileLayout}
                  onClick={() => {
                    if (isMobileReorderActive) return;
                    navigate(`/classes/${item.id}`);
                  }}
                  onKeyDown={(event) => {
                    if (isMobileReorderActive) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      navigate(`/classes/${item.id}`);
                    }
                  }}
                  onDragStart={(event) => {
                    if (!isClassDragAllowed(item.id)) {
                      event.preventDefault();
                      return;
                    }
                    setDragClassId(item.id);
                  }}
                  onDragEnd={() => {
                    setDragClassId(null);
                    resetClassHandleDrag();
                  }}
                  onDragOver={(event) => {
                    if (!isReorderEnabled || isMobileLayout) return;
                    event.preventDefault();
                  }}
                  onDrop={() => handleSwapSortOrder("classes", classes, dragClassId, item.id)}
                >
                  <div className="class-card-head">
                    <div className="class-card-main">
                      <div className="class-card-title">{item.name}</div>
                      <div className="class-card-subtitle">
                        {item.grade_level || "—"}
                        {item.school_year ? ` • ${item.school_year}` : ""}
                      </div>
                    </div>
                    <div className="class-card-actions">
                      {isMobileReorderActive && (
                        <div className="reorder-mobile-controls">
                          <button
                            type="button"
                            className="reorder-mobile-btn"
                            aria-label={t("classes.aria.moveUp", { name: item.name })}
                            disabled={!previousClass}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!previousClass) return;
                              handleSwapSortOrder("classes", classes, item.id, previousClass.id);
                            }}
                          >
                            ↑
                          </button>
                          <button
                            type="button"
                            className="reorder-mobile-btn"
                            aria-label={t("classes.aria.moveDown", { name: item.name })}
                            disabled={!nextClass}
                            onClick={(event) => {
                              event.stopPropagation();
                              if (!nextClass) return;
                              handleSwapSortOrder("classes", classes, item.id, nextClass.id);
                            }}
                          >
                            ↓
                          </button>
                        </div>
                      )}
                      {!isMobileLayout && (
                        <button
                          type="button"
                          className={classHandleClassName}
                          aria-label={t("classes.aria.drag", { name: item.name })}
                          onClick={(event) => event.stopPropagation()}
                          onPointerDown={(event) => onClassHandlePointerDown(item.id, event)}
                          onPointerMove={onClassHandlePointerMove}
                          onPointerUp={onClassHandlePointerUp}
                          onPointerCancel={onClassHandlePointerUp}
                        >
                          ⠿
                        </button>
                      )}
                      <button
                        type="button"
                        className="icon-button"
                        onClick={(event) => {
                          event.stopPropagation();
                          setClassToDelete(item);
                        }}
                        aria-label={t("classes.aria.delete", { name: item.name })}
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                  <div className="class-card-meta">
                    <div className="class-card-stat">
                      <strong>{studentCount}</strong>
                      <span>{t("classes.students")}</span>
                    </div>
                    <div className="class-card-stat">
                      <strong>{subjectCount}</strong>
                      <span>{t("classes.subjects")}</span>
                    </div>
                  </div>
                </div>
              );
            })}
            {classes.length === 0 && <div className="muted">{t("classes.empty")}</div>}
          </div>
        )}
      </section>

      {showAddClass && (
        <div className="modal-overlay">
          <div className="modal-card">
            <h3>{t("classes.modal.title")}</h3>
            <label className="stack">
              <span>{t("classes.modal.className")}</span>
              <input
                value={classForm.name}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder={t("classes.modal.classNamePlaceholder")}
                required
              />
            </label>
            <label className="stack">
              <span>{t("classes.modal.gradeLevel")}</span>
              <input
                value={classForm.gradeLevel}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, gradeLevel: event.target.value }))
                }
                placeholder={t("classes.modal.gradeLevelPlaceholder")}
              />
            </label>
            <label className="stack">
              <span>{t("classes.modal.schoolYear")}</span>
              <input
                value={classForm.schoolYear}
                onChange={(event) =>
                  setClassForm((prev) => ({ ...prev, schoolYear: event.target.value }))
                }
                placeholder={t("classes.modal.schoolYearPlaceholder")}
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddClass(false)}>
                {t("common.actions.cancel")}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await handleCreateClass({ preventDefault: () => {} });
                  setShowAddClass(false);
                }}
              >
                {t("common.actions.add")}
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(classToDelete)}
        title={t("common.actions.delete")}
        description={
          classToDelete
            ? `Delete "${classToDelete.name}" and all related data?`
            : ""
        }
        onCancel={() => setClassToDelete(null)}
        onConfirm={async () => {
          if (!classToDelete?.id) return;
          await handleDeleteClass(classToDelete.id);
          setClassToDelete(null);
        }}
      />
    </>
  );
}

export default ClassesPage;
