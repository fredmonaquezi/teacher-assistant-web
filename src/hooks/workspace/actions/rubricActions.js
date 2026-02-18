import {
  findDefaultRubricMetadataByTitle,
  getDefaultRubricsForLocale,
  normalizeRubricLocale,
} from "../../../data/defaultRubrics";
import { supabase } from "../../../supabaseClient";

const RUBRIC_IDENTITY_COLUMNS = "id,title,template_key,template_locale";
const LEGACY_RUBRIC_IDENTITY_COLUMNS = "id,title";

function normalizeTitle(value) {
  return String(value || "").trim().toLowerCase();
}

function buildTemplateIdentity(templateKey, locale) {
  const normalizedKey = String(templateKey || "").trim();
  if (!normalizedKey) return null;
  return `${normalizedKey}::${normalizeRubricLocale(locale)}`;
}

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function isTemplateMetadataMissingError(error) {
  const code = String(error?.code || "");
  const message = String(error?.message || "").toLowerCase();
  return (
    code === "42703" ||
    message.includes("template_key") ||
    message.includes("template_locale")
  );
}

async function loadRubricIdentityRows() {
  const { data, error } = await supabase.from("rubrics").select(RUBRIC_IDENTITY_COLUMNS);

  if (!error) {
    return { rows: data ?? [], supportsTemplateMetadata: true };
  }

  if (!isTemplateMetadataMissingError(error)) {
    throw error;
  }

  const { data: legacyData, error: legacyError } = await supabase
    .from("rubrics")
    .select(LEGACY_RUBRIC_IDENTITY_COLUMNS);

  if (legacyError) throw legacyError;

  return { rows: legacyData ?? [], supportsTemplateMetadata: false };
}

async function backfillMissingCriteriaDescriptions(rubricId, rubricTemplate) {
  if (!rubricId || !rubricTemplate?.categories?.length) return;

  const { data: categoryRows, error: categoryError } = await supabase
    .from("rubric_categories")
    .select("id,name,sort_order,created_at")
    .eq("rubric_id", rubricId)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (categoryError) throw categoryError;

  const categories = categoryRows ?? [];
  if (categories.length === 0) return;

  const categoryIds = categories.map((category) => category.id);
  const { data: criterionRows, error: criterionError } = await supabase
    .from("rubric_criteria")
    .select("id,category_id,label,description,sort_order,created_at")
    .in("category_id", categoryIds)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (criterionError) throw criterionError;

  const criteriaByCategoryId = new Map();
  for (const criterion of criterionRows ?? []) {
    if (!criteriaByCategoryId.has(criterion.category_id)) {
      criteriaByCategoryId.set(criterion.category_id, []);
    }
    criteriaByCategoryId.get(criterion.category_id).push(criterion);
  }

  const categoryByName = new Map(categories.map((category) => [normalizeText(category.name), category]));

  for (let categoryIndex = 0; categoryIndex < rubricTemplate.categories.length; categoryIndex += 1) {
    const templateCategory = rubricTemplate.categories[categoryIndex];
    const categoryRow =
      categoryByName.get(normalizeText(templateCategory.name)) ?? categories[categoryIndex] ?? null;
    if (!categoryRow) continue;

    const criteriaRowsForCategory = criteriaByCategoryId.get(categoryRow.id) ?? [];
    const criterionByLabel = new Map(
      criteriaRowsForCategory.map((criterion) => [normalizeText(criterion.label), criterion])
    );

    for (let criterionIndex = 0; criterionIndex < templateCategory.criteria.length; criterionIndex += 1) {
      const templateCriterion = templateCategory.criteria[criterionIndex];
      const normalizedDescription = String(templateCriterion.description || "").trim();
      if (!normalizedDescription) continue;

      const criterionRow =
        criterionByLabel.get(normalizeText(templateCriterion.label)) ??
        criteriaRowsForCategory[criterionIndex] ??
        null;
      if (!criterionRow) continue;

      const existingDescription = String(criterionRow.description || "").trim();
      const isLegacyGenericPtDescription = /^Avalia .+\.$/.test(existingDescription);
      if (existingDescription.length > 0 && !isLegacyGenericPtDescription) continue;

      const { error: updateError } = await supabase
        .from("rubric_criteria")
        .update({ description: normalizedDescription })
        .eq("id", criterionRow.id);
      if (updateError) throw updateError;
    }
  }
}

