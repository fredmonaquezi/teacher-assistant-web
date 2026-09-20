import { useRef, useState } from "react";
import { supabase } from "../../supabaseClient";
import createGroupActions from "./groupActions";
import { fetchGroups } from "./groupsRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_GROUPS = {
  groupRows: [],
  groupMemberRows: [],
  constraintRows: [],
  activityAssessmentRows: [],
  activityAssessmentEntryRows: [],
};

export default function useGroupsFeature({
  userId,
  enabled,
  students,
}) {
  const [mutationError, setMutationError] = useState("");
  const [groupGenForm, setGroupGenForm] = useState({
    classId: "",
    size: "3",
    prefix: "Group",
    clearExisting: true,
    balanceGender: false,
    separateGender: false,
    balanceAbility: false,
    pairSupportPartners: false,
    respectSeparations: true,
  });
  const [constraintForm, setConstraintForm] = useState({ studentA: "", studentB: "" });
  const [groupsShowAdvanced, setGroupsShowAdvanced] = useState(false);
  const [groupsShowSeparations, setGroupsShowSeparations] = useState(false);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const groupsScrollTopRef = useRef(0);
  const query = useFeatureQuery({
    queryKey: featureQueryKeys.groups(userId),
    enabled: !!userId && enabled,
    emptyData: EMPTY_GROUPS,
    errorMessage: "Failed to load group data.",
    queryFn: async () => {
      const result = await fetchGroups(supabase);
      const error = [
        result.errors.groupError,
        result.errors.groupMemberError,
        result.errors.constraintError,
        result.errors.activityAssessmentError,
        result.errors.activityAssessmentEntryError,
      ].find(Boolean);
      if (error) throw error;
      return result.rows;
    },
  });
  const actions = createGroupActions({
    students,
    activityAssessmentsForGrouping: query.data.activityAssessmentRows,
    activityAssessmentEntriesForGrouping: query.data.activityAssessmentEntryRows,
    groupConstraints: query.data.constraintRows,
    groupGenForm,
    constraintForm,
    setConstraintForm,
    isGeneratingGroups,
    setIsGeneratingGroups,
    setFormError: setMutationError,
    refreshGroupData: query.refresh,
  });
  const addConstraint = useMutationAction(actions.handleAddConstraint, (error) => setMutationError(error.message));
  const deleteConstraint = useMutationAction(actions.handleDeleteConstraint, (error) => setMutationError(error.message));
  const generateGroups = useMutationAction(actions.handleGenerateGroups, (error) => setMutationError(error.message));

  return {
    groups: query.data.groupRows,
    groupMembers: query.data.groupMemberRows,
    groupConstraints: query.data.constraintRows,
    activityAssessments: query.data.activityAssessmentRows,
    activityAssessmentEntries: query.data.activityAssessmentEntryRows,
    loading: enabled && query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    groupGenForm,
    setGroupGenForm,
    constraintForm,
    setConstraintForm,
    groupsShowAdvanced,
    setGroupsShowAdvanced,
    groupsShowSeparations,
    setGroupsShowSeparations,
    isGeneratingGroups,
    groupsScrollTopRef,
    handleAddConstraint: addConstraint.run,
    handleDeleteConstraint: deleteConstraint.run,
    handleGenerateGroups: generateGroups.run,
    mutationPending: addConstraint.isPending || deleteConstraint.isPending || generateGroups.isPending,
  };
}
