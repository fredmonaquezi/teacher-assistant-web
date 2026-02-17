export async function loadRubricWorkspaceRows(supabaseClient) {
  const [
    { data: rubricRows, error: rubricError },
    { data: rubricCategoryRows, error: rubricCategoryError },
    { data: rubricCriterionRows, error: rubricCriterionError },
    { data: devScoreRows, error: devScoreError },
  ] = await Promise.all([
    supabaseClient
      .from("rubrics")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("rubric_categories")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("rubric_criteria")
      .select("*")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient.from("development_scores").select("*").order("created_at", { ascending: false }),
  ]);

  return {
    rows: {
      rubricRows: rubricRows ?? [],
      rubricCategoryRows: rubricCategoryRows ?? [],
      rubricCriterionRows: rubricCriterionRows ?? [],
      devScoreRows: devScoreRows ?? [],
    },
    errors: {
      rubricError,
      rubricCategoryError,
      rubricCriterionError,
      devScoreError,
    },
  };
}
