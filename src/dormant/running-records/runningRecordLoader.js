const RUNNING_RECORD_COLUMNS = [
  "id",
  "student_id",
  "record_date",
  "text_title",
  "book_level",
  "total_words",
  "errors",
  "self_corrections",
  "accuracy_pct",
  "level",
  "sc_ratio",
  "notes",
  "created_at",
].join(",");

export async function loadRunningRecordRows(supabaseClient) {
  const { data, error } = await supabaseClient
    .from("running_records")
    .select(RUNNING_RECORD_COLUMNS)
    .order("record_date", { ascending: false });

  return { rows: data ?? [], error };
}
