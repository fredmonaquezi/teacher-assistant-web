const CLASS_COLUMNS = "id,name,grade_level,school_year,sort_order,created_at";
const LEGACY_STUDENT_COLUMNS = [
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
];
const STUDENT_COLUMNS = [...LEGACY_STUDENT_COLUMNS, "academic_level_override"].join(",");

function readStudents(supabaseClient, columns) {
  return supabaseClient
    .from("students")
    .select(columns)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
}

function isMissingAcademicLevelColumn(error) {
  return error?.code === "42703" || String(error?.message || "").includes("academic_level_override");
}

export async function loadCoreWorkspaceRows(supabaseClient) {
  const [{ data: classRows, error: classError }, initialStudentResult] =
    await Promise.all([
      supabaseClient
        .from("classes")
        .select(CLASS_COLUMNS)
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      readStudents(supabaseClient, STUDENT_COLUMNS),
    ]);
  const studentResult = isMissingAcademicLevelColumn(initialStudentResult.error)
    ? await readStudents(supabaseClient, LEGACY_STUDENT_COLUMNS.join(","))
    : initialStudentResult;
  const { data: studentRows, error: studentError } = studentResult;

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
