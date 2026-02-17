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
      .select("*")
      .order("sort_order", { ascending: true })
      .order("assessment_date", { ascending: false }),
    supabaseClient.from("assessment_entries").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("running_records").select("*").order("record_date", { ascending: false }),
    supabaseClient
      .from("subjects")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("units")
      .select("*")
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
