import { useTranslation } from "react-i18next";
import TileIcon from "../components/navigation/TileIcon";
import { getCategoryColor, getCategoryIcon } from "../features/random-picker/randomPickerPageModel";
import useRandomPickerPageController from "../features/random-picker/useRandomPickerPageController";
import "../styles/random-picker.css";

function RandomPickerPage({
  formError,
  loading = false,
  classOptions,
  activeClassId = "",
  students,
  randomPickerCustomCategories = [],
  randomPickerRotationRows = [],
  handleCreateRandomPickerCustomCategory = async () => false,
  handleDeleteRandomPickerCustomCategory = async () => false,
  handleSetRandomPickerRotationUsedStudents = async () => false,
  handleImportLegacyRandomPickerState = async () => true,
}) {
  const { t, i18n } = useTranslation();
  const {
    classId, classLabel, filteredStudents, categories, customCategories, activeCategory,
    availableStudents, usedStudents, isSelectedCategoryCustom, categoryColor, categoryIcon,
    selectedCategory, setSelectedCategory, showAddCategory, setShowAddCategory,
    showDeleteCategory, setShowDeleteCategory, newCategoryName, setNewCategoryName,
    pickedStudent, setPickedStudent, isSpinning, isRotationMode, rotationFeedback,
    categoryDisplayLabel, categoryRotationLabel, handleQuickPick, handleRotationPick,
    markUsed, clearUsed, addCustomCategory, requestDeleteCategory, deleteCustomCategory,
  } = useRandomPickerPageController({
    t, language: i18n.language, loading, classOptions, activeClassId, students,
    randomPickerCustomCategories, randomPickerRotationRows,
    handleCreateRandomPickerCustomCategory, handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents, handleImportLegacyRandomPickerState,
  });

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel random-page polished-random-page">
        <div className="random-page-header">
          <div className="random-page-icon" aria-hidden="true"><TileIcon kind="random" /></div>
          <div className="random-page-heading">
            <span className="random-page-kicker">{t("random.kicker")}</span>
            <h2>{t("random.title")}</h2>
          </div>
          <span className="random-scope-chip">
            {classId ? classLabel || t("random.selectedClass") : t("layout.classSwitcher.placeholder")}
          </span>
        </div>
        {!classId && <div className="random-class-prompt muted">{t("layout.classSwitcher.pagePrompt")}</div>}

        <button
          type="button"
          className="random-quick-card"
          onClick={handleQuickPick}
          disabled={!filteredStudents.length}
        >
          <div className="random-quick-icon">
            <TileIcon kind="random" />
          </div>
          <div className="random-quick-copy">
            <div className="random-quick-title">{t("random.quick.title")}</div>
            <div className="random-quick-subtitle">{t("random.quick.subtitle")}</div>
            <div className="random-quick-note">{t("random.quick.note")}</div>
          </div>
          <span className="random-quick-cta">{t("random.quick.action")} <span aria-hidden="true">→</span></span>
        </button>

        <div className="random-section">
          <div className="random-section-header">
            <div>
              <h3>{t("random.rotation.title")}</h3>
              <p>{t("random.rotation.description")}</p>
            </div>
            <div className="random-section-actions">
              {isSelectedCategoryCustom && (
                <button type="button" className="link danger" onClick={() => setShowDeleteCategory(true)}>
                  {t("random.rotation.deleteCustom")}
                </button>
              )}
              <button
                type="button"
                className="secondary random-add-custom-btn"
                onClick={() => setShowAddCategory(true)}
                disabled={!classId}
              >
                {t("random.rotation.addCustom")}
              </button>
            </div>
          </div>
          <div className="random-category-row">
            {categories.map((category) => {
              const isSelected = activeCategory === category;
              const color = getCategoryColor(category);
              const icon = getCategoryIcon(category);
              const isCustom = customCategories.includes(category);
              return (
                <div key={category} className="random-category-chip-wrap">
                  <button
                    type="button"
                    className={`random-category-chip ${isSelected ? "selected" : ""}`}
                    style={isSelected ? { borderColor: color, background: `${color}12` } : {}}
                    onClick={() => setSelectedCategory(category)}
                  >
                    <span className="random-chip-icon">{icon}</span>
                    <span>{categoryDisplayLabel(category)}</span>
                    {isSelected && (
                      <span className="muted">
                        {t("random.rotation.leftCount", { count: availableStudents.length })}
                      </span>
                    )}
                  </button>
                  {isCustom && (
                    <button
                      type="button"
                      className="random-chip-delete"
                      aria-label={t("random.rotation.deleteRoleAria", { role: categoryDisplayLabel(category) })}
                      onClick={() => requestDeleteCategory(category)}
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="random-rotation-card" style={{ "--role-color": categoryColor }}>
          <div className="random-rotation-top">
            <div className="random-rotation-headline">
              <div className="random-rotation-header">
                <span className="random-rotation-icon">{categoryIcon}</span>
                <strong>{t("random.rotation.roleRotation", { role: categoryRotationLabel(activeCategory) })}</strong>
              </div>
            </div>
            {usedStudents.length > 0 && (
              <button type="button" className="random-clear" onClick={clearUsed}>
                {t("random.rotation.clearUsed")}
              </button>
            )}
          </div>
          {rotationFeedback && <div className="result random-feedback">{rotationFeedback}</div>}

          <div className="random-stats">
            <div className="stat-card green">
              <div className="stat-value">{availableStudents.length}</div>
              <div className="stat-label">{t("random.stats.available")}</div>
            </div>
            <div className="stat-card orange">
              <div className="stat-value">{usedStudents.length}</div>
              <div className="stat-label">{t("random.stats.used")}</div>
            </div>
            <div className="stat-card purple">
              <div className="stat-value">{filteredStudents.length}</div>
              <div className="stat-label">{t("random.stats.total")}</div>
            </div>
          </div>

          <div className="random-picker-action-row">
            <div className="random-spinner" style={{ borderColor: categoryColor }}>
              <div className={`random-spinner-icon ${isSpinning ? "spin" : ""}`}>{categoryIcon}</div>
            </div>
          {availableStudents.length === 0 && filteredStudents.length > 0 ? (
            <div className="random-reset">
              <div className="random-reset-title">
                {t("random.rotation.everyoneUsed", {
                  role: categoryDisplayLabel(activeCategory).toLowerCase(),
                })}
              </div>
              <button type="button" onClick={clearUsed} style={{ background: categoryColor }}>
                {t("random.rotation.resetStartOver")}
              </button>
            </div>
          ) : (
            <button
              type="button"
              className="random-pick-next"
              onClick={handleRotationPick}
              disabled={isSpinning || !filteredStudents.length}
              style={{ background: categoryColor }}
            >
              {t("random.rotation.pickNext", { role: categoryDisplayLabel(activeCategory) })}
            </button>
          )}
          </div>

          {(availableStudents.length > 0 || usedStudents.length > 0) && (
            <div className="random-lists">
              {availableStudents.length > 0 && (
                <div>
                  <div className="random-list-title">
                    {t("random.lists.availableCount", { count: availableStudents.length })}
                  </div>
                  <div className="random-pill-row">
                    {availableStudents.map((student) => (
                      <span key={student.id} className="random-pill green">
                        {student.first_name} {student.last_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {usedStudents.length > 0 && (
                <div>
                  <div className="random-list-title">
                    {t("random.lists.alreadyUsedCount", { count: usedStudents.length })}
                  </div>
                  <div className="random-pill-row">
                    {usedStudents.map((student) => (
                      <span key={student.id} className="random-pill gray">
                        {student.first_name} {student.last_name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal-card random-modal">
            <h3>{t("random.custom.addTitle")}</h3>
            <p className="muted">{t("random.custom.addSubtitle")}</p>
            <label className="stack">
              <span>{t("random.custom.roleName")}</span>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder={t("random.custom.roleNamePlaceholder")}
              />
            </label>
            {newCategoryName.trim() && (
              <div className="random-preview">
                <span>🏳️</span>
                <strong>{newCategoryName.trim()}</strong>
              </div>
            )}
            <div className="modal-actions">
              <button type="button" className="secondary random-cancel" onClick={() => setShowAddCategory(false)}>
                {t("common.actions.cancel")}
              </button>
              <button type="button" onClick={addCustomCategory} disabled={!classId || !newCategoryName.trim()}>
                {t("common.actions.create")}
              </button>
            </div>
          </div>
        </div>
      )}

      {showDeleteCategory && (
        <div className="modal-overlay">
          <div className="modal-card random-modal">
            <h3>{t("random.custom.deleteTitle")}</h3>
            <p className="muted">
              {t("random.custom.deleteDescription", { role: categoryDisplayLabel(selectedCategory) })}
            </p>
            <div className="modal-actions">
              <button type="button" className="secondary random-cancel" onClick={() => setShowDeleteCategory(false)}>
                {t("common.actions.cancel")}
              </button>
              <button type="button" className="danger" onClick={deleteCustomCategory}>
                {t("common.actions.delete")}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickedStudent && (
        <div className="modal-overlay">
          <div
            className="modal-card random-result"
            role="dialog"
            aria-labelledby="random-result-name"
            aria-describedby="random-result-kicker"
          >
            <div className="random-result-icon-wrap" aria-hidden="true">
              <div className="random-result-icon">{isRotationMode ? categoryIcon : "🔀"}</div>
            </div>
            <div className="random-result-kicker" id="random-result-kicker">
              {isRotationMode
                ? t("random.result.todaysRole", { role: categoryDisplayLabel(activeCategory) })
                : t("random.result.randomPick")}
            </div>
            <h2 className="random-result-name" id="random-result-name">
              {pickedStudent.first_name} {pickedStudent.last_name}
            </h2>
            <div className="random-result-emoji" aria-hidden="true">🎉</div>
            <div className="modal-actions random-result-actions">
              {isRotationMode ? (
                <>
                  <button type="button" onClick={markUsed}>
                    {t("random.result.markUsed")}
                  </button>
                  <button type="button" className="secondary" onClick={() => setPickedStudent(null)}>
                    {t("random.result.skipAbsent")}
                  </button>
                </>
              ) : (
                <button type="button" onClick={() => setPickedStudent(null)}>
                  {t("common.actions.done")}
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RandomPickerPage;
