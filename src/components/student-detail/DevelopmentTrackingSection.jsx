import { format } from "date-fns";
import { useTranslation } from "react-i18next";

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
  const { t } = useTranslation();
  return (
    <>
      <section className="panel">
        <div className="student-section-title">
          <h3>{t("development.title")}</h3>
          <button type="button" onClick={() => setShowDevelopmentForm(true)}>
            {t("development.update")}
          </button>
        </div>
        {Object.keys(groupedDevelopment).length === 0 ? (
          <p className="muted">{t("development.empty")}</p>
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
                                {criterion?.label || t("development.criterion")}
                              </span>
                              {score.notes ? (
                                <span className="student-dev-criterion-note">{score.notes}</span>
                              ) : (
                                <span className="student-dev-criterion-note subtle">{t("development.noNotesAdded")}</span>
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
                <h3>{activeDevelopmentCriterion.label || t("development.criterionHistory")}</h3>
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
                  {showAddDevelopmentHistoryForm ? t("development.cancelNewRating") : t("development.addNewRating")}
                </button>
                <button
                  type="button"
                  className="icon-button"
                  onClick={() => selectDevelopmentCriterion("")}
                  aria-label={t("development.closeHistory")}
                >
                  ×
                </button>
              </div>
            </div>

            {activeDevelopmentHistory.length === 0 ? (
              <p className="muted">{t("development.noHistory")}</p>
            ) : (
              <>
                {sparklineData && (
                  <section
                    className={`development-sparkline-card ${sparklineData.total <= 2 ? "compact" : ""}`}
                    aria-label={t("development.progressTrend")}
                  >
                    <div className="development-sparkline-meta">
                      <strong>{t("development.trend")}</strong>
                      <span>{t("development.entriesCount", { count: sparklineData.total })}</span>
                    </div>
                    <svg
                      className="development-sparkline"
                      viewBox={`0 0 ${sparklineData.width} ${sparklineData.height}`}
                      role="img"
                      aria-label={t("development.ratingsMoved", {
                        first: sparklineData.first,
                        last: sparklineData.last,
                      })}
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
                      <span>{t("development.earlier")}: {sparklineData.first}/5</span>
                      <span>{t("development.latest")}: {sparklineData.last}/5</span>
                    </div>
                    {sparklineData.total === 1 && (
                      <p className="development-sparkline-hint">{t("development.sparklineHint")}</p>
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
                        <span>{t("development.rating")}</span>
                        <select
                        value={newDevelopmentHistoryForm.rating}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, rating: event.target.value }))
                        }
                      >
                        <option value="1">{t("development.ratingOptions.1")}</option>
                        <option value="2">{t("development.ratingOptions.2")}</option>
                        <option value="3">{t("development.ratingOptions.3")}</option>
                        <option value="4">{t("development.ratingOptions.4")}</option>
                        <option value="5">{t("development.ratingOptions.5")}</option>
                      </select>
                    </label>
                    <label className="stack">
                      <span>{t("development.date")}</span>
                      <input
                        type="date"
                        value={newDevelopmentHistoryForm.date}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, date: event.target.value }))
                        }
                      />
                    </label>
                    <label className="stack">
                      <span>{t("development.notes")}</span>
                      <textarea
                        rows="2"
                        value={newDevelopmentHistoryForm.notes}
                        onChange={(event) =>
                          setNewDevelopmentHistoryForm((prev) => ({ ...prev, notes: event.target.value }))
                        }
                        placeholder={t("development.optionalNotes")}
                      />
                    </label>
                    <div className="modal-actions">
                      <button type="submit">{t("development.saveNewRating")}</button>
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
                    const trendText =
                      trend === "Improved"
                        ? t("development.trendImproved")
                        : trend === "Needs Support"
                          ? t("development.trendNeedsSupport")
                          : trend === "Baseline"
                            ? t("development.trendBaseline")
                            : t("development.trendSteady");
                    const dateLabel = score.score_date || score.created_at?.slice(0, 10) || t("runningRecords.noDate");
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
                          <div className={`development-trend ${trendClass}`}>{trendText}</div>
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
                              <span>{t("development.rating")}</span>
                              <select
                                value={developmentHistoryEditForm.rating}
                                onChange={(event) =>
                                  setDevelopmentHistoryEditForm((prev) => ({
                                    ...prev,
                                    rating: event.target.value,
                                  }))
                                }
                              >
                                <option value="1">{t("development.ratingOptions.1")}</option>
                                <option value="2">{t("development.ratingOptions.2")}</option>
                                <option value="3">{t("development.ratingOptions.3")}</option>
                                <option value="4">{t("development.ratingOptions.4")}</option>
                                <option value="5">{t("development.ratingOptions.5")}</option>
                              </select>
                            </label>
                            <label className="stack">
                              <span>{t("development.date")}</span>
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
                              <span>{t("development.notes")}</span>
                              <textarea
                                rows="2"
                                value={developmentHistoryEditForm.notes}
                                onChange={(event) =>
                                  setDevelopmentHistoryEditForm((prev) => ({
                                    ...prev,
                                    notes: event.target.value,
                                  }))
                                }
                                placeholder={t("development.optionalNotes")}
                              />
                            </label>
                            <div className="modal-actions">
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => setEditingDevelopmentScoreId("")}
                              >
                                {t("common.actions.cancel")}
                              </button>
                              <button type="submit">{t("calendar.actions.saveChanges")}</button>
                            </div>
                          </form>
                        ) : (
                          <>
                            {score.notes ? (
                              <p className="development-history-note">{score.notes}</p>
                            ) : (
                              <p className="development-history-note muted">{t("development.noNotesForRecord")}</p>
                            )}
                            <div className="development-history-actions">
                              <button type="button" className="secondary" onClick={() => startEditingDevelopmentHistory(score)}>
                                {t("calendar.actions.edit")}
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
              <h3>{t("development.updateTitle")}</h3>
              <p className="muted">{t("development.updateDescription")}</p>
            </div>
            <form
              onSubmit={async (event) => {
                await handleCreateDevelopmentScore(event, studentId);
                setShowDevelopmentForm(false);
              }}
              className="development-modal-form"
            >
              <label className="stack">
                <span>{t("development.yearRange")}</span>
                <select
                  value={developmentYearFilter}
                  onChange={(event) => setDevelopmentYearFilter(event.target.value)}
                >
                  <option value="all">{t("development.allYearRanges")}</option>
                  {rubricYearOptions.map((yearRange) => (
                    <option key={yearRange} value={yearRange}>
                      {yearRange}
                    </option>
                  ))}
                </select>
              </label>
              <label className="stack">
                <span>{t("development.criteriaLabel")}</span>
                <select
                  value={developmentScoreForm.criterionId}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: event.target.value }))
                  }
                  required
                >
                  <option value="">{t("development.selectCriterion")}</option>
                  {groupedCriterionOptions.map(([groupLabel, criteria]) => (
                    <optgroup key={groupLabel} label={groupLabel}>
                      {criteria.map((criterion) => (
                        <option key={criterion.id} value={criterion.id}>
                          {criterion.label || criterion.description || t("development.criterion")}
                        </option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              <div className="development-criterion-preview">
                {selectedCriterionMeta ? (
                  <>
                    <strong>{selectedCriterionMeta.label || t("development.selectedCriterion")}</strong>
                    <p className="muted">
                      {selectedCriterionMeta.description || t("development.noExtraDescription")}
                    </p>
                    <div className="development-criterion-meta">
                      <span>{selectedCriterionMeta.gradeBand}</span>
                      <span>{selectedCriterionMeta.categoryName}</span>
                    </div>
                  </>
                ) : (
                  <p className="muted">
                    {t("development.selectCriterionHelp")}
                  </p>
                )}
              </div>
              <label className="stack">
                <span>{t("development.rating15")}</span>
                <select
                  value={developmentScoreForm.rating}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, rating: event.target.value }))
                  }
                >
                  <option value="1">{t("development.ratingOptions.1")}</option>
                  <option value="2">{t("development.ratingOptions.2")}</option>
                  <option value="3">{t("development.ratingOptions.3")}</option>
                  <option value="4">{t("development.ratingOptions.4")}</option>
                  <option value="5">{t("development.ratingOptions.5")}</option>
                </select>
              </label>
              <label className="stack">
                <span>{t("development.date")}</span>
                <input
                  type="date"
                  value={developmentScoreForm.date}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, date: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>{t("development.notes")}</span>
                <input
                  value={developmentScoreForm.notes}
                  onChange={(event) =>
                    setDevelopmentScoreForm((prev) => ({ ...prev, notes: event.target.value }))
                  }
                  placeholder={t("development.optional")}
                />
              </label>
              <div className="modal-actions development-modal-actions">
                <button type="button" className="secondary" onClick={() => setShowDevelopmentForm(false)}>
                  {t("common.actions.cancel")}
                </button>
                <button type="submit">{t("common.actions.save")}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

export default DevelopmentTrackingSection;
