import { supabase } from "../../../supabaseClient";

function createCalendarActions({ setFormError, loadData }) {
  const handleCreateCalendarDiaryEntry = async (payload) => {
    setFormError("");

    const { error } = await supabase.from("calendar_diary_entries").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const handleUpdateCalendarDiaryEntry = async (entryId, payload) => {
    if (!entryId) return false;
    setFormError("");

    const { error } = await supabase
      .from("calendar_diary_entries")
      .update(payload)
      .eq("id", entryId);

    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const handleDeleteCalendarDiaryEntry = async (entryId) => {
    if (!entryId) return false;
    setFormError("");

    const { error } = await supabase.from("calendar_diary_entries").delete().eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const handleCreateCalendarEvent = async (payload) => {
    setFormError("");

    const { error } = await supabase.from("calendar_events").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const handleDeleteCalendarEvent = async (eventId) => {
    if (!eventId) return false;
    setFormError("");

    const { error } = await supabase.from("calendar_events").delete().eq("id", eventId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
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
