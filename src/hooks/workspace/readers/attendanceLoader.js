export async function loadAttendanceWorkspaceRows(supabaseClient) {
  const [
    { data: sessionRows, error: sessionError },
    { data: entryRows, error: entryError },
  ] = await Promise.all([
    supabaseClient.from("attendance_sessions").select("*").order("session_date", { ascending: false }),
    supabaseClient.from("attendance_entries").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    rows: {
      sessionRows: sessionRows ?? [],
      entryRows: entryRows ?? [],
    },
    errors: {
      sessionError,
      entryError,
    },
  };
}
