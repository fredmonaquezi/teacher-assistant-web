import { format } from "date-fns";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import { summarizeAttendanceEntries } from "../../utils/attendanceMetrics";
import { activityAssessmentMeetsExpectations, isActivityGrade } from "../../utils/activityAssessmentScale";
import { fetchStudentActivityEntries } from "../activity-assessments/activityAssessmentRepository";
import { createStudentNote, deleteStudentNote, fetchStudentNotes } from "./studentRepository";
import { activityDetailsForEntry, activitySubjectKey } from "./studentProfileModel";

const today = () => format(new Date(), "yyyy-MM-dd");
const emptyEntry = () => ({
  noteDate: today(),
  entryType: "anecdotal",
  developmentArea: "",
  developmentLevel: "on_track",
  body: "",
});

export default function useStudentProfileController({
  studentId,
  student,
  subjects,
  attendanceSessions,
  attendanceEntries,
  handleUpdateStudent,
}) {
  const queryClient = useQueryClient();
  const [noteMutationError, setNoteMutationError] = useState("");
  const [entry, setEntry] = useState(emptyEntry);
  const [profileNote, setProfileNote] = useState("");
  const [showProfileNote, setShowProfileNote] = useState(false);
  const [showEditInfo, setShowEditInfo] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [activitySubjectSelection, setActivitySubjectSelection] = useState({ studentId, value: "all" });
  const activitySubjectFilter = activitySubjectSelection.studentId === studentId
    ? activitySubjectSelection.value
    : "all";
  const notesQueryKey = ["student-notes", studentId];
  const notesQuery = useQuery({
    queryKey: notesQueryKey,
    queryFn: () => fetchStudentNotes(supabase, studentId),
    enabled: Boolean(studentId),
  });
  const activityQuery = useQuery({
    queryKey: ["student-activity-entries", studentId],
    queryFn: () => fetchStudentActivityEntries(supabase, studentId),
    enabled: Boolean(studentId),
  });
  const createNoteMutation = useMutation({
    mutationFn: (input) => createStudentNote(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey }),
  });
  const deleteNoteMutation = useMutation({
    mutationFn: (id) => deleteStudentNote(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notesQueryKey }),
  });
  const notes = notesQuery.data || [];
  const activityAssessments = useMemo(
    () => [...(activityQuery.data || [])].sort((first, second) =>
      (second.created_at || "").localeCompare(first.created_at || "")
    ),
    [activityQuery.data]
  );
  const subjectNameById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject.name])),
    [subjects]
  );
  const activitySubjectOptions = useMemo(() => {
    const options = new Map();
    activityAssessments.forEach((assessmentEntry) => {
      const activity = activityDetailsForEntry(assessmentEntry);
      options.set(
        activitySubjectKey(assessmentEntry),
        subjectNameById.get(activity?.subject_id) || activity?.subject || "Activity"
      );
    });
    return [...options.entries()]
      .map(([value, label]) => ({ value, label }))
      .sort((first, second) => first.label.localeCompare(second.label, undefined, { sensitivity: "base" }));
  }, [activityAssessments, subjectNameById]);
  const visibleActivityAssessments = useMemo(
    () => activitySubjectFilter === "all"
      ? activityAssessments
      : activityAssessments.filter((item) => activitySubjectKey(item) === activitySubjectFilter),
    [activityAssessments, activitySubjectFilter]
  );
  const activityPerformance = useMemo(() => {
    const meetingExpectations = visibleActivityAssessments
      .filter((item) => activityAssessmentMeetsExpectations(item.outcome)).length;
    return {
      meetingExpectations,
      usesNumericGrades: visibleActivityAssessments.some((item) => isActivityGrade(item.outcome)),
      percentage: visibleActivityAssessments.length
        ? Math.round((meetingExpectations / visibleActivityAssessments.length) * 100)
        : 0,
    };
  }, [visibleActivityAssessments]);
  const attendance = useMemo(() => {
    const sessionIds = new Set(attendanceSessions
      .filter((session) => session.class_id === student?.class_id)
      .map((session) => session.id));
    return summarizeAttendanceEntries(attendanceEntries.filter((item) =>
      item.student_id === studentId && sessionIds.has(item.session_id)
    ));
  }, [attendanceEntries, attendanceSessions, student?.class_id, studentId]);

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!entry.body.trim()) return;
    setNoteMutationError("");
    try {
      await createNoteMutation.mutateAsync({
        student_id: studentId,
        note_date: entry.noteDate,
        entry_type: entry.entryType,
        development_area: entry.entryType === "development" ? entry.developmentArea.trim() || null : null,
        development_level: entry.entryType === "development" ? entry.developmentLevel : null,
        body: entry.body.trim(),
      });
      setEntry(emptyEntry());
    } catch (error) {
      setNoteMutationError(error.message);
    }
  };
  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    setNoteMutationError("");
    try {
      await deleteNoteMutation.mutateAsync(id);
    } catch (error) {
      setNoteMutationError(error.message);
    }
  };
  const saveProfileNote = async () => {
    const didSave = await handleUpdateStudent(studentId, {
      gender: student.gender || "Prefer not to say",
      notes: profileNote,
      isParticipatingWell: Boolean(student.is_participating_well),
      needsHelp: Boolean(student.needs_help),
      missingHomework: Boolean(student.missing_homework),
    });
    if (didSave) setShowProfileNote(false);
  };

  return {
    notes,
    activityAssessments,
    loadingNotes: notesQuery.isPending,
    loadingActivityAssessments: activityQuery.isPending,
    noteError: noteMutationError || notesQuery.error?.message || "",
    activityAssessmentError: activityQuery.error?.message || "",
    saving: createNoteMutation.isPending,
    entry, setEntry, profileNote, setProfileNote, showProfileNote, setShowProfileNote,
    showEditInfo, setShowEditInfo, editForm, setEditForm,
    activitySubjectFilter, setActivitySubjectSelection, activitySubjectOptions,
    visibleActivityAssessments, activityPerformance, subjectNameById, attendance,
    attendanceTotal: attendance.present + attendance.absent + attendance.late + attendance.leftEarly,
    saveEntry, deleteEntry, saveProfileNote,
  };
}
