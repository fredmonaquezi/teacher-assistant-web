import { useState } from "react";
import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isToday,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { DayPicker } from "react-day-picker";
import { useSearchParams } from "react-router-dom";
import { supabase } from "../supabaseClient";

const CalendarPage = ({
  formError,
  setFormError,
  loadData,
  classOptions,
  calendarDiaryEntries,
  calendarEvents,
  calendarTablesReady,
  classes,
  subjects,
  units,
}) => {
    const calendarSetupMessage =
      "Calendar tables are not set up yet. Run /Users/fred/Documents/teacher-assistant-web/supabase_calendar_tables.sql in Supabase SQL Editor, then refresh.";
    const [searchParams] = useSearchParams();
    const classId = searchParams.get("classId") || "";
    const [activeClassId, setActiveClassId] = useState("");
    const effectiveClassId = classId || activeClassId;
    const [viewMode, setViewMode] = useState("month");
    const [anchorDate, setAnchorDate] = useState(new Date());
    const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [showDayDetail, setShowDayDetail] = useState(false);
    const [showNewEntry, setShowNewEntry] = useState(false);
    const [showNewEvent, setShowNewEvent] = useState(false);
    const [newEntry, setNewEntry] = useState({
      classId: "",
      subjectId: "",
      unitId: "",
      startTime: "",
      endTime: "",
      plan: "",
      objectives: "",
      materials: "",
      notes: "",
    });
    const [newEvent, setNewEvent] = useState({
      classId: "",
      title: "",
      details: "",
      isAllDay: false,
      startTime: "",
      endTime: "",
    });

    const activeClassLabel = classOptions.find((option) => option.id === effectiveClassId)?.label || "";

    const filteredDiaryEntries = effectiveClassId
      ? calendarDiaryEntries.filter((entry) => entry.class_id === effectiveClassId)
      : calendarDiaryEntries;
    const filteredEvents = effectiveClassId
      ? calendarEvents.filter((item) => item.class_id === effectiveClassId)
      : calendarEvents;

    const subjectOptionsForEntryClass = subjects.filter(
      (subject) => subject.class_id === (newEntry.classId || effectiveClassId || null)
    );
    const unitOptionsForEntrySubject = units.filter((unit) => unit.subject_id === newEntry.subjectId);

    const monthTitle = viewMode === "month" ? format(anchorDate, "LLLL yyyy") : format(anchorDate, "PPP");
    const dayItems = filteredDiaryEntries
      .filter((item) => item.entry_date === selectedDate)
      .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));
    const dayEvents = filteredEvents
      .filter((item) => item.event_date === selectedDate)
      .sort((a, b) => {
        if (!!a.is_all_day !== !!b.is_all_day) return a.is_all_day ? -1 : 1;
        return (a.start_time || "").localeCompare(b.start_time || "");
      });

    const upcomingEvents = filteredEvents
      .filter((item) => item.event_date >= format(new Date(), "yyyy-MM-dd"))
      .sort((a, b) => a.event_date.localeCompare(b.event_date))
      .slice(0, 5);

    const intervalDays =
      viewMode === "month"
        ? eachDayOfInterval({
            start: startOfWeek(startOfMonth(anchorDate)),
            end: endOfWeek(endOfMonth(anchorDate)),
          })
        : eachDayOfInterval({
            start: startOfWeek(anchorDate),
            end: endOfWeek(anchorDate),
          });

    const diaryForDay = (dateObj) =>
      filteredDiaryEntries.filter((item) => item.entry_date === format(dateObj, "yyyy-MM-dd"));
    const eventsForDay = (dateObj) =>
      filteredEvents.filter((item) => item.event_date === format(dateObj, "yyyy-MM-dd"));

    const mergeDateTime = (dateString, timeString) =>
      timeString ? `${dateString}T${timeString}:00` : null;

    const navigatePeriod = (delta) => {
      setAnchorDate((prev) => (viewMode === "month" ? addMonths(prev, delta) : addWeeks(prev, delta)));
    };

    const handleCreateDiaryEntry = async (event) => {
      event.preventDefault();
      setFormError("");

      if (!calendarTablesReady) {
        setFormError(calendarSetupMessage);
        return;
      }

      const payload = {
        entry_date: selectedDate,
        class_id: newEntry.classId || effectiveClassId || null,
        subject_id: newEntry.subjectId || null,
        unit_id: newEntry.unitId || null,
        start_time: mergeDateTime(selectedDate, newEntry.startTime),
        end_time: mergeDateTime(selectedDate, newEntry.endTime),
        plan: newEntry.plan.trim() || null,
        objectives: newEntry.objectives.trim() || null,
        materials: newEntry.materials.trim() || null,
        notes: newEntry.notes.trim() || null,
      };

      if (!payload.class_id) {
        setFormError("Select a class for the diary entry.");
        return;
      }

      const { error } = await supabase.from("calendar_diary_entries").insert(payload);
      if (error) {
        setFormError(error.message);
        return;
      }

      setNewEntry({
        classId: "",
        subjectId: "",
        unitId: "",
        startTime: "",
        endTime: "",
        plan: "",
        objectives: "",
        materials: "",
        notes: "",
      });
      setShowNewEntry(false);
      await loadData();
    };

    const handleDeleteDiaryEntry = async (entryId) => {
      if (!entryId) return;
      if (!window.confirm("Delete this diary entry?")) return;
      setFormError("");
      const { error } = await supabase.from("calendar_diary_entries").delete().eq("id", entryId);
      if (error) {
        setFormError(error.message);
        return;
      }
      await loadData();
    };

    const handleCreateEvent = async (event) => {
      event.preventDefault();
      setFormError("");

      if (!calendarTablesReady) {
        setFormError(calendarSetupMessage);
        return;
      }

      const payload = {
        event_date: selectedDate,
        class_id: newEvent.classId || effectiveClassId || null,
        title: newEvent.title.trim(),
        details: newEvent.details.trim() || null,
        is_all_day: !!newEvent.isAllDay,
        start_time: newEvent.isAllDay ? null : mergeDateTime(selectedDate, newEvent.startTime),
        end_time: newEvent.isAllDay ? null : mergeDateTime(selectedDate, newEvent.endTime),
      };

      if (!payload.title) {
        setFormError("Event title is required.");
        return;
      }

      const { error } = await supabase.from("calendar_events").insert(payload);
      if (error) {
        setFormError(error.message);
        return;
      }

      setNewEvent({
        classId: "",
        title: "",
        details: "",
        isAllDay: false,
        startTime: "",
        endTime: "",
      });
      setShowNewEvent(false);
      await loadData();
    };

    const handleDeleteEvent = async (eventId) => {
      if (!eventId) return;
      if (!window.confirm("Delete this event?")) return;
      setFormError("");
      const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
      if (error) {
        setFormError(error.message);
        return;
      }
      await loadData();
    };

    return (
      <>
        {formError && <div className="error">{formError}</div>}
        {!calendarTablesReady && <div className="error">{calendarSetupMessage}</div>}
        <section className="panel calendar-page">
          <div className="calendar-header">
            <button type="button" className="icon-button" onClick={() => navigatePeriod(-1)}>
              ‹
            </button>
            <h2>{monthTitle}</h2>
            <button type="button" className="icon-button" onClick={() => navigatePeriod(1)}>
              ›
            </button>
          </div>

          <div className="calendar-toolbar">
            <div className="calendar-mode">
              <button
                type="button"
                className={viewMode === "month" ? "active" : ""}
                onClick={() => setViewMode("month")}
              >
                Month
              </button>
              <button
                type="button"
                className={viewMode === "week" ? "active" : ""}
                onClick={() => setViewMode("week")}
              >
                Week
              </button>
            </div>
            <div className="calendar-filters">
              {!classId && (
                <select value={activeClassId} onChange={(event) => setActiveClassId(event.target.value)}>
                  <option value="">All Classes</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {classId && <span className="badge">Class: {activeClassLabel || "Selected class"}</span>}
              <button
                type="button"
                onClick={() => {
                  setAnchorDate(new Date());
                  setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                }}
              >
                Today
              </button>
            </div>
          </div>

          <div className={`calendar-grid ${viewMode}`}>
            {intervalDays.map((dateObj) => {
              const cellLessons = diaryForDay(dateObj);
              const cellEvents = eventsForDay(dateObj);
              const dayLabel = format(dateObj, "d");
              const dayKey = format(dateObj, "yyyy-MM-dd");
              const selected = dayKey === selectedDate;
              const inMonth = format(dateObj, "M") === format(anchorDate, "M");
              const previews = [...cellEvents.slice(0, 2), ...cellLessons.slice(0, 2)];
              const remaining = cellEvents.length + cellLessons.length - previews.length;

              return (
                <button
                  key={dayKey}
                  type="button"
                  className={`calendar-day ${selected ? "selected" : ""} ${inMonth ? "" : "outside"}`}
                  onClick={() => {
                    setSelectedDate(dayKey);
                    setShowDayDetail(true);
                  }}
                >
                  <div className="calendar-day-top">
                    <span>{dayLabel}</span>
                    {isToday(dateObj) && <span className="calendar-dot" />}
                  </div>
                  <div className="calendar-day-list">
                    {previews.map((item) => {
                      const entryLabel =
                        units.find((unit) => unit.id === item.unit_id)?.name ||
                        subjects.find((subject) => subject.id === item.subject_id)?.name ||
                        classes.find((classItem) => classItem.id === item.class_id)?.name ||
                        "Diary Entry";
                      const title = item.title || entryLabel;
                      return (
                      <span
                        key={item.id}
                        className={item.title ? "event" : "entry"}
                        title={title}
                      >
                        {title}
                      </span>
                    );
                    })}
                    {remaining > 0 && <span className="more">+{remaining}</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        <section className="panel calendar-upcoming">
          <h3>Upcoming Alerts</h3>
          {upcomingEvents.length === 0 ? (
            <p className="muted">No upcoming alerts.</p>
          ) : (
            <ul className="list">
              {upcomingEvents.map((item) => (
                <li key={item.id}>
                  <strong>{item.title}</strong> • {item.event_date}
                </li>
              ))}
            </ul>
          )}
        </section>

        {showDayDetail && (
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
                  <button
                    type="button"
                    onClick={() => {
                      if (!calendarTablesReady) {
                        setFormError(calendarSetupMessage);
                        return;
                      }
                      setShowNewEntry(true);
                    }}
                  >
                    + Add Entry
                  </button>
                </div>
                {dayItems.length === 0 ? (
                  <p className="muted">No diary entries for this day.</p>
                ) : (
                  <div className="calendar-day-cards">
                    {dayItems.map((entry) => {
                      const className =
                        classes.find((item) => item.id === entry.class_id)?.name || "All Classes";
                      return (
                        <article key={entry.id} className="calendar-entry-card">
                          <div className="calendar-entry-top">
                            <strong>
                              {units.find((item) => item.id === entry.unit_id)?.name ||
                                subjects.find((item) => item.id === entry.subject_id)?.name ||
                                "Diary Entry"}
                            </strong>
                            <button
                              type="button"
                              className="icon-button"
                              onClick={() => handleDeleteDiaryEntry(entry.id)}
                            >
                              🗑
                            </button>
                          </div>
                          <p className="muted">{className}</p>
                          {(entry.start_time || entry.end_time) && (
                            <p className="muted">
                              {[entry.start_time && format(parseISO(entry.start_time), "p"), entry.end_time && format(parseISO(entry.end_time), "p")]
                                .filter(Boolean)
                                .join(" – ")}
                            </p>
                          )}
                          {entry.plan && <p>{entry.plan}</p>}
                          {entry.objectives && <p className="muted">Objectives: {entry.objectives}</p>}
                          {entry.materials && <p className="muted">Materials: {entry.materials}</p>}
                          {entry.notes && <p className="muted">Notes: {entry.notes}</p>}
                        </article>
                      );
                    })}
                  </div>
                )}
              </div>

              <div className="calendar-day-section">
                <div className="calendar-day-section-title">
                  <h4>Events & Alerts</h4>
                  <button
                    type="button"
                    onClick={() => {
                      if (!calendarTablesReady) {
                        setFormError(calendarSetupMessage);
                        return;
                      }
                      setShowNewEvent(true);
                    }}
                  >
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
                          <button
                            type="button"
                            className="icon-button"
                            onClick={() => handleDeleteEvent(item.id)}
                          >
                            🗑
                          </button>
                        </div>
                        <p className="muted">
                          {item.is_all_day
                            ? "All day"
                            : [item.start_time && format(parseISO(item.start_time), "p"), item.end_time && format(parseISO(item.end_time), "p")]
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
        )}

        {showNewEntry && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>New Diary Entry</h3>
              <p className="muted">{format(parseISO(selectedDate), "PPPP")}</p>
              <form onSubmit={handleCreateDiaryEntry} className="grid">
                <label className="stack">
                  <span>Class</span>
                  <select
                    value={newEntry.classId || effectiveClassId}
                    onChange={(event) => setNewEntry((prev) => ({ ...prev, classId: event.target.value }))}
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
                    value={newEntry.subjectId}
                    onChange={(event) =>
                      setNewEntry((prev) => ({ ...prev, subjectId: event.target.value, unitId: "" }))
                    }
                  >
                    <option value="">None</option>
                    {subjectOptionsForEntryClass.map((subject) => (
                      <option key={subject.id} value={subject.id}>
                        {subject.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="stack">
                  <span>Unit</span>
                  <select
                    value={newEntry.unitId}
                    onChange={(event) => setNewEntry((prev) => ({ ...prev, unitId: event.target.value }))}
                  >
                    <option value="">None</option>
                    {unitOptionsForEntrySubject.map((unit) => (
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
                      value={newEntry.startTime}
                      onChange={(event) =>
                        setNewEntry((prev) => ({ ...prev, startTime: event.target.value }))
                      }
                    />
                  </label>
                  <label className="stack">
                    <span>End Time</span>
                    <input
                      type="time"
                      value={newEntry.endTime}
                      onChange={(event) =>
                        setNewEntry((prev) => ({ ...prev, endTime: event.target.value }))
                      }
                    />
                  </label>
                </div>
                <label className="stack">
                  <span>Plan</span>
                  <input
                    value={newEntry.plan}
                    onChange={(event) => setNewEntry((prev) => ({ ...prev, plan: event.target.value }))}
                    placeholder="What will be taught"
                  />
                </label>
                <label className="stack">
                  <span>Objectives</span>
                  <textarea
                    rows="2"
                    value={newEntry.objectives}
                    onChange={(event) =>
                      setNewEntry((prev) => ({ ...prev, objectives: event.target.value }))
                    }
                    placeholder="Learning goals"
                  />
                </label>
                <label className="stack">
                  <span>Materials</span>
                  <textarea
                    rows="2"
                    value={newEntry.materials}
                    onChange={(event) =>
                      setNewEntry((prev) => ({ ...prev, materials: event.target.value }))
                    }
                    placeholder="Books, slides, worksheets..."
                  />
                </label>
                <label className="stack">
                  <span>Notes</span>
                  <textarea
                    rows="2"
                    value={newEntry.notes}
                    onChange={(event) => setNewEntry((prev) => ({ ...prev, notes: event.target.value }))}
                    placeholder="Optional notes"
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setShowNewEntry(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!calendarTablesReady}>
                    Save
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showNewEvent && (
          <div className="modal-overlay">
            <div className="modal-card">
              <h3>New Event</h3>
              <p className="muted">{format(parseISO(selectedDate), "PPPP")}</p>
              <form onSubmit={handleCreateEvent} className="grid">
                <label className="stack">
                  <span>Class</span>
                  <select
                    value={newEvent.classId || effectiveClassId}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, classId: event.target.value }))}
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
                    value={newEvent.title}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, title: event.target.value }))}
                    placeholder="Event title"
                    required
                  />
                </label>
                <label className="checkbox">
                  <input
                    type="checkbox"
                    checked={newEvent.isAllDay}
                    onChange={(event) =>
                      setNewEvent((prev) => ({ ...prev, isAllDay: event.target.checked }))
                    }
                  />
                  All day
                </label>
                {!newEvent.isAllDay && (
                  <div className="calendar-time-grid">
                    <label className="stack">
                      <span>Start Time</span>
                      <input
                        type="time"
                        value={newEvent.startTime}
                        onChange={(event) =>
                          setNewEvent((prev) => ({ ...prev, startTime: event.target.value }))
                        }
                      />
                    </label>
                    <label className="stack">
                      <span>End Time</span>
                      <input
                        type="time"
                        value={newEvent.endTime}
                        onChange={(event) =>
                          setNewEvent((prev) => ({ ...prev, endTime: event.target.value }))
                        }
                      />
                    </label>
                  </div>
                )}
                <label className="stack">
                  <span>Details</span>
                  <textarea
                    rows="3"
                    value={newEvent.details}
                    onChange={(event) => setNewEvent((prev) => ({ ...prev, details: event.target.value }))}
                    placeholder="Optional details"
                  />
                </label>
                <div className="modal-actions">
                  <button type="button" className="secondary" onClick={() => setShowNewEvent(false)}>
                    Cancel
                  </button>
                  <button type="submit" disabled={!calendarTablesReady}>
                    Save Event
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </>
    );
  };


export default CalendarPage;
