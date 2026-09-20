import { useState } from "react";
import { supabase } from "../../supabaseClient";
import createClassSubjectActions from "./subjectActions";
import { fetchSubjects } from "./subjectsRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_SUBJECTS = { subjectRows: [] };

export default function useSubjectsFeature({ userId, enabled }) {
  const [mutationError, setMutationError] = useState("");
  const query = useFeatureQuery({
    queryKey: featureQueryKeys.subjects(userId),
    enabled: !!userId && enabled,
    emptyData: EMPTY_SUBJECTS,
    errorMessage: "Failed to load subjects.",
    queryFn: async () => {
      const result = await fetchSubjects(supabase);
      if (result.errors.subjectError) throw result.errors.subjectError;
      return result.rows;
    },
  });
  const actions = createClassSubjectActions({
    refreshSubjectData: query.refresh,
    setFormError: setMutationError,
  });
  const addSubjects = useMutationAction(actions.handleAddClassSubjects, (error) => setMutationError(error.message));
  const renameSubject = useMutationAction(actions.handleRenameClassSubject, (error) => setMutationError(error.message));

  return {
    subjects: query.data.subjectRows,
    loading: enabled && query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    handleAddClassSubjects: addSubjects.run,
    handleRenameClassSubject: renameSubject.run,
    mutationPending: addSubjects.isPending || renameSubject.isPending,
  };
}
