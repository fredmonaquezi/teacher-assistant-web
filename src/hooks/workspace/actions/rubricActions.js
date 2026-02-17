import { DEFAULT_RUBRICS } from "../../../data/defaultRubrics";
import { supabase } from "../../../supabaseClient";

function createRubricActions({
  rubrics,
  rubricCategories,
  rubricCriteria,
  setSeedingRubrics,
  setFormError,
  refreshRubricData,
}) {
  const handleSeedDefaultRubrics = async () => {
    setFormError("");
    setSeedingRubrics(true);

    const existingTitles = new Set(rubrics.map((rubric) => rubric.title.trim().toLowerCase()));

    try {
      for (const rubric of DEFAULT_RUBRICS) {
        if (existingTitles.has(rubric.title.trim().toLowerCase())) {
          continue;
        }

        const { data: rubricRow, error: rubricError } = await supabase
          .from("rubrics")
          .insert({
            title: rubric.title,
            subject: rubric.subject,
            grade_band: rubric.gradeBand,
            description: rubric.description ?? null,
          })
          .select()
          .single();

        if (rubricError) throw rubricError;

        for (const category of rubric.categories) {
          const { data: categoryRow, error: categoryError } = await supabase
            .from("rubric_categories")
            .insert({
              rubric_id: rubricRow.id,
              name: category.name,
            })
            .select()
            .single();

          if (categoryError) throw categoryError;

          const criteriaRows = category.criteria.map((criterion) => ({
            category_id: categoryRow.id,
            label: criterion.label,
            description: criterion.description,
          }));

          if (criteriaRows.length > 0) {
            const { error: criteriaError } = await supabase.from("rubric_criteria").insert(criteriaRows);
            if (criteriaError) throw criteriaError;
          }
        }
      }
    } catch (error) {
      setFormError(error.message || "Failed to seed default rubrics.");
      setSeedingRubrics(false);
      return false;
    }

    await refreshRubricData();
    setSeedingRubrics(false);
    return true;
  };

  const handleCreateRubricTemplate = async ({ title, gradeBand, subject }) => {
    setFormError("");

    const payload = {
      title: String(title || "").trim(),
      grade_band: String(gradeBand || "").trim(),
      subject: String(subject || "").trim(),
    };

    if (!payload.title || !payload.grade_band || !payload.subject) {
      setFormError("Title, grade level, and subject are required.");
      return false;
    }

    const { error } = await supabase.from("rubrics").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleUpdateRubricTemplate = async (rubricId, updates) => {
    if (!rubricId) return false;
    setFormError("");

    const { error } = await supabase.from("rubrics").update(updates).eq("id", rubricId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleDeleteRubricTemplate = async (rubricId) => {
    if (!rubricId) return false;
    setFormError("");

    const { error } = await supabase.from("rubrics").delete().eq("id", rubricId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleCreateRubricCategory = async ({ rubricId, name, sortOrder }) => {
    if (!rubricId) return false;
    setFormError("");

    const normalizedName = String(name || "").trim();
    if (!normalizedName) {
      setFormError("Category name is required.");
      return false;
    }

    const nextSortOrder = Number.isFinite(Number(sortOrder))
      ? Number(sortOrder)
      : rubricCategories.filter((category) => category.rubric_id === rubricId).length;

    const { error } = await supabase.from("rubric_categories").insert({
      rubric_id: rubricId,
      name: normalizedName,
      sort_order: nextSortOrder,
    });

    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleDeleteRubricCategory = async (categoryId) => {
    if (!categoryId) return false;
    setFormError("");

    const { error } = await supabase.from("rubric_categories").delete().eq("id", categoryId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleCreateRubricCriterion = async ({ categoryId, label, description, sortOrder }) => {
    if (!categoryId) return false;
    setFormError("");

    const normalizedLabel = String(label || "").trim();
    const normalizedDescription = String(description || "").trim();
    if (!normalizedLabel && !normalizedDescription) {
      setFormError("Criterion name or description is required.");
      return false;
    }

    const nextSortOrder = Number.isFinite(Number(sortOrder))
      ? Number(sortOrder)
      : rubricCriteria.filter((criterion) => criterion.category_id === categoryId).length;

    const { error } = await supabase.from("rubric_criteria").insert({
      category_id: categoryId,
      label: normalizedLabel || null,
      description: normalizedDescription,
      sort_order: nextSortOrder,
    });

    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleDeleteRubricCriterion = async (criterionId) => {
    if (!criterionId) return false;
    setFormError("");

    const { error } = await supabase.from("rubric_criteria").delete().eq("id", criterionId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  const handleUpdateRubricCriterion = async (criterionId, updates) => {
    if (!criterionId) return false;
    setFormError("");

    const payload = {
      label: updates?.label?.trim() || null,
      description: updates?.description?.trim() || "",
    };

    const { error } = await supabase.from("rubric_criteria").update(payload).eq("id", criterionId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await refreshRubricData();
    return true;
  };

  return {
    handleSeedDefaultRubrics,
    handleCreateRubricTemplate,
    handleUpdateRubricTemplate,
    handleDeleteRubricTemplate,
    handleCreateRubricCategory,
    handleDeleteRubricCategory,
    handleCreateRubricCriterion,
    handleDeleteRubricCriterion,
    handleUpdateRubricCriterion,
  };
}

export default createRubricActions;
