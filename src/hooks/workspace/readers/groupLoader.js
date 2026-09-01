const GROUP_COLUMNS = "id,name,class_id,created_at";
const GROUP_MEMBER_COLUMNS = "id,group_id,student_id,created_at";
const GROUP_CONSTRAINT_COLUMNS = "id,student_a,student_b,created_at";
const ACTIVITY_ASSESSMENT_COLUMNS = "id,class_id,subject_id,activity_date,created_at";
const ACTIVITY_ASSESSMENT_ENTRY_COLUMNS =
  "id,activity_assessment_id,student_id,outcome,created_at";

export async function loadGroupWorkspaceRows(supabaseClient) {
  const [
    { data: groupRows, error: groupError },
    { data: groupMemberRows, error: groupMemberError },
    { data: constraintRows, error: constraintError },
    { data: activityAssessmentRows, error: activityAssessmentError },
    { data: activityAssessmentEntryRows, error: activityAssessmentEntryError },
  ] = await Promise.all([
    supabaseClient.from("groups").select(GROUP_COLUMNS).order("created_at", { ascending: false }),
    supabaseClient
      .from("group_members")
      .select(GROUP_MEMBER_COLUMNS)
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("group_constraints")
      .select(GROUP_CONSTRAINT_COLUMNS)
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("activity_assessments")
      .select(ACTIVITY_ASSESSMENT_COLUMNS)
      .order("activity_date", { ascending: false })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("activity_assessment_entries")
      .select(ACTIVITY_ASSESSMENT_ENTRY_COLUMNS)
      .order("created_at", { ascending: false }),
  ]);

  return {
    rows: {
      groupRows: groupRows ?? [],
      groupMemberRows: groupMemberRows ?? [],
      constraintRows: constraintRows ?? [],
      activityAssessmentRows: activityAssessmentRows ?? [],
      activityAssessmentEntryRows: activityAssessmentEntryRows ?? [],
    },
    errors: {
      groupError,
      groupMemberError,
      constraintError,
      activityAssessmentError,
      activityAssessmentEntryError,
    },
  };
}
