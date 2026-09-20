import { useCallback } from "react";
import { useMutation } from "@tanstack/react-query";

export default function useMutationAction(action, onError) {
  const mutation = useMutation({
    mutationFn: (args) => action(...args),
    onError,
  });
  const { mutateAsync } = mutation;
  const run = useCallback((...args) => mutateAsync(args), [mutateAsync]);
  return { run, isPending: mutation.isPending };
}
