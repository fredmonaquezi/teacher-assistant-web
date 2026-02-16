import { format, parseISO } from "date-fns";

function CalendarEntryDetailModal({
  activeDiaryEntry,
  selectedDate,
  classes,
  subjects,
  units,
  splitLines,
  onEdit,
  onClose,
}) {
  if (!activeDiaryEntry) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-entry-detail-modal">
        <div className="calendar-day-header">
          <div>
            <h3>
              {units.find((item) => item.id === activeDiaryEntry.unit_id)?.name ||
                subjects.find((item) => item.id === activeDiaryEntry.subject_id)?.name ||
                "Class Entry"}
            </h3>
            <p className="muted">
              {classes.find((item) => item.id === activeDiaryEntry.class_id)?.name || "All Classes"} •{" "}
              {format(parseISO(selectedDate), "PPPP")}
            </p>
          </div>
          <div className="calendar-detail-actions">
            <button type="button" className="secondary" onClick={onEdit}>
              Edit
            </button>
            <button type="button" className="icon-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="calendar-lesson-sheet">
          <section className="calendar-sheet-block">
            <h4>Goals</h4>
            {splitLines(activeDiaryEntry.objectives).length > 0 ? (
              <ol>
                {splitLines(activeDiaryEntry.objectives)
                  .slice(0, 6)
                  .map((goal, idx) => (
                    <li key={`${goal}-${idx}`}>{goal}</li>
                  ))}
              </ol>
            ) : (
              <p className="muted">No goals added.</p>
            )}
          </section>

          <section className="calendar-sheet-grid">
            <article className="calendar-sheet-block">
              <h4>Materials Needed</h4>
              {activeDiaryEntry.materials ? (
                <p>{activeDiaryEntry.materials}</p>
              ) : (
                <p className="muted">No materials listed.</p>
              )}
            </article>
            <article className="calendar-sheet-block">
              <h4>Notes</h4>
              {activeDiaryEntry.notes ? (
                <p>{activeDiaryEntry.notes}</p>
              ) : (
                <p className="muted">No homework/notes added.</p>
              )}
            </article>
          </section>

          <section className="calendar-sheet-block">
            <h4>Class Development</h4>
            {activeDiaryEntry.plan ? (
              <p>{activeDiaryEntry.plan}</p>
            ) : (
              <p className="muted">No plan added.</p>
            )}
          </section>

          <section className="calendar-sheet-block">
            <h4>Day Observations</h4>
            {activeDiaryEntry.notes ? (
              <p>{activeDiaryEntry.notes}</p>
            ) : (
              <p className="muted">No observations recorded.</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default CalendarEntryDetailModal;
