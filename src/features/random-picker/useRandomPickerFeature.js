import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import createRandomPickerActions from "./randomPickerActions";
import { fetchRandomPickerState } from "./randomPickerRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_RANDOM_PICKER = { customCategoryRows: [], rotationRows: [] };

export default function useRandomPickerFeature({ userId, enabled }) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState("");
  const queryKey = featureQueryKeys.randomPicker(userId);
  const query = useFeatureQuery({
    queryKey,
    enabled: !!userId && enabled,
    emptyData: EMPTY_RANDOM_PICKER,
    errorMessage: "Failed to load random picker data.",
    queryFn: async () => {
      const result = await fetchRandomPickerState(supabase);
      const error = [
        result.errors.customCategoryError && !result.missing.customCategoryMissing
          ? result.errors.customCategoryError
          : null,
        result.errors.rotationError && !result.missing.rotationMissing
          ? result.errors.rotationError
          : null,
      ].find(Boolean);
      if (error) throw error;
      return result.rows;
    },
  });
  const setRows = useCallback(
    (field, updater) => {
      queryClient.setQueryData(queryKey, (current = EMPTY_RANDOM_PICKER) => ({
        ...current,
        [field]: typeof updater === "function" ? updater(current[field]) : updater,
      }));
    },
    [queryClient, queryKey]
  );
  const actions = createRandomPickerActions({
    randomPickerCustomCategories: query.data.customCategoryRows,
    setRandomPickerCustomCategories: (updater) => setRows("customCategoryRows", updater),
    randomPickerRotationRows: query.data.rotationRows,
    setRandomPickerRotationRows: (updater) => setRows("rotationRows", updater),
    setFormError: setMutationError,
    refreshRandomPickerData: query.refresh,
  });
  const createCategory = useMutationAction(actions.handleCreateRandomPickerCustomCategory, (error) => setMutationError(error.message));
  const deleteCategory = useMutationAction(actions.handleDeleteRandomPickerCustomCategory, (error) => setMutationError(error.message));
  const saveRotation = useMutationAction(actions.handleSetRandomPickerRotationUsedStudents, (error) => setMutationError(error.message));
  const importLegacyState = useMutationAction(actions.handleImportLegacyRandomPickerState, (error) => setMutationError(error.message));

  return {
    customCategories: query.data.customCategoryRows,
    rotationRows: query.data.rotationRows,
    loading: enabled && query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    handleCreateRandomPickerCustomCategory: createCategory.run,
    handleDeleteRandomPickerCustomCategory: deleteCategory.run,
    handleSetRandomPickerRotationUsedStudents: saveRotation.run,
    handleImportLegacyRandomPickerState: importLegacyState.run,
    mutationPending:
      createCategory.isPending ||
      deleteCategory.isPending ||
      saveRotation.isPending ||
      importLegacyState.isPending,
  };
}
