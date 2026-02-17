import { supabase } from "../../../supabaseClient";

function createCalendarActions({
  setCalendarDiaryEntries,
  setCalendarEvents,
  setFormError,
  refreshCalendarData,
}) {
  const createTempId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleCreateCalendarDiaryEntry = async (payload) => {
    setFormError("");

    let previousEntries = null;
    const optimisticRow = {
      ...payload,
      id: createTempId("calendar-diary"),
    };
    setCalendarDiaryEntries((currentEntries) => {
      previousEntries = currentEntries;
      return [...currentEntries, optimisticRow];
    });

    const { error } = await supabase.from("calendar_diary_entries").insert(payload);
    if (error) {
      if (previousEntries) {
        setCalendarDiaryEntries(previousEntries);
      }
      setFormError(error.message);
      return false;
    }

    await refreshCalendarData();
    return true;
  };

  const handleUpdateCalendarDiaryEntry = async (entryId, payload) => {
    if (!entryId) return false;
    setFormError("");

    let previousEntries = null;
    setCalendarDiaryEntries((currentEntries) => {
      previousEntries = currentEntries;
      return currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...payload } : entry));
    });

    const { error } = await supabase
      .from("calendar_diary_entries")
      .update(payload)
      .eq("id", entryId);

    if (error) {
      if (previousEntries) {
        setCalendarDiaryEntries(previousEntries);
      }
      setFormError(error.message);
      return false;
    }

    await refreshCalendarData();
    return true;
  };

  const handleDeleteCalendarDiaryEntry = async (entryId) => {
    if (!entryId) return false;
    setFormError("");

    let previousEntries = null;
    setCalendarDiaryEntries((currentEntries) => {
      previousEntries = currentEntries;
      return currentEntries.filter((entry) => entry.id !== entryId);
    });

    const { error } = await supabase.from("calendar_diary_entries").delete().eq("id", entryId);
    if (error) {
      if (previousEntries) {
        setCalendarDiaryEntries(previousEntries);
      }
      setFormError(error.message);
      return false;
    }

    await refreshCalendarData();
    return true;
  };

  const handleCreateCalendarEvent = async (payload) => {
    setFormError("");

    let previousEvents = null;
    const optimisticEvent = {
      ...payload,
      id: createTempId("calendar-event"),
    };
    setCalendarEvents((currentEvents) => {
      previousEvents = currentEvents;
      return [...currentEvents, optimisticEvent];
    });

    const { error } = await supabase.from("calendar_events").insert(payload);
    if (error) {
      if (previousEvents) {
        setCalendarEvents(previousEvents);
      }
      setFormError(error.message);
      return false;
    }

    await refreshCalendarData();
    return true;
  };

  const handleDeleteCalendarEvent = async (eventId) => {
    if (!eventId) return false;
    setFormError("");

    let previousEvents = null;
    setCalendarEvents((currentEvents) => {
      previousEvents = currentEvents;
      return currentEvents.filter((eventRow) => eventRow.id !== eventId);
    });

    const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
    if (error) {
      if (previousEvents) {
        setCalendarEvents(previousEvents);
      }
      setFormError(error.message);
      return false;
    }

    await refreshCalendarData();
    return true;
  };

  return {
    handleCreateCalendarDiaryEntry,
    handleUpdateCalendarDiaryEntry,
    handleDeleteCalendarDiaryEntry,
    handleCreateCalendarEvent,
    handleDeleteCalendarEvent,
  };
}

export default createCalendarActions;
