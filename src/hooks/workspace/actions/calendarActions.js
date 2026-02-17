import { supabase } from "../../../supabaseClient";
import { applyOptimisticState, runOptimisticMutation } from "./mutationHelpers";

function createCalendarActions({
  setCalendarDiaryEntries,
  setCalendarEvents,
  setFormError,
  refreshCalendarData,
}) {
  const createTempId = (prefix) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const handleCreateCalendarDiaryEntry = async (payload) => {
    const optimisticRow = {
      ...payload,
      id: createTempId("calendar-diary"),
    };
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setCalendarDiaryEntries, (currentEntries) => [
          ...currentEntries,
          optimisticRow,
        ]),
      execute: () => supabase.from("calendar_diary_entries").insert(payload),
      refresh: refreshCalendarData,
      fallbackErrorMessage: "Failed to create diary entry.",
    });
  };

  const handleUpdateCalendarDiaryEntry = async (entryId, payload) => {
    if (!entryId) return false;
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setCalendarDiaryEntries, (currentEntries) =>
          currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...payload } : entry))
        ),
      execute: () => supabase.from("calendar_diary_entries").update(payload).eq("id", entryId),
      refresh: refreshCalendarData,
      fallbackErrorMessage: "Failed to update diary entry.",
    });
  };

  const handleDeleteCalendarDiaryEntry = async (entryId) => {
    if (!entryId) return false;
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setCalendarDiaryEntries, (currentEntries) =>
          currentEntries.filter((entry) => entry.id !== entryId)
        ),
      execute: () => supabase.from("calendar_diary_entries").delete().eq("id", entryId),
      refresh: refreshCalendarData,
      fallbackErrorMessage: "Failed to delete diary entry.",
    });
  };

  const handleCreateCalendarEvent = async (payload) => {
    const optimisticEvent = {
      ...payload,
      id: createTempId("calendar-event"),
    };
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setCalendarEvents, (currentEvents) => [...currentEvents, optimisticEvent]),
      execute: () => supabase.from("calendar_events").insert(payload),
      refresh: refreshCalendarData,
      fallbackErrorMessage: "Failed to create calendar event.",
    });
  };

  const handleDeleteCalendarEvent = async (eventId) => {
    if (!eventId) return false;
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setCalendarEvents, (currentEvents) =>
          currentEvents.filter((eventRow) => eventRow.id !== eventId)
        ),
      execute: () => supabase.from("calendar_events").delete().eq("id", eventId),
      refresh: refreshCalendarData,
      fallbackErrorMessage: "Failed to delete calendar event.",
    });
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
