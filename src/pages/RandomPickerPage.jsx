import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

function RandomPickerPage({ formError, classOptions, students }) {
  const [searchParams] = useSearchParams();
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
      setRotationData("");
    };

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
          <h2>Student Picker</h2>
          {classId && <div className="badge">Class: {classLabel || "Selected class"}</div>}
          {!classId && (
            <div className="muted">
              Tip: open from a class to keep rotation per class.
            </div>
          )}

          <button
            type="button"
            className="random-quick-card"
            onClick={handleQuickPick}
            disabled={!filteredStudents.length}
          >
            <div className="random-quick-icon">🔀</div>
            <div>
              <div className="random-quick-title">Quick Random Pick</div>
              <div className="muted">Tap here for instant random pick</div>
              <div className="random-quick-note">(any student, no rotation tracking)</div>
            </div>
          </button>

          <div className="random-section">
            <div className="random-section-header">
              <h3>Select Role</h3>
              <div className="random-section-actions">
                {isSelectedCategoryCustom && (
                  <button type="button" className="link danger" onClick={() => setShowDeleteCategory(true)}>
                    Delete Custom
                  </button>
                )}
                <button type="button" className="link" onClick={() => setShowAddCategory(true)}>
                  + Add Custom
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
                      <span>{category}</span>
                      {isSelected && (
                        <span className="muted">{availableStudents.length} left</span>
                      )}
                    </button>
                    {isCustom && (
                      <button
                        type="button"
                        className="random-chip-delete"
                        aria-label={`Delete ${category}`}
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

          <div className="random-rotation-card">
            <div className="random-rotation-header">
              <span className="random-rotation-icon">{categoryIcon}</span>
              <strong>{selectedCategory} Rotation</strong>
            </div>
            <div className="muted">Fair rotation - everyone gets a turn!</div>

            <div className="random-stats">
              <div className="stat-card green">
                <div className="stat-value">{availableStudents.length}</div>
                <div className="stat-label">Available</div>
              </div>
              <div className="stat-card orange">
                <div className="stat-value">{usedStudents.length}</div>
                <div className="stat-label">Used</div>
              </div>
              <div className="stat-card purple">
                <div className="stat-value">{filteredStudents.length}</div>
                <div className="stat-label">Total</div>
              </div>
            </div>

            {usedStudents.length > 0 && (
              <button type="button" className="random-clear" onClick={clearUsed}>
                Clear used students
              </button>
            )}

            <div className="random-spinner" style={{ borderColor: categoryColor }}>
              <div className={`random-spinner-icon ${isSpinning ? "spin" : ""}`}>
                {categoryIcon}
              </div>
            </div>

            {availableStudents.length === 0 && filteredStudents.length > 0 ? (
              <div className="random-reset">
                <div className="random-reset-title">
                  Everyone has been the {selectedCategory.toLowerCase()}!
                </div>
                <button type="button" onClick={clearUsed} style={{ background: categoryColor }}>
                  Reset & Start Over
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
                ✨ Pick Next {selectedCategory}
              </button>
            )}

            {(availableStudents.length > 0 || usedStudents.length > 0) && (
              <div className="random-lists">
                {availableStudents.length > 0 && (
                  <div>
                    <div className="random-list-title">
                      Available ({availableStudents.length})
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
                    <div className="random-list-title">Already Used ({usedStudents.length})</div>
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
            <div className="modal-card">
              <h3>Add Custom Role</h3>
              <p className="muted">Create your own classroom role.</p>
              <label className="stack">
                <span>Role Name</span>
                <input
                  value={newCategoryName}
                  onChange={(event) => setNewCategoryName(event.target.value)}
                  placeholder="e.g., Door Holder"
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
                  Cancel
                </button>
                <button type="button" onClick={addCustomCategory} disabled={!newCategoryName.trim()}>
                  Add
                </button>
              </div>
            </div>
          </div>
        )}

        {showDeleteCategory && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>Delete Custom Role?</h3>
              <p className="muted">
                This will remove "{selectedCategory}" and its saved rotation history.
              </p>
              <div className="modal-actions">
                <button type="button" className="link" onClick={() => setShowDeleteCategory(false)}>
                  Cancel
                </button>
                <button type="button" className="danger" onClick={deleteCustomCategory}>
                  Delete
                </button>
              </div>
            </div>
          </div>
        )}

        {pickedStudent && (
          <div className="modal-overlay">
            <div className="modal-card random-result">
              <div className="random-result-icon">{isRotationMode ? categoryIcon : "🔀"}</div>
              <div className="muted">
                {isRotationMode ? `Today's ${selectedCategory}` : "Random Pick!"}
              </div>
              <h2>
                {pickedStudent.first_name} {pickedStudent.last_name}
              </h2>
              <div className="random-result-emoji">🎉</div>
              <div className="modal-actions">
                {isRotationMode ? (
                  <>
                    <button type="button" onClick={markUsed} style={{ background: categoryColor }}>
                      Mark as Used
                    </button>
                    <button type="button" className="link" onClick={() => setPickedStudent(null)}>
                      Skip (Student Absent)
                    </button>
                  </>
                ) : (
                  <button type="button" onClick={() => setPickedStudent(null)}>
                    Done
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
