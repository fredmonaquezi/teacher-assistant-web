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

  const loadData = async () => {
    setLoading(true);
    setFormError("");

    try {
      const [
        coreResult,
        attendanceResult,
        assessmentResult,
        rubricResult,
        groupResult,
      ] = await Promise.all([
        loadCoreWorkspaceRows(supabase),
        loadAttendanceWorkspaceRows(supabase),
        loadAssessmentWorkspaceRows(supabase),
        loadRubricWorkspaceRows(supabase),
        loadGroupWorkspaceRows(supabase),
      ]);

      const primaryError =
        coreResult.errors.classError ||
        coreResult.errors.studentError ||
        coreResult.errors.lessonError ||
        attendanceResult.errors.sessionError ||
        attendanceResult.errors.entryError ||
        assessmentResult.errors.assessmentError ||
        assessmentResult.errors.assessmentEntryError ||
        assessmentResult.errors.runningRecordError ||
        assessmentResult.errors.subjectError ||
        assessmentResult.errors.unitError ||
        rubricResult.errors.rubricError ||
        rubricResult.errors.rubricCategoryError ||
        rubricResult.errors.rubricCriterionError ||
        rubricResult.errors.devScoreError ||
        groupResult.errors.groupError ||
        groupResult.errors.groupMemberError ||
        groupResult.errors.constraintError;

      if (primaryError) {
        setFormError(primaryError.message);
        return;
      }

      setClasses(coreResult.rows.classRows);
      setStudents(coreResult.rows.studentRows);
      setLessonPlans(coreResult.rows.lessonRows);
      setAttendanceSessions(attendanceResult.rows.sessionRows);
      setAttendanceEntries(attendanceResult.rows.entryRows);
      setAssessments(assessmentResult.rows.assessmentRows);
      setAssessmentEntries(assessmentResult.rows.assessmentEntryRows);
      setRunningRecords(assessmentResult.rows.runningRecordRows);
      setSubjects(assessmentResult.rows.subjectRows);
      setUnits(assessmentResult.rows.unitRows);
      setRubrics(rubricResult.rows.rubricRows);
      setRubricCategories(rubricResult.rows.rubricCategoryRows);
      setRubricCriteria(rubricResult.rows.rubricCriterionRows);
      setDevelopmentScores(rubricResult.rows.devScoreRows);
      setGroups(groupResult.rows.groupRows);
      setGroupMembers(groupResult.rows.groupMemberRows);
      setGroupConstraints(groupResult.rows.constraintRows);

      const calendarResult = await loadCalendarWorkspaceRows(supabase);
      setCalendarTablesReady(calendarResult.tablesReady);

      if (calendarResult.errors.diaryError && !calendarResult.missing.diaryMissing) {
        setFormError(calendarResult.errors.diaryError.message);
      } else {
        setCalendarDiaryEntries(calendarResult.rows.diaryRows);
      }

      if (calendarResult.errors.eventError && !calendarResult.missing.eventMissing) {
        setFormError(calendarResult.errors.eventError.message);
      } else {
        setCalendarEvents(calendarResult.rows.eventRows);
      }
    } finally {
      setLoading(false);
    }
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
