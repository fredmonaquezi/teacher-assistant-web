const RANDOM_PICKER_CUSTOM_COLUMNS = [
  "id",
  "class_id",
  "name",
  "sort_order",
  "created_at",
  "updated_at",
].join(",");

const RANDOM_PICKER_ROTATION_COLUMNS = [
  "id",
  "class_id",
  "category",
  "used_student_ids",
  "created_at",
  "updated_at",
].join(",");

function isMissingTableError(error) {
  return error?.code === "42P01";
}

export async function loadRandomPickerWorkspaceRows(supabaseClient) {
  const [customResult, rotationResult] = await Promise.all([
    supabaseClient
      .from("random_picker_custom_categories")
      .select(RANDOM_PICKER_CUSTOM_COLUMNS)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
    supabaseClient
      .from("random_picker_rotation_state")
      .select(RANDOM_PICKER_ROTATION_COLUMNS)
      .order("updated_at", { ascending: false })
      .order("created_at", { ascending: true }),
  ]);

  return {
    rows: {
      customCategoryRows: customResult.data ?? [],
      rotationRows: rotationResult.data ?? [],
    },
    errors: {
      customCategoryError: customResult.error,
      rotationError: rotationResult.error,
    },
    missing: {
      customCategoryMissing: isMissingTableError(customResult.error),
      rotationMissing: isMissingTableError(rotationResult.error),
    },
  };
}
