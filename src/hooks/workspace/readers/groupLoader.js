const GROUP_COLUMNS = "id,name,class_id,created_at";
const GROUP_MEMBER_COLUMNS = "id,group_id,student_id,created_at";
const GROUP_CONSTRAINT_COLUMNS = "id,student_a,student_b,created_at";

export async function loadGroupWorkspaceRows(supabaseClient) {
  const [
    { data: groupRows, error: groupError },
    { data: groupMemberRows, error: groupMemberError },
    { data: constraintRows, error: constraintError },
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
  ]);

  return {
    rows: {
      groupRows: groupRows ?? [],
      groupMemberRows: groupMemberRows ?? [],
      constraintRows: constraintRows ?? [],
    },
    errors: {
      groupError,
      groupMemberError,
      constraintError,
    },
  };
}
