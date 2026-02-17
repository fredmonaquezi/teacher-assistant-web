import { format, parseISO } from "date-fns";

function CalendarDayDetailModal({
  showDayDetail,
  selectedDate,
  setShowDayDetail,
  dayItems,
  dayEvents,
  classes,
  subjects,
  units,
  handleDeleteDiaryEntry,
  setActiveDiaryEntry,
  handleDeleteEvent,
  openNewEntryForm,
  openNewEventForm,
}) {
  if (!showDayDetail) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-day-modal">
        <div className="calendar-day-header">
          <div>
            <h3>{format(parseISO(selectedDate), "EEE")}</h3>
            <p className="muted">{format(parseISO(selectedDate), "PPPP")}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => setShowDayDetail(false)}>
            ×
          </button>
        </div>

        <div className="calendar-day-section">
          <div className="calendar-day-section-title">
            <h4>Class Diary</h4>
            <button type="button" onClick={openNewEntryForm}>
              + Add Entry
            </button>
          </div>
          {dayItems.length === 0 ? (
            <p className="muted">No diary entries for this day.</p>
          ) : (
            <div className="calendar-day-cards">
              {dayItems.map((entry) => {
                const className = classes.find((item) => item.id === entry.class_id)?.name || "All Classes";
                return (
                  <article key={entry.id} className="calendar-entry-card">
                    <div className="calendar-entry-top">
                      <button
                        type="button"
                        className="calendar-entry-summary-btn"
                        onClick={() => setActiveDiaryEntry(entry)}
                      >
                        <strong>
                          {units.find((item) => item.id === entry.unit_id)?.name ||
                            subjects.find((item) => item.id === entry.subject_id)?.name ||
                            "Class Entry"}
                        </strong>
                        <p className="muted">{className}</p>
                        <p className="calendar-entry-basic">
                          {format(parseISO(selectedDate), "EEE, MMM d")} •{" "}
                          {entry.start_time || entry.end_time
                            ? [
                                entry.start_time && format(parseISO(entry.start_time), "p"),
                                entry.end_time && format(parseISO(entry.end_time), "p"),
                              ]
                                .filter(Boolean)
                                .join(" – ")
                            : "Time not set"}
                        </p>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleDeleteDiaryEntry(entry.id)}
                        aria-label="Delete diary entry"
                      >
                        🗑
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="calendar-day-section">
          <div className="calendar-day-section-title">
            <h4>Events & Alerts</h4>
            <button type="button" onClick={openNewEventForm}>
              + Add Event
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="muted">No events for this day.</p>
          ) : (
            <div className="calendar-day-cards">
              {dayEvents.map((item) => (
                <article key={item.id} className="calendar-event-card">
                  <div className="calendar-entry-top">
                    <strong>{item.title}</strong>
                    <button type="button" className="icon-button" onClick={() => handleDeleteEvent(item.id)}>
                      🗑
                    </button>
                  </div>
                  <p className="muted">
                    {item.is_all_day
                      ? "All day"
                      : [
                          item.start_time && format(parseISO(item.start_time), "p"),
                          item.end_time && format(parseISO(item.end_time), "p"),
                        ]
                          .filter(Boolean)
                          .join(" – ")}
                  </p>
                  {item.details && <p>{item.details}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarDayDetailModal;
