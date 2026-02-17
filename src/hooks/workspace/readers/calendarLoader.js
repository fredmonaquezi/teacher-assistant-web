const CALENDAR_DIARY_COLUMNS = [
  "id",
  "entry_date",
  "class_id",
  "subject_id",
  "unit_id",
  "start_time",
  "end_time",
  "plan",
  "objectives",
  "materials",
  "notes",
  "created_at",
].join(",");
const CALENDAR_EVENT_COLUMNS = [
  "id",
  "event_date",
  "class_id",
  "title",
  "details",
  "is_all_day",
  "start_time",
  "end_time",
  "created_at",
].join(",");

function isMissingTableError(error) {
  return (
    !!error &&
    (error.code === "42P01" ||
      /does not exist|Could not find the table|schema cache/i.test(error.message || ""))
  );
}

export async function loadCalendarWorkspaceRows(supabaseClient) {
  const [{ data: diaryRows, error: diaryError }, { data: eventRows, error: eventError }] =
    await Promise.all([
      supabaseClient
        .from("calendar_diary_entries")
        .select(CALENDAR_DIARY_COLUMNS)
        .order("entry_date", { ascending: false }),
      supabaseClient
        .from("calendar_events")
        .select(CALENDAR_EVENT_COLUMNS)
        .order("event_date", { ascending: false }),
    ]);

  const diaryMissing = isMissingTableError(diaryError);
  const eventMissing = isMissingTableError(eventError);

  return {
    rows: {
      diaryRows: diaryRows ?? [],
      eventRows: eventRows ?? [],
    },
    errors: {
      diaryError,
      eventError,
    },
    missing: {
      diaryMissing,
      eventMissing,
    },
    tablesReady: !diaryMissing && !eventMissing,
  };
}
