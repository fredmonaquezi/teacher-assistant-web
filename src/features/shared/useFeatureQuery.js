import { useCallback } from "react";
import { useQuery } from "@tanstack/react-query";

export default function useFeatureQuery({
  queryKey,
  queryFn,
  enabled,
  emptyData,
  errorMessage,
}) {
  const query = useQuery({
    queryKey,
    queryFn,
    enabled,
    staleTime: 30_000,
  });
  const { refetch } = query;

  const refresh = useCallback(async () => {
    const result = await refetch();
    if (result.error) throw result.error;
    return true;
  }, [refetch]);

  return {
    ...query,
    data: query.data || emptyData,
    errorMessage: query.error?.message || (query.error ? errorMessage : ""),
    refresh,
  };
}
