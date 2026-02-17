const ASSESSMENT_COLUMNS = "id,title,assessment_date,max_score,notes,class_id,subject_id,unit_id,sort_order,created_at";
const ASSESSMENT_ENTRY_COLUMNS = "id,assessment_id,student_id,score,notes,created_at";
const RUNNING_RECORD_COLUMNS = [
  "id",
  "student_id",
  "record_date",
  "text_title",
  "total_words",
  "errors",
  "self_corrections",
  "accuracy_pct",
  "level",
  "sc_ratio",
  "notes",
  "created_at",
].join(",");
const SUBJECT_COLUMNS = "id,class_id,name,description,sort_order,created_at";
const UNIT_COLUMNS = "id,subject_id,name,description,sort_order,created_at";

export async function loadAssessmentWorkspaceRows(supabaseClient) {
  const [
    { data: assessmentRows, error: assessmentError },
    { data: assessmentEntryRows, error: assessmentEntryError },
    { data: runningRecordRows, error: runningRecordError },
    { data: subjectRows, error: subjectError },
    { data: unitRows, error: unitError },
  ] = await Promise.all([
    supabaseClient
      .from("assessments")
      .select(ASSESSMENT_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("assessment_date", { ascending: false }),
    supabaseClient
      .from("assessment_entries")
      .select(ASSESSMENT_ENTRY_COLUMNS)
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("running_records")
      .select(RUNNING_RECORD_COLUMNS)
      .order("record_date", { ascending: false }),
    supabaseClient
      .from("subjects")
      .select(SUBJECT_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("units")
      .select(UNIT_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  return {
    rows: {
      assessmentRows: assessmentRows ?? [],
      assessmentEntryRows: assessmentEntryRows ?? [],
      runningRecordRows: runningRecordRows ?? [],
      subjectRows: subjectRows ?? [],
      unitRows: unitRows ?? [],
    },
    errors: {
      assessmentError,
      assessmentEntryError,
      runningRecordError,
      subjectError,
      unitError,
    },
  };
}
