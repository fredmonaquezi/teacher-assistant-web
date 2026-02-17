const CLASS_COLUMNS = "id,name,grade_level,school_year,sort_order,created_at";
const STUDENT_COLUMNS = [
  "id",
  "first_name",
  "last_name",
  "gender",
  "class_id",
  "notes",
  "is_participating_well",
  "needs_help",
  "missing_homework",
  "separation_list",
  "sort_order",
  "created_at",
].join(",");

export async function loadCoreWorkspaceRows(supabaseClient) {
  const [{ data: classRows, error: classError }, { data: studentRows, error: studentError }] =
    await Promise.all([
      supabaseClient
        .from("classes")
        .select(CLASS_COLUMNS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabaseClient
        .from("students")
        .select(STUDENT_COLUMNS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
    ]);

  return {
    rows: {
      classRows: classRows ?? [],
      studentRows: studentRows ?? [],
    },
    errors: {
      classError,
      studentError,
    },
  };
}
