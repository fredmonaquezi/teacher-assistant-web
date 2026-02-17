import { supabase } from "../../../supabaseClient";
import { DEFAULT_ATTENDANCE_STATUS } from "../../../constants/attendance";
import {
  applyOptimisticState,
  runMutation,
  runOptimisticMutation,
} from "./mutationHelpers";

function createAttendanceActions({
  students,
  attendanceSessions,
  setAttendanceEntries,
  setFormError,
  refreshAttendanceData,
}) {
  const handleUpdateAttendanceEntry = async (entryId, updates) => {
    if (!entryId) return false;
    return runOptimisticMutation({
      setFormError,
      applyOptimistic: () =>
        applyOptimisticState(setAttendanceEntries, (currentEntries) =>
          currentEntries.map((entry) => (entry.id === entryId ? { ...entry, ...updates } : entry))
        ),
      execute: () => supabase.from("attendance_entries").update(updates).eq("id", entryId),
      refresh: refreshAttendanceData,
      fallbackErrorMessage: "Failed to update attendance entry.",
    });
  };

  const handleCreateAttendanceSessionForDate = async (classId, dateString) => {
    setFormError("");

    if (!classId) {
      setFormError("Select a class first.");
      return { ok: false, sessionId: null };
    }

    if (!dateString) {
      setFormError("Choose a date.");
      return { ok: false, sessionId: null };
    }

    const classSessions = attendanceSessions.filter((session) => session.class_id === classId);
    const existingSession = classSessions.find((session) => session.session_date === dateString);
    if (existingSession?.id) {
      return { ok: true, sessionId: existingSession.id, existed: true };
    }

    const { data: sessionRow, error: sessionError } = await supabase
      .from("attendance_sessions")
      .insert({
        session_date: dateString,
        title: null,
        class_id: classId,
      })
      .select()
      .single();

    if (sessionError || !sessionRow?.id) {
      setFormError(sessionError?.message || "Failed to create attendance session.");
      return { ok: false, sessionId: null };
    }

    const classStudents = students.filter((student) => student.class_id === classId);
    if (classStudents.length > 0) {
      const entryRows = classStudents.map((student) => ({
        session_id: sessionRow.id,
        student_id: student.id,
        status: DEFAULT_ATTENDANCE_STATUS,
        note: null,
      }));

      const { error: entryError } = await supabase.from("attendance_entries").insert(entryRows);
      if (entryError) {
        setFormError(entryError.message);
        return { ok: false, sessionId: null };
      }
    }

    await refreshAttendanceData();
    return { ok: true, sessionId: sessionRow.id, existed: false };
  };

  const handleDeleteAttendanceSession = async (sessionId) => {
    if (!sessionId) return false;
    return runMutation({
      setFormError,
      execute: () => supabase.from("attendance_sessions").delete().eq("id", sessionId),
      refresh: refreshAttendanceData,
      fallbackErrorMessage: "Failed to delete attendance session.",
    });
  };

  return {
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
  };
}

export default createAttendanceActions;
