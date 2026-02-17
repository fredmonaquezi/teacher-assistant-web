const ATTENDANCE_SESSION_COLUMNS = "id,session_date,title,class_id,created_at";
const ATTENDANCE_ENTRY_COLUMNS = "id,session_id,student_id,status,note,created_at";

export async function loadAttendanceWorkspaceRows(supabaseClient) {
  const [
    { data: sessionRows, error: sessionError },
    { data: entryRows, error: entryError },
  ] = await Promise.all([
    supabaseClient
      .from("attendance_sessions")
      .select(ATTENDANCE_SESSION_COLUMNS)
      .order("session_date", { ascending: false }),
    supabaseClient
      .from("attendance_entries")
      .select(ATTENDANCE_ENTRY_COLUMNS)
      .order("created_at", { ascending: false }),
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
