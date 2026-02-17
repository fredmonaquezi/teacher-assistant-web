import { useEffect, useMemo, useState } from "react";
import { DEFAULT_PROFILE_PREFERENCES } from "../../constants/options";
import { supabase } from "../../supabaseClient";
import { loadAssessmentWorkspaceRows } from "./readers/assessmentLoader";
import { loadAttendanceWorkspaceRows } from "./readers/attendanceLoader";
import { loadCalendarWorkspaceRows } from "./readers/calendarLoader";
import { loadCoreWorkspaceRows } from "./readers/coreLoader";
import { loadGroupWorkspaceRows } from "./readers/groupLoader";
import { loadRubricWorkspaceRows } from "./readers/rubricLoader";

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

  const setFirstErrorFromList = (errors) => {
    const firstError = errors.find(Boolean);
    if (!firstError) return false;
    setFormError(firstError.message);
    return true;
  };

  const refreshCoreData = async () => {
    const coreResult = await loadCoreWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([
      coreResult.errors.classError,
      coreResult.errors.studentError,
      coreResult.errors.lessonError,
    ]);
    if (hasError) return false;

    setClasses(coreResult.rows.classRows);
    setStudents(coreResult.rows.studentRows);
    setLessonPlans(coreResult.rows.lessonRows);
    return true;
  };

  const refreshAttendanceData = async () => {
    const attendanceResult = await loadAttendanceWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([
      attendanceResult.errors.sessionError,
      attendanceResult.errors.entryError,
    ]);
    if (hasError) return false;

    setAttendanceSessions(attendanceResult.rows.sessionRows);
    setAttendanceEntries(attendanceResult.rows.entryRows);
    return true;
  };

  const refreshAssessmentData = async () => {
    const assessmentResult = await loadAssessmentWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([
      assessmentResult.errors.assessmentError,
      assessmentResult.errors.assessmentEntryError,
      assessmentResult.errors.runningRecordError,
      assessmentResult.errors.subjectError,
      assessmentResult.errors.unitError,
    ]);
    if (hasError) return false;

    setAssessments(assessmentResult.rows.assessmentRows);
    setAssessmentEntries(assessmentResult.rows.assessmentEntryRows);
    setRunningRecords(assessmentResult.rows.runningRecordRows);
    setSubjects(assessmentResult.rows.subjectRows);
    setUnits(assessmentResult.rows.unitRows);
    return true;
  };

  const refreshRubricData = async () => {
    const rubricResult = await loadRubricWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([
      rubricResult.errors.rubricError,
      rubricResult.errors.rubricCategoryError,
      rubricResult.errors.rubricCriterionError,
      rubricResult.errors.devScoreError,
    ]);
    if (hasError) return false;

    setRubrics(rubricResult.rows.rubricRows);
    setRubricCategories(rubricResult.rows.rubricCategoryRows);
    setRubricCriteria(rubricResult.rows.rubricCriterionRows);
    setDevelopmentScores(rubricResult.rows.devScoreRows);
    return true;
  };

  const refreshGroupData = async () => {
    const groupResult = await loadGroupWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([
      groupResult.errors.groupError,
      groupResult.errors.groupMemberError,
      groupResult.errors.constraintError,
    ]);
    if (hasError) return false;

    setGroups(groupResult.rows.groupRows);
    setGroupMembers(groupResult.rows.groupMemberRows);
    setGroupConstraints(groupResult.rows.constraintRows);
    return true;
  };

  const refreshCalendarData = async () => {
    const calendarResult = await loadCalendarWorkspaceRows(supabase);
    setCalendarTablesReady(calendarResult.tablesReady);

    let hasError = false;
    if (calendarResult.errors.diaryError && !calendarResult.missing.diaryMissing) {
      setFormError(calendarResult.errors.diaryError.message);
      hasError = true;
    } else {
      setCalendarDiaryEntries(calendarResult.rows.diaryRows);
    }

    if (calendarResult.errors.eventError && !calendarResult.missing.eventMissing) {
      setFormError(calendarResult.errors.eventError.message);
      hasError = true;
    } else {
      setCalendarEvents(calendarResult.rows.eventRows);
    }

    return !hasError;
  };

  const loadData = async () => {
    setLoading(true);
    setFormError("");

    try {
      await Promise.all([
        refreshCoreData(),
        refreshAttendanceData(),
        refreshAssessmentData(),
        refreshRubricData(),
        refreshGroupData(),
      ]);
      await refreshCalendarData();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadData();
    }, 0);
    return () => window.clearTimeout(timer);
    // Intentionally load once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    refreshCoreData,
    refreshAttendanceData,
    refreshAssessmentData,
    refreshRubricData,
    refreshGroupData,
    refreshCalendarData,
  };
}

export default useWorkspaceReads;
