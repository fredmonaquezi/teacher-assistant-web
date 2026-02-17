import { useMemo, useState } from "react";

function RubricsPage({
  formError,
  rubrics,
  rubricCategories,
  rubricCriteria,
  loading,
  seedingRubrics,
  handleSeedDefaultRubrics,
  handleCreateRubricTemplate,
  handleUpdateRubricTemplate,
  handleDeleteRubricTemplate,
  handleCreateRubricCategory,
  handleDeleteRubricCategory,
  handleCreateRubricCriterion,
  handleDeleteRubricCriterion,
  handleUpdateRubricCriterion,
}) {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [showCreateTemplate, setShowCreateTemplate] = useState(false);
  const [showAddCategory, setShowAddCategory] = useState(false);
  const [showAddCriterion, setShowAddCriterion] = useState(null);
  const [editingCriterion, setEditingCriterion] = useState(null);
  const [newTemplateForm, setNewTemplateForm] = useState({
    title: "",
    gradeBand: "",
    subject: "",
  });
  const [newCategoryName, setNewCategoryName] = useState("");
  const [newCriterionForm, setNewCriterionForm] = useState({
    label: "",
    description: "",
  });

  const normalizeSubject = (value) => (value || "").trim().toLowerCase();
  const subjectKind = (subject) => {
    const normalized = normalizeSubject(subject);
    if (["english", "inglês", "ingles"].includes(normalized)) return "english";
    if (["math", "mathematics", "matemática", "matematica"].includes(normalized)) return "math";
    if (["science", "ciência", "ciencia", "ciências", "ciencias"].includes(normalized)) return "science";
    if (["general", "geral"].includes(normalized)) return "general";
    return "default";
  };
  const renderRubricIcon = (kind) => {
    switch (kind) {
      case "header":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M6 4.5h10a2 2 0 0 1 2 2V19H8a2 2 0 0 1-2-2V4.5Z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 15l1.2 1.2L12.8 14" />
            <path d="M5 6.5h2v10H5z" />
          </svg>
        );
      case "level":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M3.5 9.2 12 5l8.5 4.2L12 13.5 3.5 9.2Z" />
            <path d="M7 11.2V14c0 1.8 2.4 3.2 5 3.2s5-1.4 5-3.2v-2.8" />
            <path d="M20.5 9.2v5.1" />
          </svg>
        );
      case "english":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M5 6a2 2 0 0 1 2-2h10v15H7a2 2 0 0 0-2 2V6Z" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 15h4" />
          </svg>
        );
      case "math":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <rect x="5" y="4.5" width="14" height="15" rx="2.5" />
            <line x1="9" y1="8.5" x2="15" y2="8.5" />
            <line x1="9" y1="12" x2="15" y2="12" />
            <path d="M10 15.5h4" />
          </svg>
        );
      case "science":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="M9 4.5h6" />
            <path d="M10 4.5v5.4l-3.4 5.6a2.2 2.2 0 0 0 1.9 3.3h7a2.2 2.2 0 0 0 1.9-3.3L14 9.9V4.5" />
            <path d="M9 13h6" />
          </svg>
        );
      case "general":
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <path d="m12 5 2.1 4.3 4.7.7-3.4 3.3.8 4.7-4.2-2.2-4.2 2.2.8-4.7-3.4-3.3 4.7-.7L12 5Z" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" className="rubric-line-icon" aria-hidden="true">
            <rect x="6" y="4.5" width="12" height="15" rx="2" />
            <line x1="9" y1="8" x2="15" y2="8" />
            <line x1="9" y1="11" x2="15" y2="11" />
            <path d="M9 14h4" />
          </svg>
        );
    }
  };
  const subjectColor = (subject) => {
    const normalized = normalizeSubject(subject);
    if (["english", "inglês", "ingles"].includes(normalized)) return "#2563eb";
    if (["math", "mathematics", "matemática", "matematica"].includes(normalized)) return "#16a34a";
    if (["science", "ciência", "ciencia", "ciências", "ciencias"].includes(normalized)) return "#f97316";
    if (["general", "geral"].includes(normalized)) return "#7c3aed";
    return "#64748b";
  };

  const gradeLevels = useMemo(() => {
    const predefined = ["Years 1-3", "Years 4-6", "Years 7-9", "Years 10-12"];
    const extra = rubrics
      .map((rubric) => rubric.grade_band || "")
      .filter((value) => value.trim().length > 0);
    const ordered = [];
    const seen = new Set();
    for (const level of [...predefined, ...extra]) {
      const normalized = level.trim();
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      ordered.push(normalized);
    }
    return ordered;
  }, [rubrics]);

  const templatesForLevel = (level) =>
    rubrics.filter((rubric) => (rubric.grade_band || "").trim() === level);

  const totalCriteria = (rubricId) => {
    const categories = rubricCategories.filter((c) => c.rubric_id === rubricId);
    const categoryIds = new Set(categories.map((c) => c.id));
    return rubricCriteria.filter((c) => categoryIds.has(c.category_id)).length;
  };

  const handleCreateTemplate = async () => {
    const created = await handleCreateRubricTemplate({
      title: newTemplateForm.title.trim(),
      gradeBand: newTemplateForm.gradeBand.trim(),
      subject: newTemplateForm.subject.trim(),
    });
    if (!created) return;
    setNewTemplateForm({ title: "", gradeBand: "", subject: "" });
    setShowCreateTemplate(false);
  };

  const handleUpdateTemplate = async (rubricId, updates) => {
    await handleUpdateRubricTemplate(rubricId, updates);
  };

  const handleDeleteTemplate = async (rubricId) => {
    if (!window.confirm("Delete this template?")) return;
    const deleted = await handleDeleteRubricTemplate(rubricId);
    if (!deleted) return;
    if (selectedTemplate?.id === rubricId) setSelectedTemplate(null);
  };

  const handleCreateCategory = async () => {
    if (!selectedTemplate?.id) return;
    const name = newCategoryName.trim();
    if (!name) return;
    const created = await handleCreateRubricCategory({
      rubricId: selectedTemplate.id,
      name,
      sortOrder: rubricCategories.filter((c) => c.rubric_id === selectedTemplate.id).length,
    });
    if (!created) return;
    setNewCategoryName("");
    setShowAddCategory(false);
  };

  const handleDeleteCategory = async (categoryId) => {
    if (!window.confirm("Delete this category and its criteria?")) return;
    await handleDeleteRubricCategory(categoryId);
  };

  const handleCreateCriterion = async () => {
    if (!showAddCriterion?.id) return;
    const label = newCriterionForm.label.trim();
    const description = newCriterionForm.description.trim();
    if (!label && !description) return;
    const created = await handleCreateRubricCriterion({
      categoryId: showAddCriterion.id,
      label: label || null,
      description,
      sortOrder: rubricCriteria.filter((c) => c.category_id === showAddCriterion.id).length,
    });
    if (!created) return;
    setNewCriterionForm({ label: "", description: "" });
    setShowAddCriterion(null);
  };

  const handleDeleteCriterion = async (criterionId) => {
    if (!window.confirm("Delete this criterion?")) return;
    await handleDeleteRubricCriterion(criterionId);
  };

  const handleUpdateCriterion = async () => {
    if (!editingCriterion?.id) return;
    const updated = await handleUpdateRubricCriterion(editingCriterion.id, {
      label: editingCriterion.label,
      description: editingCriterion.description,
    });
    if (!updated) return;
    setEditingCriterion(null);
  };

  const templateCategories = selectedTemplate
    ? rubricCategories.filter((c) => c.rubric_id === selectedTemplate.id)
    : [];

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel rubrics-page">
        <div className="rubrics-header-card">
          <div className="rubrics-header-icon" aria-hidden="true">{renderRubricIcon("header")}</div>
          <div className="rubrics-header-copy">
            <h2>Rubric Template Library</h2>
            <p className="muted">
              Browse, customize, and create development tracking templates.
            </p>
          </div>
        </div>

        <div className="rubrics-actions">
          <button type="button" onClick={() => setShowCreateTemplate(true)}>
            Create New
          </button>
          <button type="button" className="secondary" onClick={handleSeedDefaultRubrics} disabled={seedingRubrics}>
            {seedingRubrics ? "Seeding default rubrics..." : "Create default rubrics"}
          </button>
        </div>
        {seedingRubrics ? (
          <p className="rubrics-seeding-message" role="status" aria-live="polite">
            Creating default rubrics. This can take a few seconds...
          </p>
        ) : null}

        {loading ? (
          <p className="muted">Loading rubrics...</p>
        ) : (
          gradeLevels.map((level) => {
            const templates = templatesForLevel(level);
            if (!templates.length) return null;
            return (
              <div key={level} className="rubrics-section">
                <div className="rubrics-section-title">
                  {renderRubricIcon("level")}
                  <strong>{level}</strong>
                </div>
                <div className="rubrics-grid">
                  {templates.map((template) => (
                    <div
                      key={template.id}
                      role="button"
                      tabIndex={0}
                      className="rubric-card"
                      onClick={() => setSelectedTemplate(template)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setSelectedTemplate(template);
                        }
                      }}
                    >
                      <div className="rubric-card-top">
                        <div
                          className="rubric-card-icon"
                          style={{ color: subjectColor(template.subject) }}
                        >
                          {renderRubricIcon(subjectKind(template.subject))}
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={(event) => {
                            event.stopPropagation();
                            handleDeleteTemplate(template.id);
                          }}
                          aria-label="Delete template"
                        >
                          ✕
                        </button>
                      </div>
                      <div className="rubric-card-subject" style={{ color: subjectColor(template.subject) }}>
                        {template.subject || "Subject"}
                      </div>
                      <div className="rubric-card-title">{template.title}</div>
                      <div className="rubric-card-stats">
                        <span>{rubricCategories.filter((c) => c.rubric_id === template.id).length} categories</span>
                        <span>{totalCriteria(template.id)} criteria</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </section>

      {showCreateTemplate && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>Create New Template</h3>
            <p className="muted">Build a custom rubric from scratch.</p>
            <label className="stack">
              <span>Template Name</span>
              <input
                value={newTemplateForm.title}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, title: event.target.value }))
                }
                placeholder="Advanced Writing Skills"
              />
            </label>
            <label className="stack">
              <span>Grade Level</span>
              <input
                value={newTemplateForm.gradeBand}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, gradeBand: event.target.value }))
                }
                placeholder="Years 7-9"
              />
            </label>
            <label className="stack">
              <span>Subject</span>
              <input
                value={newTemplateForm.subject}
                onChange={(event) =>
                  setNewTemplateForm((prev) => ({ ...prev, subject: event.target.value }))
                }
                placeholder="English"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowCreateTemplate(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateTemplate}>
                Create
              </button>
            </div>
          </div>
        </div>
      )}

      {selectedTemplate && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-editor">
            <div className="rubrics-editor-header">
              <div className="rubrics-editor-heading">
                <div
                  className="rubrics-editor-icon"
                  style={{ color: subjectColor(selectedTemplate.subject) }}
                >
                  {renderRubricIcon(subjectKind(selectedTemplate.subject))}
                </div>
                <div>
                  <div className="rubrics-editor-subject" style={{ color: subjectColor(selectedTemplate.subject) }}>
                    {selectedTemplate.subject || "Subject"}
                  </div>
                  <div className="rubrics-editor-title">{selectedTemplate.title}</div>
                  <div className="muted">{selectedTemplate.grade_band || "Grade band"}</div>
                </div>
              </div>
              <button
                type="button"
                className="icon-button rubrics-editor-close"
                onClick={() => setSelectedTemplate(null)}
                aria-label="Close rubric editor"
              >
                ×
              </button>
            </div>

            <div className="rubrics-info-card">
              <h4>Template Information</h4>
              <label className="stack">
                <span>Template Name</span>
                <input
                  value={selectedTemplate.title}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, title: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { title: event.target.value })
                  }
                />
              </label>
              <label className="stack">
                <span>Grade Level</span>
                <input
                  value={selectedTemplate.grade_band || ""}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, grade_band: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { grade_band: event.target.value })
                  }
                />
              </label>
              <label className="stack">
                <span>Subject</span>
                <input
                  value={selectedTemplate.subject || ""}
                  onChange={(event) =>
                    setSelectedTemplate((prev) => ({ ...prev, subject: event.target.value }))
                  }
                  onBlur={(event) =>
                    handleUpdateTemplate(selectedTemplate.id, { subject: event.target.value })
                  }
                />
              </label>
            </div>

            <div className="rubrics-categories">
              <div className="rubrics-categories-header">
                <h4>Categories & Criteria</h4>
                <button type="button" className="link" onClick={() => setShowAddCategory(true)}>
                  Add Category
                </button>
              </div>

              {templateCategories.length === 0 ? (
                <div className="muted">No categories yet.</div>
              ) : (
                templateCategories.map((category) => {
                  const criteria = rubricCriteria
                    .filter((c) => c.category_id === category.id)
                    .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
                  return (
                    <div key={category.id} className="rubric-category-card">
                      <div className="rubric-category-header">
                        <div>
                          <strong>{category.name}</strong>
                          <span className="muted"> • {criteria.length} criteria</span>
                        </div>
                        <button
                          type="button"
                          className="icon-button"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          ✕
                        </button>
                      </div>
                      {criteria.length === 0 ? (
                        <div className="muted">No criteria yet.</div>
                      ) : (
                        <ul className="rubric-criteria-list">
                          {criteria.map((criterion) => (
                            <li key={criterion.id}>
                              <div>
                                <strong>{criterion.label || "Criterion"}</strong>
                                {criterion.description ? (
                                  <div className="muted">{criterion.description}</div>
                                ) : null}
                              </div>
                              <div className="rubric-criteria-actions">
                                <button
                                  type="button"
                                  className="order-btn"
                                  onClick={() => setEditingCriterion({ ...criterion })}
                                >
                                  Edit
                                </button>
                                <button
                                  type="button"
                                  className="icon-button"
                                  onClick={() => handleDeleteCriterion(criterion.id)}
                                >
                                  ✕
                                </button>
                              </div>
                            </li>
                          ))}
                        </ul>
                      )}
                      <button
                        type="button"
                        className="link"
                        onClick={() => setShowAddCriterion(category)}
                      >
                        Add Criterion
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            <div className="modal-actions rubrics-editor-actions">
              <button type="button" className="secondary" onClick={() => setSelectedTemplate(null)}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCategory && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>New Category</h3>
            <p className="muted">Add a new category to organize criteria.</p>
            <label className="stack">
              <span>Category Name</span>
              <input
                value={newCategoryName}
                onChange={(event) => setNewCategoryName(event.target.value)}
                placeholder="Critical Thinking"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddCategory(false)}>
                Cancel
              </button>
              <button type="button" onClick={handleCreateCategory} disabled={!newCategoryName.trim()}>
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {showAddCriterion && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>New Criterion</h3>
            <p className="muted">Add a new skill to track in {showAddCriterion.name}.</p>
            <label className="stack">
              <span>Criterion Name</span>
              <input
                value={newCriterionForm.label}
                onChange={(event) =>
                  setNewCriterionForm((prev) => ({ ...prev, label: event.target.value }))
                }
                placeholder="Critical Thinking Skills"
              />
            </label>
            <label className="stack">
              <span>Description (Optional)</span>
              <input
                value={newCriterionForm.description}
                onChange={(event) =>
                  setNewCriterionForm((prev) => ({ ...prev, description: event.target.value }))
                }
                placeholder="Analyzes information and draws conclusions"
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setShowAddCriterion(null)}>
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCreateCriterion}
                disabled={!newCriterionForm.label.trim() && !newCriterionForm.description.trim()}
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}

      {editingCriterion && (
        <div className="modal-overlay">
          <div className="modal-card rubrics-modal">
            <h3>Edit Criterion</h3>
            <label className="stack">
              <span>Criterion Name</span>
              <input
                value={editingCriterion.label || ""}
                onChange={(event) =>
                  setEditingCriterion((prev) => ({ ...prev, label: event.target.value }))
                }
              />
            </label>
            <label className="stack">
              <span>Description</span>
              <input
                value={editingCriterion.description || ""}
                onChange={(event) =>
                  setEditingCriterion((prev) => ({ ...prev, description: event.target.value }))
                }
              />
            </label>
            <div className="modal-actions">
              <button type="button" className="link" onClick={() => setEditingCriterion(null)}>
                Cancel
              </button>
              <button type="button" onClick={handleUpdateCriterion}>
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default RubricsPage;
