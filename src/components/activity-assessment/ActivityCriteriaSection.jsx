function criterionKey(criterion) {
  return criterion.id || criterion.clientId;
}

function StudentIdentity({ student }) {
  return (
    <div className="activity-student-identity">
      <span className="simple-avatar">
        {`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}
      </span>
      <span><strong>{student.first_name} {student.last_name}</strong></span>
    </div>
  );
}

function ResultFields({ criterion, student, result, outcomeOptions, resultLabel, onResultChange }) {
  const key = criterionKey(criterion);
  const fullName = `${student.first_name} ${student.last_name}`;

  return (
    <>
      <label className="stack">
        <span>{resultLabel}</span>
        <select
          aria-label={`${criterion.title || "Criterion"} ${resultLabel.toLowerCase()} for ${fullName}`}
          value={result?.outcome || ""}
          onChange={(event) => onResultChange(key, student.id, "outcome", event.target.value)}
        >
          <option value="" disabled={Boolean(result?.id)}>Not assessed yet</option>
          {outcomeOptions.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      </label>
      <label className="stack activity-criterion-note">
        <span>Evidence note (optional)</span>
        <input
          aria-label={`${criterion.title || "Criterion"} evidence for ${fullName}`}
          value={result?.notes || ""}
          onChange={(event) => onResultChange(key, student.id, "notes", event.target.value)}
          placeholder="What did you notice?"
        />
      </label>
    </>
  );
}

function ActivityCriteriaSection({
  criteria,
  students,
  results,
  outcomeOptions,
  resultLabel = "Outcome",
  assessmentMode,
  activeCriterionKey,
  onAssessmentModeChange,
  onActiveCriterionChange,
  onAddCriterion,
  onUpdateCriterion,
  onMoveCriterion,
  onRemoveCriterion,
  onResultChange,
}) {
  const getResult = (criterion, studentId) =>
    results[`${criterionKey(criterion)}:${studentId}`] || null;
  const activeCriterion =
    criteria.find((criterion) => criterionKey(criterion) === activeCriterionKey) || criteria[0];
  const ratedCount = Object.values(results).filter((result) => result?.outcome).length;
  const judgmentCount = criteria.length * students.length;

  const setCriterionForAll = (criterion, outcome) => {
    if (!outcome) return;
    students.forEach((student) => {
      onResultChange(criterionKey(criterion), student.id, "outcome", outcome);
    });
  };

  return (
    <>
      <section className="activity-criteria-card">
        <div className="activity-criteria-heading">
          <div>
            <p className="simple-kicker">Optional mini-rubric</p>
            <h3>What are you assessing?</h3>
            <p>Add the distinct abilities or success criteria you want to observe.</p>
          </div>
          <button type="button" className="secondary" onClick={onAddCriterion}>+ Add criterion</button>
        </div>

        {criteria.length === 0 ? (
          <button
            type="button"
            className="activity-criteria-empty"
            aria-label="Add assessment criteria"
            onClick={onAddCriterion}
          >
            <span aria-hidden="true">＋</span>
            <strong>Add assessment criteria</strong>
            <small>Useful for projects, investigations, presentations, and other multi-skill work.</small>
          </button>
        ) : (
          <div className="activity-criteria-list">
            {criteria.map((criterion, index) => {
              const key = criterionKey(criterion);
              return (
                <article className="activity-criterion-editor" key={key}>
                  <span className="activity-criterion-number" aria-hidden="true">{index + 1}</span>
                  <label className="stack">
                    <span>Criterion</span>
                    <input
                      required
                      value={criterion.title}
                      aria-label={`Criterion ${index + 1} title`}
                      onChange={(event) => onUpdateCriterion(key, "title", event.target.value)}
                      placeholder="e.g. Records observations accurately"
                    />
                  </label>
                  <label className="stack">
                    <span>Description (optional)</span>
                    <input
                      value={criterion.description}
                      aria-label={`Criterion ${index + 1} description`}
                      onChange={(event) => onUpdateCriterion(key, "description", event.target.value)}
                      placeholder="What evidence should you look for?"
                    />
                  </label>
                  <div className="activity-criterion-editor-actions">
                    <button
                      type="button"
                      className="secondary"
                      disabled={index === 0}
                      aria-label={`Move criterion ${index + 1} up`}
                      onClick={() => onMoveCriterion(index, -1)}
                    >↑</button>
                    <button
                      type="button"
                      className="secondary"
                      disabled={index === criteria.length - 1}
                      aria-label={`Move criterion ${index + 1} down`}
                      onClick={() => onMoveCriterion(index, 1)}
                    >↓</button>
                    <button
                      type="button"
                      className="secondary activity-criterion-remove"
                      aria-label={`Remove criterion ${index + 1}`}
                      onClick={() => onRemoveCriterion(key)}
                    >×</button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {criteria.length > 0 && students.length > 0 && (
        <section className="activity-criteria-assessment">
          <div className="activity-criteria-assessment-header">
            <div>
              <p className="simple-kicker">Criterion evidence</p>
              <h3>Assess the abilities you observed</h3>
              <span>{ratedCount} of {judgmentCount} judgments recorded</span>
            </div>
            <div className="activity-criteria-view-toggle" role="group" aria-label="Criteria assessment view">
              <button
                type="button"
                aria-pressed={assessmentMode === "criterion"}
                className={assessmentMode === "criterion" ? "active" : ""}
                onClick={() => onAssessmentModeChange("criterion")}
              >By criterion</button>
              <button
                type="button"
                aria-pressed={assessmentMode === "student"}
                className={assessmentMode === "student" ? "active" : ""}
                onClick={() => onAssessmentModeChange("student")}
              >By student</button>
            </div>
          </div>

          {assessmentMode === "criterion" && activeCriterion && (
            <>
              <div className="activity-criterion-tabs" role="tablist" aria-label="Assessment criteria">
                {criteria.map((criterion, index) => {
                  const key = criterionKey(criterion);
                  const criterionRatedCount = students.filter(
                    (student) => getResult(criterion, student.id)?.outcome
                  ).length;
                  return (
                    <button
                      type="button"
                      role="tab"
                      key={key}
                      aria-selected={key === criterionKey(activeCriterion)}
                      className={key === criterionKey(activeCriterion) ? "active" : ""}
                      onClick={() => onActiveCriterionChange(key)}
                    >
                      <span>{index + 1}. {criterion.title || "Untitled criterion"}</span>
                      <small>{criterionRatedCount}/{students.length}</small>
                    </button>
                  );
                })}
              </div>
              <div className="activity-active-criterion">
                <div>
                  <h4>{activeCriterion.title || "Untitled criterion"}</h4>
                  {activeCriterion.description && <p>{activeCriterion.description}</p>}
                </div>
                <label>
                  <span>Set all {resultLabel.toLowerCase()}s to</span>
                  <select
                    aria-label={`Set ${activeCriterion.title || "criterion"} ${resultLabel.toLowerCase()} for all students`}
                    defaultValue=""
                    onChange={(event) => setCriterionForAll(activeCriterion, event.target.value)}
                  >
                    <option value="" disabled>Choose {resultLabel.toLowerCase()}</option>
                    {outcomeOptions.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="activity-criterion-student-list">
                {students.map((student) => {
                  const result = getResult(activeCriterion, student.id);
                  return (
                    <article className={`activity-criterion-student${result?.outcome ? " assessed" : ""}`} key={student.id}>
                      <StudentIdentity student={student} />
                      <ResultFields
                        criterion={activeCriterion}
                        student={student}
                        result={result}
                        outcomeOptions={outcomeOptions}
                        resultLabel={resultLabel}
                        onResultChange={onResultChange}
                      />
                    </article>
                  );
                })}
              </div>
            </>
          )}

          {assessmentMode === "student" && (
            <div className="activity-criteria-by-student">
              {students.map((student) => (
                <article className="activity-criteria-student-card" key={student.id}>
                  <StudentIdentity student={student} />
                  <div className="activity-criteria-student-results">
                    {criteria.map((criterion) => (
                      <div className="activity-student-criterion-row" key={criterionKey(criterion)}>
                        <div className="activity-student-criterion-copy">
                          <strong>{criterion.title || "Untitled criterion"}</strong>
                          {criterion.description && <small>{criterion.description}</small>}
                        </div>
                        <ResultFields
                          criterion={criterion}
                          student={student}
                          result={getResult(criterion, student.id)}
                          outcomeOptions={outcomeOptions}
                          resultLabel={resultLabel}
                          onResultChange={onResultChange}
                        />
                      </div>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      )}
    </>
  );
}

export { criterionKey };
export default ActivityCriteriaSection;
