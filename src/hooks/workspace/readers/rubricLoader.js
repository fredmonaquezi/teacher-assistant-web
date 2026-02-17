const RUBRIC_COLUMNS = "id,title,subject,grade_band,description,sort_order,created_at";
const RUBRIC_CATEGORY_COLUMNS = "id,rubric_id,name,sort_order,created_at";
const RUBRIC_CRITERION_COLUMNS = "id,category_id,label,description,sort_order,created_at";
const DEVELOPMENT_SCORE_COLUMNS = "id,student_id,criterion_id,rating,score_date,notes,created_at";

export async function loadRubricWorkspaceRows(supabaseClient) {
  const [
    { data: rubricRows, error: rubricError },
    { data: rubricCategoryRows, error: rubricCategoryError },
    { data: rubricCriterionRows, error: rubricCriterionError },
    { data: devScoreRows, error: devScoreError },
  ] = await Promise.all([
    supabaseClient
      .from("rubrics")
      .select(RUBRIC_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("rubric_categories")
      .select(RUBRIC_CATEGORY_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("rubric_criteria")
      .select(RUBRIC_CRITERION_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    supabaseClient
      .from("development_scores")
      .select(DEVELOPMENT_SCORE_COLUMNS)
      .order("created_at", { ascending: false }),
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
