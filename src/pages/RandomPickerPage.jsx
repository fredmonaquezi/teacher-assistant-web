import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";

function RandomPickerPage({ formError, classOptions, students }) {
  const { t, i18n } = useTranslation();
  const [searchParams, setSearchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";
  const classLabel = classOptions.find((option) => option.id === classId)?.label;
  const filteredStudents = classId
    ? students.filter((student) => student.class_id === classId)
    : students;

  const defaultCategories = ["Helper", "Guardian", "Line Leader", "Messenger"];
  const categoryIcons = {
    Helper: "⭐",
    Guardian: "🛡️",
    "Line Leader": "🚶",
    Messenger: "✉️",
  };
  const categoryColors = {
    Helper: "#7c3aed",
    Guardian: "#2563eb",
    "Line Leader": "#16a34a",
    Messenger: "#f97316",
    Custom: "#ec4899",
  };

  const [selectedCategory, setSelectedCategory] = useState("Helper");
  const [customCategories, setCustomCategories] = useState([]);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showDeleteCategory, setShowDeleteCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [pickedStudent, setPickedStudent] = useState(null);
  const [isSpinning, setIsSpinning] = useState(false);
  const [isRotationMode, setIsRotationMode] = useState(false);
  const [rotationFeedback, setRotationFeedback] = useState("");

  const categoryDisplayLabel = (category) => {
    if (category === "Helper") return t("random.categories.helper");
    if (category === "Guardian") return t("random.categories.guardian");
    if (category === "Line Leader") return t("random.categories.lineLeader");
    if (category === "Messenger") return t("random.categories.messenger");
    return category;
  };

  const categoryRotationLabel = (category) => {
    if (i18n.language === "pt-BR" && category === "Helper") {
      return t("random.categories.helperRotation");
    }
    return categoryDisplayLabel(category);
  };

  const handleClassChange = (nextClassId) => {
    if (nextClassId) {
      setSearchParams({ classId: nextClassId });
      return;
    }
    setSearchParams({});
  };

    const categories = [...defaultCategories, ...customCategories];
    const isSelectedCategoryCustom = customCategories.includes(selectedCategory);

    const customCategoriesKey = classId
      ? `ta_random_custom_categories_${classId}`
      : "ta_random_custom_categories_global";

    const rotationKeyForCategory = (category) =>
      classId ? `ta_random_rotation_${classId}_${category}` : `ta_random_rotation_global_${category}`;

  useEffect(() => {
    const stored = localStorage.getItem(customCategoriesKey) || "";
    const next = stored.split("|").filter(Boolean);
    const timer = window.setTimeout(() => {
      setCustomCategories(next);
    }, 0);
    return () => window.clearTimeout(timer);
  }, [customCategoriesKey]);

    const saveCustomCategories = (next) => {
      setCustomCategories(next);
      localStorage.setItem(customCategoriesKey, next.join("|"));
    };

    const getRotationData = () => localStorage.getItem(rotationKeyForCategory(selectedCategory)) || "";

    const setRotationData = (value) => {
      localStorage.setItem(rotationKeyForCategory(selectedCategory), value);
    };

    const usedStudentIds = new Set(getRotationData().split(",").filter(Boolean));
    const availableStudents = filteredStudents.filter(
      (student) => !usedStudentIds.has(student.id)
    );
    const usedStudents = filteredStudents.filter((student) => usedStudentIds.has(student.id));

    const categoryColor = categoryColors[selectedCategory] || categoryColors.Custom;
    const categoryIcon = categoryIcons[selectedCategory] || "🏳️";

    const pickRandom = (list) => {
      if (!list.length) return;
      setIsSpinning(true);
      setTimeout(() => {
        setIsSpinning(false);
        setPickedStudent(list[Math.floor(Math.random() * list.length)]);
      }, 1000);
    };

    const handleQuickPick = () => {
      setIsRotationMode(false);
      pickRandom(filteredStudents);
    };

    const handleRotationPick = () => {
      setIsRotationMode(true);
      pickRandom(availableStudents);
    };

    const markUsed = () => {
      if (!pickedStudent) return;
      const next = new Set(usedStudentIds);
      next.add(pickedStudent.id);
      setRotationData(Array.from(next).join(","));
      setPickedStudent(null);
    };

    const clearUsed = () => {
      const clearedCount = usedStudentIds.size;
      setRotationData("");
      setRotationFeedback(
        clearedCount > 0
          ? t("random.feedback.resetCount", {
              count: clearedCount,
              role: categoryDisplayLabel(selectedCategory),
            })
          : t("random.feedback.alreadyClear", { role: categoryDisplayLabel(selectedCategory) })
      );
    };

    useEffect(() => {
      if (!rotationFeedback) return undefined;
      const timer = window.setTimeout(() => setRotationFeedback(""), 2200);
      return () => window.clearTimeout(timer);
    }, [rotationFeedback]);

    const addCustomCategory = () => {
      const cleaned = newCategoryName.trim();
      if (!cleaned) return;
      if (categories.includes(cleaned)) return;
      const next = [...customCategories, cleaned];
      saveCustomCategories(next);
      setSelectedCategory(cleaned);
      setNewCategoryName("");
      setShowAddCategory(false);
    };

    const requestDeleteCategory = (category) => {
      setSelectedCategory(category);
      setShowDeleteCategory(true);
    };

    const deleteCustomCategory = () => {
      if (!isSelectedCategoryCustom) return;
      const categoryToDelete = selectedCategory;
      const next = customCategories.filter((category) => category !== categoryToDelete);
      saveCustomCategories(next);
      localStorage.removeItem(rotationKeyForCategory(categoryToDelete));
      setSelectedCategory("Helper");
      setShowDeleteCategory(false);
    };

    return (
      <>
        {formError && <div className="error">{formError}</div>}
        <section className="panel random-page">
          <div className="random-page-header">
            <div className="random-page-heading">
              <span className="random-page-kicker">{t("random.kicker")}</span>
              <h2>{t("random.title")}</h2>
            </div>
            <span className="random-scope-chip">
              {classId ? classLabel || t("random.selectedClass") : t("random.allClasses")}
            </span>
          </div>
          <label className="stack">
            <span>{t("random.class")}</span>
            <select value={classId} onChange={(event) => handleClassChange(event.target.value)}>
              <option value="">{t("random.allClasses")}</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          {!classId && (
            <div className="muted">
              {t("random.rotationTrackedAllClasses")}
            </div>
          )}

          <button
            type="button"
            className="random-quick-card"
            onClick={handleQuickPick}
            disabled={!filteredStudents.length}
          >
            <div className="random-quick-icon">🎲</div>
            <div className="random-quick-copy">
              <div className="random-quick-title">{t("random.quick.title")}</div>
              <div className="random-quick-subtitle">{t("random.quick.subtitle")}</div>
              <div className="random-quick-note">{t("random.quick.note")}</div>
            </div>
          </button>

          <div className="random-section">
            <div className="random-section-header">
              <h3>{t("random.rotation.title")}</h3>
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
                >
                  {t("random.rotation.addCustom")}
                </button>
              </div>
            </div>
            <div className="random-category-row">
              {categories.map((category) => {
                const isSelected = selectedCategory === category;
                const color = categoryColors[category] || categoryColors.Custom;
                const icon = categoryIcons[category] || "🏳️";
                const isCustom = customCategories.includes(category);
                return (
                  <div key={category} className="random-category-chip-wrap">
                    <button
                      type="button"
                      className={`random-category-chip ${isSelected ? "selected" : ""}`}
                      style={isSelected ? { borderColor: color, background: `${color}22` } : {}}
                      onClick={() => setSelectedCategory(category)}
                    >
                      <span className="random-chip-icon">{icon}</span>
                      <span>{categoryDisplayLabel(category)}</span>
                      {isSelected && (
                        <span className="muted">{t("random.rotation.leftCount", { count: availableStudents.length })}</span>
                      )}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="random-chip-delete"
                        aria-label={t("random.rotation.deleteRoleAria", { role: categoryDisplayLabel(category) })}
                        onClick={() => requestDeleteCategory(category)}
                      >
                        🗑
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
                  <strong>{t("random.rotation.roleRotation", { role: categoryRotationLabel(selectedCategory) })}</strong>
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

            <div className="random-spinner" style={{ borderColor: categoryColor }}>
              <div className={`random-spinner-icon ${isSpinning ? "spin" : ""}`}>
                {categoryIcon}
              </div>
            </div>

            {availableStudents.length === 0 && filteredStudents.length > 0 ? (
              <div className="random-reset">
                <div className="random-reset-title">
                  {t("random.rotation.everyoneUsed", { role: categoryDisplayLabel(selectedCategory).toLowerCase() })}
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
                {t("random.rotation.pickNext", { role: categoryDisplayLabel(selectedCategory) })}
              </button>
            )}

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
                    <div className="random-list-title">{t("random.lists.alreadyUsedCount", { count: usedStudents.length })}</div>
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
                <button type="button" className="link" onClick={() => setShowAddCategory(false)}>
                  {t("common.actions.cancel")}
                </button>
                <button type="button" onClick={addCustomCategory} disabled={!newCategoryName.trim()}>
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
                <button type="button" className="link" onClick={() => setShowDeleteCategory(false)}>
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
            <div className="modal-card random-result">
              <div className="random-result-icon-wrap">
                <div className="random-result-icon">{isRotationMode ? categoryIcon : "🔀"}</div>
              </div>
              <div className="random-result-kicker">
                {isRotationMode
                  ? t("random.result.todaysRole", { role: categoryDisplayLabel(selectedCategory) })
                  : t("random.result.randomPick")}
              </div>
              <h2 className="random-result-name">
                {pickedStudent.first_name} {pickedStudent.last_name}
              </h2>
              <div className="random-result-emoji">🎉</div>
              <div className="modal-actions random-result-actions">
                {isRotationMode ? (
                  <>
                    <button type="button" onClick={markUsed} style={{ background: categoryColor }}>
                      {t("random.result.markUsed")}
                    </button>
                    <button type="button" className="link" onClick={() => setPickedStudent(null)}>
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
