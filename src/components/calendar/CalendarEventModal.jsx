import { format, parseISO } from "date-fns";

function CalendarEventModal({
  show,
  selectedDate,
  onSubmit,
  onCancel,
  formState,
  setFormState,
  effectiveClassId,
  classOptions,
  calendarTablesReady,
}) {
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-event-modal">
        <div className="calendar-entry-modal-header">
          <h3>New Event</h3>
          <p className="calendar-entry-date-chip">{format(parseISO(selectedDate), "PPPP")}</p>
        </div>
        <form onSubmit={onSubmit} className="calendar-event-form">
          <label className="stack">
            <span>Class</span>
            <select
              value={formState.classId || effectiveClassId}
              onChange={(event) => setFormState((prev) => ({ ...prev, classId: event.target.value }))}
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
            <span>Title</span>
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder="Event title"
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.isAllDay}
              onChange={(event) => setFormState((prev) => ({ ...prev, isAllDay: event.target.checked }))}
            />
            All day
          </label>
          {!formState.isAllDay && (
            <div className="calendar-time-grid calendar-event-time-grid">
              <label className="stack">
                <span>Start Time</span>
                <input
                  type="time"
                  value={formState.startTime}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>End Time</span>
                <input
                  type="time"
                  value={formState.endTime}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                />
              </label>
            </div>
          )}
          <label className="stack calendar-entry-field-full">
            <span>Details</span>
            <textarea
              rows="3"
              value={formState.details}
              onChange={(event) => setFormState((prev) => ({ ...prev, details: event.target.value }))}
              placeholder="Optional details"
            />
          </label>
          <div className="modal-actions calendar-entry-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" disabled={!calendarTablesReady}>
              Save Event
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarEventModal;