function createRubricActions({
  rubricCategories,
  rubricCriteria,
  setSeedingRubrics,
  setFormError,
  refreshRubricData,
}) {
  const handleSeedDefaultRubrics = async (locale = "en") => {
    setFormError("");
    setSeedingRubrics(true);

    const targetLocale = normalizeRubricLocale(locale);
    const defaultRubrics = getDefaultRubricsForLocale(targetLocale);

    try {
      const identityState = await loadRubricIdentityRows();
      const identityRows = identityState.rows;
      let supportsTemplateMetadata = identityState.supportsTemplateMetadata;

      const existingTitles = new Map(
        identityRows.map((rubric) => [normalizeTitle(rubric.title), rubric])
      );
      const existingTemplateIdentities = new Set(
        identityRows
          .map((rubric) => buildTemplateIdentity(rubric.template_key, rubric.template_locale))
          .filter(Boolean)
      );
      const existingTemplateIdentityMap = new Map(
        identityRows
          .map((rubric) => [buildTemplateIdentity(rubric.template_key, rubric.template_locale), rubric])
          .filter(([identity]) => Boolean(identity))
      );

      if (supportsTemplateMetadata) {
        for (const rubricRow of identityRows) {
          if (rubricRow.template_key) continue;

          const metadata = findDefaultRubricMetadataByTitle(rubricRow.title);
          if (!metadata) continue;

          const { error: updateMetadataError } = await supabase
            .from("rubrics")
            .update({
              template_key: metadata.templateKey,
              template_locale: metadata.templateLocale,
            })
            .eq("id", rubricRow.id);

          if (updateMetadataError) {
            if (isTemplateMetadataMissingError(updateMetadataError)) {
              supportsTemplateMetadata = false;
              break;
            }
            throw updateMetadataError;
          }

          rubricRow.template_key = metadata.templateKey;
          rubricRow.template_locale = metadata.templateLocale;
          existingTemplateIdentities.add(
            buildTemplateIdentity(metadata.templateKey, metadata.templateLocale)
          );
          existingTemplateIdentityMap.set(
            buildTemplateIdentity(metadata.templateKey, metadata.templateLocale),
            rubricRow
          );
        }
      }

      for (const rubric of defaultRubrics) {
        const templateIdentity = buildTemplateIdentity(rubric.templateKey, targetLocale);

        if (supportsTemplateMetadata && templateIdentity && existingTemplateIdentities.has(templateIdentity)) {
          const existingRubricRow = existingTemplateIdentityMap.get(templateIdentity);
          if (existingRubricRow) {
            await backfillMissingCriteriaDescriptions(existingRubricRow.id, rubric);
          }
          continue;
        }

        const normalizedTitle = normalizeTitle(rubric.title);
        const rowWithSameTitle = existingTitles.get(normalizedTitle);

        if (rowWithSameTitle) {
          if (supportsTemplateMetadata && !rowWithSameTitle.template_key && rubric.templateKey) {
            const { error: updateMetadataError } = await supabase
              .from("rubrics")
              .update({
                template_key: rubric.templateKey,
                template_locale: targetLocale,
              })
              .eq("id", rowWithSameTitle.id);

            if (updateMetadataError && !isTemplateMetadataMissingError(updateMetadataError)) {
              throw updateMetadataError;
            }

            if (updateMetadataError) {
              supportsTemplateMetadata = false;
            } else if (templateIdentity) {
              rowWithSameTitle.template_key = rubric.templateKey;
              rowWithSameTitle.template_locale = targetLocale;
              existingTemplateIdentities.add(templateIdentity);
              existingTemplateIdentityMap.set(templateIdentity, rowWithSameTitle);
            }
          }

          await backfillMissingCriteriaDescriptions(rowWithSameTitle.id, rubric);
          continue;
        }

        const insertPayload = {
          title: rubric.title,
          subject: rubric.subject,
          grade_band: rubric.gradeBand,
          description: rubric.description ?? null,
        };

        if (supportsTemplateMetadata && rubric.templateKey) {
          insertPayload.template_key = rubric.templateKey;
          insertPayload.template_locale = targetLocale;
        }

        let rubricRow;
        const { data: insertedRow, error: rubricError } = await supabase
          .from("rubrics")
          .insert(insertPayload)
          .select()
          .single();

        if (rubricError) {
          if (supportsTemplateMetadata && isTemplateMetadataMissingError(rubricError)) {
            supportsTemplateMetadata = false;

            const { data: fallbackRow, error: fallbackError } = await supabase
              .from("rubrics")
              .insert({
                title: rubric.title,
                subject: rubric.subject,
                grade_band: rubric.gradeBand,
                description: rubric.description ?? null,
              })
              .select()
              .single();

            if (fallbackError) throw fallbackError;
            rubricRow = fallbackRow;
          } else {
            throw rubricError;
          }
        } else {
          rubricRow = insertedRow;
        }

        existingTitles.set(normalizedTitle, {
          id: rubricRow.id,
          title: rubric.title,
          template_key: supportsTemplateMetadata ? rubric.templateKey : null,
          template_locale: supportsTemplateMetadata ? targetLocale : null,
        });
        if (supportsTemplateMetadata && templateIdentity) {
          existingTemplateIdentities.add(templateIdentity);
          existingTemplateIdentityMap.set(templateIdentity, rubricRow);
        }

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
            description: criterion.description ?? "",
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

  const handleDeleteAllRubrics = async () => {
    setFormError("");

    try {
      const { data: rubricRows, error: rubricError } = await supabase.from("rubrics").select("id");
      if (rubricError) throw rubricError;

      const rubricIds = (rubricRows || []).map((row) => row.id).filter(Boolean);
      if (rubricIds.length === 0) {
        await refreshRubricData();
        return true;
      }

      const { data: categoryRows, error: categoryError } = await supabase
        .from("rubric_categories")
        .select("id")
        .in("rubric_id", rubricIds);
      if (categoryError) throw categoryError;

      const categoryIds = (categoryRows || []).map((row) => row.id).filter(Boolean);
      let criterionIds = [];

      if (categoryIds.length > 0) {
        const { data: criterionRows, error: criterionError } = await supabase
          .from("rubric_criteria")
          .select("id")
          .in("category_id", categoryIds);
        if (criterionError) throw criterionError;
        criterionIds = (criterionRows || []).map((row) => row.id).filter(Boolean);
      }

      if (criterionIds.length > 0) {
        const { error: devScoreError } = await supabase
          .from("development_scores")
          .delete()
          .in("criterion_id", criterionIds);
        if (devScoreError) throw devScoreError;

        const { error: criteriaDeleteError } = await supabase
          .from("rubric_criteria")
          .delete()
          .in("id", criterionIds);
        if (criteriaDeleteError) throw criteriaDeleteError;
      }

      if (categoryIds.length > 0) {
        const { error: categoriesDeleteError } = await supabase
          .from("rubric_categories")
          .delete()
          .in("id", categoryIds);
        if (categoriesDeleteError) throw categoriesDeleteError;
      }

      const { error: rubricsDeleteError } = await supabase.from("rubrics").delete().in("id", rubricIds);
      if (rubricsDeleteError) throw rubricsDeleteError;
    } catch (error) {
      setFormError(error.message || "Failed to delete all rubrics.");
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
    handleDeleteAllRubrics,
    handleCreateRubricCategory,
    handleDeleteRubricCategory,
    handleCreateRubricCriterion,
    handleDeleteRubricCriterion,
    handleUpdateRubricCriterion,
  };
}

export default createRubricActions;
