const SUBJECT_COLUMNS = "id,class_id,name,description,sort_order,created_at";

export async function fetchSubjects(supabaseClient) {
  const { data: subjectRows, error: subjectError } = await supabaseClient
    .from("subjects")
    .select(SUBJECT_COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });

  return {
    rows: { subjectRows: subjectRows ?? [] },
    errors: { subjectError },
  };
}
