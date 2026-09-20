import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import createLinkActions from "./usefulLinksActions";
import { fetchUsefulLinks } from "./usefulLinksRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_LINKS = { linkRows: [] };

export default function useUsefulLinksFeature({ userId, enabled }) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState("");
  const queryKey = featureQueryKeys.usefulLinks(userId);
  const query = useFeatureQuery({
    queryKey,
    enabled: !!userId && enabled,
    emptyData: EMPTY_LINKS,
    errorMessage: "Failed to load useful links.",
    queryFn: async () => {
      const result = await fetchUsefulLinks(supabase);
      if (result.errors.linkError) throw result.errors.linkError;
      return result.rows;
    },
  });
  const setUsefulLinks = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKey, (current = EMPTY_LINKS) => ({
        ...current,
        linkRows: typeof updater === "function" ? updater(current.linkRows) : updater,
      }));
    },
    [queryClient, queryKey]
  );
  const actions = createLinkActions({
    usefulLinks: query.data.linkRows,
    setUsefulLinks,
    setFormError: setMutationError,
    refreshUsefulLinksData: query.refresh,
  });
  const createLink = useMutationAction(actions.handleCreateUsefulLink, (error) => setMutationError(error.message));
  const updateLink = useMutationAction(actions.handleUpdateUsefulLink, (error) => setMutationError(error.message));
  const deleteLink = useMutationAction(actions.handleDeleteUsefulLink, (error) => setMutationError(error.message));
  const reorderLinks = useMutationAction(actions.handleSwapUsefulLinkSortOrder, (error) => setMutationError(error.message));

  return {
    usefulLinks: query.data.linkRows,
    loading: enabled && query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    handleCreateUsefulLink: createLink.run,
    handleUpdateUsefulLink: updateLink.run,
    handleDeleteUsefulLink: deleteLink.run,
    handleSwapUsefulLinkSortOrder: reorderLinks.run,
    mutationPending:
      createLink.isPending || updateLink.isPending || deleteLink.isPending || reorderLinks.isPending,
  };
}
