import { supabase } from "../../../supabaseClient";
import { applyOptimisticState, runOptimisticMutation } from "./mutationHelpers";

function normalizeScopeClassId(classId) {
  return classId || null;
}

function sameScope(firstClassId, secondClassId) {
  return normalizeScopeClassId(firstClassId) === normalizeScopeClassId(secondClassId);
}

function applyScope(query, classId) {
  const normalizedClassId = normalizeScopeClassId(classId);
  return normalizedClassId ? query.eq("class_id", normalizedClassId) : query.is("class_id", null);
}

function normalizeUsedStudentIds(usedStudentIds) {
  if (!Array.isArray(usedStudentIds)) return [];
  return Array.from(
    new Set(
      usedStudentIds
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

function sameArray(firstList, secondList) {
  if (firstList.length !== secondList.length) return false;
  return firstList.every((value, index) => value === secondList[index]);
}

function createTempId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function safeLocalStorageEntries() {
  if (typeof window === "undefined" || !window.localStorage) return [];

  try {
    return Object.keys(window.localStorage).map((key) => [key, window.localStorage.getItem(key) || ""]);
  } catch {
    return [];
  }
}

function parseLegacyCustomCategoryRows(localStorageEntries) {
  const parsedRows = [];

  localStorageEntries.forEach(([key, rawValue]) => {
    let classId = null;
    if (key === "ta_random_custom_categories_global") {
      classId = null;
    } else {
      const classMatch = key.match(/^ta_random_custom_categories_(.+)$/);
      if (!classMatch) return;
      classId = classMatch[1] || null;
    }

    const categoryNames = Array.from(
      new Set(
        String(rawValue || "")
          .split("|")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    if (!categoryNames.length) return;
    parsedRows.push({ classId, categoryNames });
  });

  return parsedRows;
}

function parseLegacyRotationRows(localStorageEntries) {
  const parsedRows = [];

  localStorageEntries.forEach(([key, rawValue]) => {
    let classId = null;
    let category = "";

    if (key.startsWith("ta_random_rotation_global_")) {
      category = key.replace("ta_random_rotation_global_", "");
    } else {
      const classMatch = key.match(/^ta_random_rotation_(.+?)_(.+)$/);
      if (!classMatch) return;
      classId = classMatch[1] || null;
      category = classMatch[2] || "";
    }

    const usedStudentIds = Array.from(
      new Set(
        String(rawValue || "")
          .split(",")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );

    if (!category.trim()) return;
    if (!usedStudentIds.length) return;
    parsedRows.push({ classId, category: category.trim(), usedStudentIds });
  });

  return parsedRows;
}

function createRandomPickerActions({
  randomPickerCustomCategories,
  setRandomPickerCustomCategories,
  randomPickerRotationRows,
  setRandomPickerRotationRows,
  setFormError,
  refreshRandomPickerData,
}) {
  const handleCreateRandomPickerCustomCategory = async ({ classId = null, name }) => {
    const normalizedClassId = normalizeScopeClassId(classId);
    const normalizedName = String(name || "").trim();

    if (!normalizedName) {
      setFormError("Rotation name is required.");
      return false;
    }

    const alreadyExists = randomPickerCustomCategories.some(
      (item) => sameScope(item.class_id, normalizedClassId) && item.name === normalizedName
    );

    if (alreadyExists) {
      setFormError("A custom rotation with this name already exists for this class.");
      return false;
    }

    const scopeRows = randomPickerCustomCategories.filter((item) =>
      sameScope(item.class_id, normalizedClassId)
    );
    const maxSortOrder = scopeRows.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)),
      -1
    );

    const payload = {
      class_id: normalizedClassId,
      name: normalizedName,
      sort_order: maxSortOrder + 1,
      updated_at: new Date().toISOString(),
    };
    const nowIso = new Date().toISOString();
    const optimisticRow = {
      id: createTempId("random-category"),
      class_id: normalizedClassId,
      name: normalizedName,
      sort_order: payload.sort_order,
      created_at: nowIso,
      updated_at: nowIso,
    };

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setRandomPickerCustomCategories, (currentRows) => [
          ...currentRows,
          optimisticRow,
        ]),
      execute: () => supabase.from("random_picker_custom_categories").insert(payload),
      refresh: refreshRandomPickerData,
      fallbackErrorMessage: "Failed to create custom random picker rotation.",
    });
  };

  const handleDeleteRandomPickerCustomCategory = async ({ classId = null, name }) => {
    const normalizedClassId = normalizeScopeClassId(classId);
    const normalizedName = String(name || "").trim();
    if (!normalizedName) return false;

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () => {
        const rollbackCustom = applyOptimisticState(
          setRandomPickerCustomCategories,
          (currentRows) =>
            currentRows.filter(
              (item) =>
                !(sameScope(item.class_id, normalizedClassId) && item.name === normalizedName)
            )
        );

        const rollbackRotation = applyOptimisticState(setRandomPickerRotationRows, (currentRows) =>
          currentRows.filter(
            (item) =>
              !(sameScope(item.class_id, normalizedClassId) && item.category === normalizedName)
          )
        );

        return () => {
          rollbackRotation();
          rollbackCustom();
        };
      },
      execute: async () => {
        const [customDeleteResult, rotationDeleteResult] = await Promise.all([
          applyScope(
            supabase
              .from("random_picker_custom_categories")
              .delete()
              .eq("name", normalizedName),
            normalizedClassId
          ),
          applyScope(
            supabase
              .from("random_picker_rotation_state")
              .delete()
              .eq("category", normalizedName),
            normalizedClassId
          ),
        ]);

        const firstError = [customDeleteResult?.error, rotationDeleteResult?.error].find(Boolean);
        return firstError ? { error: firstError } : { data: true };
      },
      refresh: refreshRandomPickerData,
      fallbackErrorMessage: "Failed to delete custom random picker rotation.",
    });
  };

  const handleSetRandomPickerRotationUsedStudents = async ({
    classId = null,
    category,
    usedStudentIds,
  }) => {
    const normalizedClassId = normalizeScopeClassId(classId);
    const normalizedCategory = String(category || "").trim();
    const normalizedUsedStudentIds = normalizeUsedStudentIds(usedStudentIds);
    if (!normalizedCategory) return false;

    const existingRow = randomPickerRotationRows.find(
      (item) =>
        sameScope(item.class_id, normalizedClassId) &&
        String(item.category || "") === normalizedCategory
    );

    const existingIds = normalizeUsedStudentIds(existingRow?.used_student_ids || []);
    if (existingRow && sameArray(existingIds, normalizedUsedStudentIds)) {
      return true;
    }
    if (!existingRow && normalizedUsedStudentIds.length === 0) {
      return true;
    }

    const nowIso = new Date().toISOString();

    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setRandomPickerRotationRows, (currentRows) => {
          if (existingRow) {
            return currentRows.map((item) =>
              item.id === existingRow.id
                ? {
                    ...item,
                    used_student_ids: normalizedUsedStudentIds,
                    updated_at: nowIso,
                  }
                : item
            );
          }

          return [
            ...currentRows,
            {
              id: createTempId("random-rotation"),
              class_id: normalizedClassId,
              category: normalizedCategory,
              used_student_ids: normalizedUsedStudentIds,
              created_at: nowIso,
              updated_at: nowIso,
            },
          ];
        }),
      execute: () => {
        if (existingRow?.id) {
          return supabase
            .from("random_picker_rotation_state")
            .update({
              used_student_ids: normalizedUsedStudentIds,
              updated_at: nowIso,
            })
            .eq("id", existingRow.id);
        }

        return supabase.from("random_picker_rotation_state").insert({
          class_id: normalizedClassId,
          category: normalizedCategory,
          used_student_ids: normalizedUsedStudentIds,
          updated_at: nowIso,
        });
      },
      refresh: refreshRandomPickerData,
      fallbackErrorMessage: "Failed to update random picker rotation.",
    });
  };

  const handleImportLegacyRandomPickerState = async () => {
    const localStorageEntries = safeLocalStorageEntries();
    if (!localStorageEntries.length) return true;

    const customCategoryRows = parseLegacyCustomCategoryRows(localStorageEntries);
    const rotationRows = parseLegacyRotationRows(localStorageEntries);
    if (!customCategoryRows.length && !rotationRows.length) return true;

    try {
      const customCategoryInserts = [];

      customCategoryRows.forEach((item) => {
        const scopeRows = randomPickerCustomCategories.filter((row) =>
          sameScope(row.class_id, item.classId)
        );
        const existingNameSet = new Set(scopeRows.map((row) => row.name));
        let nextSortOrder = scopeRows.reduce(
          (maxValue, row) => Math.max(maxValue, Number(row.sort_order ?? -1)),
          -1
        );

        item.categoryNames.forEach((categoryName) => {
          if (existingNameSet.has(categoryName)) return;
          nextSortOrder += 1;
          existingNameSet.add(categoryName);
          customCategoryInserts.push({
            class_id: normalizeScopeClassId(item.classId),
            name: categoryName,
            sort_order: nextSortOrder,
            updated_at: new Date().toISOString(),
          });
        });
      });

      const rotationInserts = [];
      const rotationUpdates = [];

      rotationRows.forEach((item) => {
        const existingRow = randomPickerRotationRows.find(
          (row) => sameScope(row.class_id, item.classId) && row.category === item.category
        );

        const mergedUsedStudentIds = normalizeUsedStudentIds([
          ...(existingRow?.used_student_ids || []),
          ...item.usedStudentIds,
        ]);

        if (existingRow?.id) {
          const existingUsedStudentIds = normalizeUsedStudentIds(existingRow.used_student_ids || []);
          if (sameArray(existingUsedStudentIds, mergedUsedStudentIds)) {
            return;
          }

          rotationUpdates.push({
            id: existingRow.id,
            used_student_ids: mergedUsedStudentIds,
            updated_at: new Date().toISOString(),
          });
          return;
        }

        rotationInserts.push({
          class_id: normalizeScopeClassId(item.classId),
          category: item.category,
          used_student_ids: mergedUsedStudentIds,
          updated_at: new Date().toISOString(),
        });
      });

      const operations = [];

      if (customCategoryInserts.length) {
        operations.push(supabase.from("random_picker_custom_categories").insert(customCategoryInserts));
      }

      if (rotationInserts.length) {
        operations.push(supabase.from("random_picker_rotation_state").insert(rotationInserts));
      }

      if (rotationUpdates.length) {
        operations.push(
          Promise.all(
            rotationUpdates.map((update) =>
              supabase
                .from("random_picker_rotation_state")
                .update({
                  used_student_ids: update.used_student_ids,
                  updated_at: update.updated_at,
                })
                .eq("id", update.id)
            )
          )
        );
      }

      if (!operations.length) {
        return true;
      }

      const results = await Promise.all(operations);
      const nestedResults = results.flatMap((result) => (Array.isArray(result) ? result : [result]));
      const firstError = nestedResults.find((result) => result?.error)?.error;
      if (firstError) {
        if (firstError.code === "42P01") return true;
        return false;
      }

      await refreshRandomPickerData();
      return true;
    } catch {
      return false;
    }
  };

  return {
    handleCreateRandomPickerCustomCategory,
    handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents,
    handleImportLegacyRandomPickerState,
  };
}

export default createRandomPickerActions;
