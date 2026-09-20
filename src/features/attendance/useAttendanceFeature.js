import { useCallback, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import createAttendanceActions from "./attendanceActions";
import { fetchAttendance } from "./attendanceRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_ATTENDANCE = { sessionRows: [], entryRows: [] };

export default function useAttendanceFeature({ userId, enabled, students }) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState("");
  const queryKey = featureQueryKeys.attendance(userId);
  const query = useFeatureQuery({
    queryKey,
    enabled: !!userId && enabled,
    emptyData: EMPTY_ATTENDANCE,
    errorMessage: "Failed to load attendance data.",
    queryFn: async () => {
      const result = await fetchAttendance(supabase);
      const error = result.errors.sessionError || result.errors.entryError;
      if (error) throw error;
      return result.rows;
    },
  });

  const setAttendanceEntries = useCallback(
    (updater) => {
      queryClient.setQueryData(queryKey, (current = EMPTY_ATTENDANCE) => ({
        ...current,
        entryRows:
          typeof updater === "function" ? updater(current.entryRows) : updater,
      }));
    },
    [queryClient, queryKey]
  );
  const actions = createAttendanceActions({
    students,
    attendanceSessions: query.data.sessionRows,
    setAttendanceEntries,
    setFormError: setMutationError,
    refreshAttendanceData: query.refresh,
  });
  const updateEntry = useMutationAction(actions.handleUpdateAttendanceEntry, (error) => setMutationError(error.message));
  const createSession = useMutationAction(actions.handleCreateAttendanceSessionForDate, (error) => setMutationError(error.message));
  const deleteSession = useMutationAction(actions.handleDeleteAttendanceSession, (error) => setMutationError(error.message));

  return {
    attendanceSessions: query.data.sessionRows,
    attendanceEntries: query.data.entryRows,
    loading: enabled && query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    handleUpdateAttendanceEntry: updateEntry.run,
    handleCreateAttendanceSessionForDate: createSession.run,
    handleDeleteAttendanceSession: deleteSession.run,
    mutationPending: updateEntry.isPending || createSession.isPending || deleteSession.isPending,
  };
}
