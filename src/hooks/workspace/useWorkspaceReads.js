import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PROFILE_PREFERENCES } from "../../constants/options";
import { supabase } from "../../supabaseClient";

function useWorkspaceReads() {
  const [profilePreferences, setProfilePreferences] = useState(() => {
    try {
      const raw = localStorage.getItem("ta_profile_preferences");
      if (!raw) return DEFAULT_PROFILE_PREFERENCES;
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_PROFILE_PREFERENCES,
        ...parsed,
      };
    } catch {
      return DEFAULT_PROFILE_PREFERENCES;
    }
  });
  const [classes, setClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [_lessonPlans, setLessonPlans] = useState([]);
  const [calendarDiaryEntries, setCalendarDiaryEntries] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [calendarTablesReady, setCalendarTablesReady] = useState(true);
  const [attendanceSessions, setAttendanceSessions] = useState([]);
  const [attendanceEntries, setAttendanceEntries] = useState([]);
  const [assessments, setAssessments] = useState([]);
  const [assessmentEntries, setAssessmentEntries] = useState([]);
  const [runningRecords, setRunningRecords] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [units, setUnits] = useState([]);
  const [rubrics, setRubrics] = useState([]);
  const [rubricCategories, setRubricCategories] = useState([]);
  const [rubricCriteria, setRubricCriteria] = useState([]);
  const [developmentScores, setDevelopmentScores] = useState([]);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupConstraints, setGroupConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    localStorage.setItem("ta_profile_preferences", JSON.stringify(profilePreferences));
  }, [profilePreferences]);

  const classOptions = useMemo(
    () =>
      classes.map((item) => ({
        id: item.id,
        label: `${item.name}${item.grade_level ? ` (${item.grade_level})` : ""}`,
      })),
    [classes]
  );

  const loadData = async () => {
    setLoading(true);
    setFormError("");

    const [
      { data: classRows, error: classError },
      { data: studentRows, error: studentError },
      { data: lessonRows, error: lessonError },
      { data: sessionRows, error: sessionError },
      { data: entryRows, error: entryError },
      { data: assessmentRows, error: assessmentError },
      { data: assessmentEntryRows, error: assessmentEntryError },
      { data: runningRecordRows, error: runningRecordError },
      { data: subjectRows, error: subjectError },
      { data: unitRows, error: unitError },
      { data: rubricRows, error: rubricError },
      { data: rubricCategoryRows, error: rubricCategoryError },
      { data: rubricCriterionRows, error: rubricCriterionError },
      { data: devScoreRows, error: devScoreError },
      { data: groupRows, error: groupError },
      { data: groupMemberRows, error: groupMemberError },
      { data: constraintRows, error: constraintError },
    ] = await Promise.all([
      supabase
        .from("classes")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("students")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("lesson_plans").select("*").order("created_at", { ascending: false }),
      supabase.from("attendance_sessions").select("*").order("session_date", { ascending: false }),
      supabase.from("attendance_entries").select("*").order("created_at", { ascending: false }),
      supabase
        .from("assessments")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("assessment_date", { ascending: false }),
      supabase.from("assessment_entries").select("*").order("created_at", { ascending: false }),
      supabase.from("running_records").select("*").order("record_date", { ascending: false }),
      supabase
        .from("subjects")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("units")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubrics")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubric_categories")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase
        .from("rubric_criteria")
        .select("*")
        .order("sort_order", { ascending: true })
        .order("created_at", { ascending: false }),
      supabase.from("development_scores").select("*").order("created_at", { ascending: false }),
      supabase.from("groups").select("*").order("created_at", { ascending: false }),
      supabase.from("group_members").select("*").order("created_at", { ascending: false }),
      supabase.from("group_constraints").select("*").order("created_at", { ascending: false }),
    ]);

    if (
      classError ||
      studentError ||
      lessonError ||
      sessionError ||
      entryError ||
      assessmentError ||
      assessmentEntryError ||
      runningRecordError ||
      subjectError ||
      unitError ||
      rubricError ||
      rubricCategoryError ||
      rubricCriterionError ||
      devScoreError ||
      groupError ||
      groupMemberError ||
      constraintError
    ) {
      setFormError(
        classError?.message ||
          studentError?.message ||
          lessonError?.message ||
          sessionError?.message ||
          entryError?.message ||
          assessmentError?.message ||
          assessmentEntryError?.message ||
          runningRecordError?.message ||
          subjectError?.message ||
          unitError?.message ||
          rubricError?.message ||
          rubricCategoryError?.message ||
          rubricCriterionError?.message ||
          devScoreError?.message ||
          groupError?.message ||
          groupMemberError?.message ||
          constraintError?.message
      );
    } else {
      setClasses(classRows ?? []);
      setStudents(studentRows ?? []);
      setLessonPlans(lessonRows ?? []);
      setAttendanceSessions(sessionRows ?? []);
      setAttendanceEntries(entryRows ?? []);
      setAssessments(assessmentRows ?? []);
      setAssessmentEntries(assessmentEntryRows ?? []);
      setRunningRecords(runningRecordRows ?? []);
      setSubjects(subjectRows ?? []);
      setUnits(unitRows ?? []);
      setRubrics(rubricRows ?? []);
      setRubricCategories(rubricCategoryRows ?? []);
      setRubricCriteria(rubricCriterionRows ?? []);
      setDevelopmentScores(devScoreRows ?? []);
      setGroups(groupRows ?? []);
      setGroupMembers(groupMemberRows ?? []);
      setGroupConstraints(constraintRows ?? []);

      const isMissingTableError = (error) =>
        !!error &&
        (error.code === "42P01" ||
          /does not exist|Could not find the table|schema cache/i.test(error.message || ""));

      const [{ data: diaryRows, error: diaryError }, { data: eventRows, error: eventError }] =
        await Promise.all([
          supabase.from("calendar_diary_entries").select("*").order("entry_date", { ascending: false }),
          supabase.from("calendar_events").select("*").order("event_date", { ascending: false }),
        ]);
      const diaryMissing = isMissingTableError(diaryError);
      const eventMissing = isMissingTableError(eventError);
      setCalendarTablesReady(!diaryMissing && !eventMissing);

      if (diaryError && !diaryMissing) {
        setFormError(diaryError.message);
      } else {
        setCalendarDiaryEntries(diaryRows ?? []);
      }

      if (eventError && !eventMissing) {
        setFormError(eventError.message);
      } else {
        setCalendarEvents(eventRows ?? []);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  return {
    profilePreferences,
    setProfilePreferences,
    classes,
    students,
    calendarDiaryEntries,
    calendarEvents,
    calendarTablesReady,
    attendanceSessions,
    attendanceEntries,
    assessments,
    setAssessments,
    assessmentEntries,
    runningRecords,
    subjects,
    units,
    rubrics,
    rubricCategories,
    rubricCriteria,
    developmentScores,
    groups,
    groupMembers,
    groupConstraints,
    loading,
    formError,
    setFormError,
    classOptions,
    loadData,
  };
}

export default useWorkspaceReads;
