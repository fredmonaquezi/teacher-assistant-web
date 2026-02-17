export async function loadGroupWorkspaceRows(supabaseClient) {
  const [
    { data: groupRows, error: groupError },
    { data: groupMemberRows, error: groupMemberError },
    { data: constraintRows, error: constraintError },
  ] = await Promise.all([
    supabaseClient.from("groups").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("group_members").select("*").order("created_at", { ascending: false }),
    supabaseClient.from("group_constraints").select("*").order("created_at", { ascending: false }),
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
