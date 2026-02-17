import { format, parseISO } from "date-fns";

function CalendarDiaryEntryModal({
  show,
  title,
  selectedDate,
  onSubmit,
  onCancel,
  formState,
  setFormState,
  effectiveClassId,
  classOptions,
  subjectOptions,
  unitOptions,
  submitLabel,
  calendarTablesReady,
  resetSubjectOnClassChange,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-entry-modal">
        <div className="calendar-entry-modal-header">
          <h3>{title}</h3>
          <p className="calendar-entry-date-chip">{format(parseISO(selectedDate), "PPPP")}</p>
        </div>
        <form onSubmit={onSubmit} className="calendar-entry-form">
          <label className="stack">
            <span>Class</span>
            <select
              value={formState.classId || effectiveClassId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  classId: event.target.value,
                  ...(resetSubjectOnClassChange ? { subjectId: "", unitId: "" } : {}),
                }))
              }
            >
              <option value="">All Classes</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Subject</span>
            <select
              value={formState.subjectId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, subjectId: event.target.value, unitId: "" }))
              }
            >
              <option value="">None</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Unit</span>
            <select
              value={formState.unitId}
              onChange={(event) => setFormState((prev) => ({ ...prev, unitId: event.target.value }))}
            >
              <option value="">None</option>
              {unitOptions.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <div className="calendar-time-grid">
            <label className="stack">
              <span>Start Time</span>
              <input
                type="time"
                value={formState.startTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </label>
            <label className="stack">
              <span>End Time</span>
              <input
                type="time"
                value={formState.endTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </label>
          </div>
          <label className="stack">
            <span>Plan</span>
            <input
              value={formState.plan}
              onChange={(event) => setFormState((prev) => ({ ...prev, plan: event.target.value }))}
              placeholder="What will be taught"
            />
          </label>
          <label className="stack">
            <span>Objectives</span>
            <textarea
              rows="2"
              value={formState.objectives}
              onChange={(event) => setFormState((prev) => ({ ...prev, objectives: event.target.value }))}
              placeholder="Learning goals"
            />
          </label>
          <label className="stack calendar-entry-field-full">
            <span>Materials</span>
            <textarea
              rows="2"
              value={formState.materials}
              onChange={(event) => setFormState((prev) => ({ ...prev, materials: event.target.value }))}
              placeholder="Books, slides, worksheets..."
            />
          </label>
          <label className="stack calendar-entry-field-full">
            <span>Notes</span>
            <textarea
              rows="2"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Optional notes"
            />
          </label>
          <div className="modal-actions calendar-entry-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" disabled={!calendarTablesReady}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarDiaryEntryModal;
