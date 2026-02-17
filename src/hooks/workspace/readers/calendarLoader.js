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
      supabaseClient.from("calendar_diary_entries").select("*").order("entry_date", { ascending: false }),
      supabaseClient.from("calendar_events").select("*").order("event_date", { ascending: false }),
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
