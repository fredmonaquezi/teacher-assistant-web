import { format } from "date-fns";

function DevelopmentTrackingSection({
  groupedDevelopment,
  criteriaLookup,
  ratingLabel,
  selectDevelopmentCriterion,
  setShowDevelopmentForm,
  activeDevelopmentCriterion,
  activeDevelopmentCategoryName,
  showAddDevelopmentHistoryForm,
  setShowAddDevelopmentHistoryForm,
  activeDevelopmentHistory,
  sparklineData,
  handleCreateDevelopmentScoreEntry,
  studentId,
  activeDevelopmentCriterionId,
  newDevelopmentHistoryForm,
  setNewDevelopmentHistoryForm,
  editingDevelopmentScoreId,
  setEditingDevelopmentScoreId,
  developmentHistoryEditForm,
  setDevelopmentHistoryEditForm,
  handleUpdateDevelopmentScore,
  startEditingDevelopmentHistory,
  trendLabel,
  showDevelopmentForm,
  handleCreateDevelopmentScore,
  developmentYearFilter,
  setDevelopmentYearFilter,
  rubricYearOptions,
  developmentScoreForm,
  setDevelopmentScoreForm,
  groupedCriterionOptions,
  selectedCriterionMeta,
}) {
  return (
    <>
      <section className="panel">
        <div className="student-section-title">
          <h3>Development Tracking</h3>
          <button type="button" onClick={() => setShowDevelopmentForm(true)}>
            Update
          </button>
        </div>
        {Object.keys(groupedDevelopment).length === 0 ? (
          <p className="muted">No development tracking yet.</p>
        ) : (
          <div className="student-development-groups">
            {Object.entries(groupedDevelopment)
              .sort(([a], [b]) => a.localeCompare(b))
              .map(([categoryName, scores]) => (
                <article key={categoryName} className="student-development-category">
                  <h4>{categoryName}</h4>
                  <ul className="list student-dev-list">
                    {scores.map((score) => {
                      const criterion = criteriaLookup.get(score.criterion_id);
                      const scoreValue = Math.max(0, Number(score.rating || 0));
                      return (
                        <li key={score.id}>
                          <button
                            type="button"
                            className="student-dev-row-btn"
                            onClick={() => {
                              selectDevelopmentCriterion(score.criterion_id || "");
                            }}
                          >
                            <span className="student-dev-criterion">
                              <span className="student-dev-criterion-title">
                                {criterion?.label || "Criterion"}
                              </span>
                              {score.notes ? (
                                <span className="student-dev-criterion-note">{score.notes}</span>
                              ) : (
                                <span className="student-dev-criterion-note subtle">No notes added</span>
                              )}
                            </span>
                            <span className="student-dev-rating">
                              <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                                {"★".repeat(scoreValue)}
                                {"☆".repeat(Math.max(0, 5 - scoreValue))}
                              </span>
                              <span className="student-dev-label">{ratingLabel(scoreValue)}</span>
                            </span>
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </article>
              ))}
          </div>
        )}
      </section>

      {activeDevelopmentCriterion && (
        <div className="modal-overlay">
          <div className="modal-card development-history-modal">
            <div className="development-history-header">
              <div>
                <h3>{activeDevelopmentCriterion.label || "Criterion History"}</h3>
                <p className="muted">{activeDevelopmentCategoryName}</p>
                {activeDevelopmentCriterion.description ? (
                  <p className="development-history-description">{activeDevelopmentCriterion.description}</p>
                ) : null}
              </div>
              <div className="development-history-header-actions">
                <button
                  type="button"
                  onClick={() => setShowAddDevelopmentHistoryForm((prev) => !prev)}
                >
                  {showAddDevelopmentHistoryForm ? "Cancel new rating" : "+ Add New Rating"}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => selectDevelopmentCriterion("")}
                  aria-label="Close history"
                >
                  ×
                </button>
              </div>
            </div>

            {activeDevelopmentHistory.length === 0 ? (
              <p className="muted">No history yet for this criterion.</p>
            ) : (
              <>
                {sparklineData && (
                  <section
                    className={`development-sparkline-card ${sparklineData.total <= 2 ? "compact" : ""}`}
                    aria-label="Progress trend"
                  >
                    <div className="development-sparkline-meta">
                      <strong>Trend</strong>
                      <span>{sparklineData.total} entries</span>
                    </div>
                    <svg
                      className="development-sparkline"
                      viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                      role="img"
                      aria-label={`Ratings moved from ${sparklineData.first} to ${sparklineData.last}`}
                    >
                      <polyline
                        className="development-sparkline-line"
                        points={sparklineData.points}
                      />
                      {sparklineData.dots.map((dot, idx) => (
                        <circle key={idx} cx={dot.x} cy={dot.y} r="3.2" className="development-sparkline-dot" />
                      ))}
                    </svg>
                    <div className="development-sparkline-labels">
                      <span>Earlier: {sparklineData.first}/5</span>
                      <span>Latest: {sparklineData.last}/5</span>
                    </div>
                    {sparklineData.total === 1 && (
                      <p className="development-sparkline-hint">Add one more rating to start visual trend tracking.</p>
                    )}
                  </section>
                )}
                {showAddDevelopmentHistoryForm && (
                  <form
                    className="development-history-add"
                    onSubmit={async (event) => {
                      event.preventDefault();
                      const success = await handleCreateDevelopmentScoreEntry({
                        studentId,
                        criterionId: activeDevelopmentCriterionId,
                        rating: newDevelopmentHistoryForm.rating,
                        date: newDevelopmentHistoryForm.date,
                        notes: newDevelopmentHistoryForm.notes,
                      });
                      if (!success) return;
                      setShowAddDevelopmentHistoryForm(false);
                      setNewDevelopmentHistoryForm({
                        rating: "3",
                        date: format(new Date(), "yyyy-MM-dd"),
                        notes: "",
                      });
                    }}
                  >
                    <label className="stack">
                      <span>Rating</span>
                      <select
                        value={newDevelopmentHistoryForm.rating}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, rating: event.target.value }))
                        }
                      >
                        <option value="1">1 - Needs Significant Support</option>
                        <option value="2">2 - Beginning to Develop</option>
                        <option value="3">3 - Developing</option>
                        <option value="4">4 - Proficient</option>
                        <option value="5">5 - Mastering / Exceeding</option>
                      </select>
                    </label>
                    <label className="stack">
                      <span>Date</span>
                      <input
                        type="date"
                        value={newDevelopmentHistoryForm.date}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, date: event.target.value }))
                        }
                      />
                    </label>
                    <label className="stack">
                      <span>Notes</span>
                      <textarea
                        rows="2"
                        value={newDevelopmentHistoryForm.notes}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        placeholder="Optional notes"
                      />
                    </label>
                    <div className="modal-actions">
                      <button type="submit">Save new rating</button>
                    </div>
                  </form>
                )}
                <ul className="list development-history-list">
                  {activeDevelopmentHistory.map((score, index) => {
                    const nextOlderScore = activeDevelopmentHistory[index + 1];
                    const trend = trendLabel(score, nextOlderScore);
                    const scoreValue = Math.max(0, Number(score.rating || 0));
                    const trendClass =
                      trend === "Improved" ? "improved" : trend === "Needs Support" ? "declined" : "steady";
                    const dateLabel = score.score_date || score.created_at?.slice(0, 10) || "No date";
                    return (
                      <li key={score.id}>
                        <div className="development-history-item-head">
                          <div className="development-history-rating">
                            <span className="student-dev-stars" aria-label={`${scoreValue} out of 5 stars`}>
                              {"★".repeat(scoreValue)}
                              {"☆".repeat(Math.max(0, 5 - scoreValue))}
                            </span>
                            <span>{ratingLabel(scoreValue)}</span>
                          </div>
                          <div className={`development-trend ${trendClass}`}>{trend}</div>
                        </div>
                        <p className="development-history-date">{dateLabel}</p>
                        {editingDevelopmentScoreId === score.id ? (
                          <form
                            className="development-history-edit"
                            onSubmit={async (event) => {
                              event.preventDefault();
                              const success = await handleUpdateDevelopmentScore(score.id, {
                                rating: developmentHistoryEditForm.rating,
                                date: developmentHistoryEditForm.date,
                                notes: developmentHistoryEditForm.notes,
                              });
                              if (!success) return;
                              setEditingDevelopmentScoreId("");
                            }}
                          >
                            <label className="stack">
                              <span>Rating</span>
                              <select
                                value={developmentHistoryEditForm.rating}
                                onChange={(event) =>
                                  setDevelopmentHistoryEditForm((prev) => ({
                                    ...prev,
                                    rating: event.target.value,
                                  }))
                                }
                              >
                                <option value="1">1 - Needs Significant Support</option>
                                <option value="2">2 - Beginning to Develop</option>
                                <option value="3">3 - Developing</option>
                                <option value="4">4 - Proficient</option>
                                <option value="5">5 - Mastering / Exceeding</option>
                              </select>
                            </label>
                            <label className="stack">
                              <span>Date</span>
                              <input
                                type="date"
                                value={developmentHistoryEditForm.date}
                                onChange={(event) =>
                                  setDevelopmentHistoryEditForm((prev) => ({
                                    ...prev,
                                    date: event.target.value,
                                  }))
                                }
                              />
                            </label>
                            <label className="stack">
                              <span>Notes</span>
                              <textarea
                                rows="2"
                                value={developmentHistoryEditForm.notes}
                                onChange={(event) =>
                                  setDevelopmentHistoryEditForm((prev) => ({
                                    ...prev,
                                    notes: event.target.value,
                                  }))
                                }
                                placeholder="Optional notes"
                              />
                            </label>
                            <div className="modal-actions">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setEditingDevelopmentScoreId("")}
                              >
                                Cancel
                              </button>
                              <button type="submit">Save changes</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {score.notes ? (
                              <p className="development-history-note">{score.notes}</p>
                            ) : (
                              <p className="development-history-note muted">No notes for this record.</p>
                            )}
                            <div className="development-history-actions">
                              <button type="button" className="secondary" onClick={() => startEditingDevelopmentHistory(score)}>
                                Edit
                              </button>
                            </div>
                          </>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </div>
      )}

      {showDevelopmentForm && (
        <div className="modal-overlay">
          <div className="modal-card development-modal">
            <div className="development-modal-header">
              <h3>Update Development Tracking</h3>
              <p className="muted">Choose the year range first, then pick the criterion with context.</p>
            </div>
            <form
              onSubmit={async (event) => {
                await handleCreateDevelopmentScore(event, studentId);
                setShowDevelopmentForm(false);
              }}
              className="development-modal-form"
            >
              <label className="stack">
                <span>Year Range</span>
                <select
                  value={developmentYearFilter}
                  onChange={(event) => setDevelopmentYearFilter(event.target.value)}
                >
                  <option value="all">All year ranges</option>
                  {rubricYearOptions.map((yearRange) => (
                    <option key={yearRange} value={yearRange}>
                      {yearRange}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>Criterion</span>
                <select
                  value={developmentScoreForm.criterionId}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: event.target.value }))
                  }
                  required
                >
                  <option value="">Select criterion</option>
                  {groupedCriterionOptions.map(([groupLabel, criteria]) => (
                    <optgroup key={groupLabel} label={groupLabel}>
                      {criteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.label || criterion.description || "Criterion"}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="development-criterion-preview">
                {selectedCriterionMeta ? (
                  <>
                    <strong>{selectedCriterionMeta.label || "Selected criterion"}</strong>
                    <p className="muted">
                      {selectedCriterionMeta.description || "No extra description for this criterion yet."}
                    </p>
                    <div className="development-criterion-meta">
                      <span>{selectedCriterionMeta.gradeBand}</span>
                      <span>{selectedCriterionMeta.categoryName}</span>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    Select a criterion to see what it measures before saving.
                  </p>
                )}
              </div>
              <label className="stack">
                <span>Rating (1-5)</span>
                <select
                  value={developmentScoreForm.rating}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                >
                  <option value="1">1 - Needs Significant Support</option>
                  <option value="2">2 - Beginning to Develop</option>
                  <option value="3">3 - Developing</option>
                  <option value="4">4 - Proficient</option>
                  <option value="5">5 - Mastering / Exceeding</option>
                </select>
              </label>
              <label className="stack">
                <span>Date</span>
                <input
                  type="date"
                  value={developmentScoreForm.date}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>Notes</span>
                <input
                  value={developmentScoreForm.notes}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder="Optional"
                />
              </label>
              <div className="modal-actions development-modal-actions">
                <button type="button" className="secondary" onClick={() => setShowDevelopmentForm(false)}>
                  Cancel
                </button>
                <button type="submit">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default DevelopmentTrackingSection;
