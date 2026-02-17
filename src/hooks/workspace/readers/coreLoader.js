export async function loadCoreWorkspaceRows(supabaseClient) {
  const [
    { data: classRows, error: classError },
    { data: studentRows, error: studentError },
    { data: lessonRows, error: lessonError },
  ] = await Promise.all([
    supabaseClient
      .from("classes")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("students")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient.from("lesson_plans").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    rows: {
      classRows: classRows ?? [],
      studentRows: studentRows ?? [],
      lessonRows: lessonRows ?? [],
    },
    errors: {
      classError,
      studentError,
      lessonError,
    },
  };
}
