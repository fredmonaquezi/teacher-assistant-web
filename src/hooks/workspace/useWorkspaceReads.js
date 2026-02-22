import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PROFILE_PREFERENCES } from "../../constants/options";
import { supabase } from "../../supabaseClient";
import { loadAssessmentWorkspaceRows } from "./readers/assessmentLoader";
import { loadAttendanceWorkspaceRows } from "./readers/attendanceLoader";
import { loadCalendarWorkspaceRows } from "./readers/calendarLoader";
import { loadCoreWorkspaceRows } from "./readers/coreLoader";
import { loadGroupWorkspaceRows } from "./readers/groupLoader";
import { loadLinkWorkspaceRows } from "./readers/linkLoader";
import { loadRubricWorkspaceRows } from "./readers/rubricLoader";

const attendanceQueryKeyForUser = (userId) => ["workspace", "attendance", userId || "anonymous"];
const assessmentQueryKeyForUser = (userId) => ["workspace", "assessment", userId || "anonymous"];
const rubricQueryKeyForUser = (userId) => ["workspace", "rubric", userId || "anonymous"];
const groupQueryKeyForUser = (userId) => ["workspace", "group", userId || "anonymous"];
const calendarQueryKeyForUser = (userId) => ["workspace", "calendar", userId || "anonymous"];
const linkQueryKeyForUser = (userId) => ["workspace", "link", userId || "anonymous"];

const EMPTY_ATTENDANCE_ROWS = {
  sessionRows: [],
  entryRows: [],
};

const EMPTY_ASSESSMENT_ROWS = {
  assessmentRows: [],
  assessmentEntryRows: [],
  runningRecordRows: [],
  subjectRows: [],
  unitRows: [],
};

const EMPTY_RUBRIC_ROWS = {
  rubricRows: [],
  rubricCategoryRows: [],
  rubricCriterionRows: [],
  devScoreRows: [],
};

const EMPTY_GROUP_ROWS = {
  groupRows: [],
  groupMemberRows: [],
  constraintRows: [],
};

const EMPTY_CALENDAR_ROWS = {
  diaryRows: [],
  eventRows: [],
  tablesReady: true,
};

const EMPTY_LINK_ROWS = {
  linkRows: [],
};

function useWorkspaceReads(userId) {
  const queryClient = useQueryClient();
  const attendanceQueryKey = attendanceQueryKeyForUser(userId);
  const assessmentQueryKey = assessmentQueryKeyForUser(userId);
  const rubricQueryKey = rubricQueryKeyForUser(userId);
  const groupQueryKey = groupQueryKeyForUser(userId);
  const calendarQueryKey = calendarQueryKeyForUser(userId);
  const linkQueryKey = linkQueryKeyForUser(userId);

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

  const loadAttendanceRows = async () => {
    if (!userId) {
      return EMPTY_ATTENDANCE_ROWS;
    }

    const attendanceResult = await loadAttendanceWorkspaceRows(supabase);
    const firstError = [attendanceResult.errors.sessionError, attendanceResult.errors.entryError].find(Boolean);
    if (firstError) {
      throw firstError;
    }
    return attendanceResult.rows;
  };

  const loadAssessmentRows = async () => {
    if (!userId) {
      return EMPTY_ASSESSMENT_ROWS;
    }

    const assessmentResult = await loadAssessmentWorkspaceRows(supabase);
    const firstError = [
      assessmentResult.errors.assessmentError,
      assessmentResult.errors.assessmentEntryError,
      assessmentResult.errors.runningRecordError,
      assessmentResult.errors.subjectError,
      assessmentResult.errors.unitError,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    return assessmentResult.rows;
  };

  const loadRubricRows = async () => {
    if (!userId) {
      return EMPTY_RUBRIC_ROWS;
    }

    const rubricResult = await loadRubricWorkspaceRows(supabase);
    const firstError = [
      rubricResult.errors.rubricError,
      rubricResult.errors.rubricCategoryError,
      rubricResult.errors.rubricCriterionError,
      rubricResult.errors.devScoreError,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    return rubricResult.rows;
  };

  const loadGroupRows = async () => {
    if (!userId) {
      return EMPTY_GROUP_ROWS;
    }

    const groupResult = await loadGroupWorkspaceRows(supabase);
    const firstError = [
      groupResult.errors.groupError,
      groupResult.errors.groupMemberError,
      groupResult.errors.constraintError,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    return groupResult.rows;
  };

  const loadCalendarRows = async () => {
    if (!userId) {
      return EMPTY_CALENDAR_ROWS;
    }

    const calendarResult = await loadCalendarWorkspaceRows(supabase);
    const firstError = [
      calendarResult.errors.diaryError && !calendarResult.missing.diaryMissing
        ? calendarResult.errors.diaryError
        : null,
      calendarResult.errors.eventError && !calendarResult.missing.eventMissing
        ? calendarResult.errors.eventError
        : null,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    return {
      diaryRows: calendarResult.rows.diaryRows,
      eventRows: calendarResult.rows.eventRows,
      tablesReady: calendarResult.tablesReady,
    };
  };

  const loadLinkRows = async () => {
    if (!userId) {
      return EMPTY_LINK_ROWS;
    }

    const linkResult = await loadLinkWorkspaceRows(supabase);
    const firstError = [linkResult.errors.linkError].find(Boolean);
    if (firstError) {
      throw firstError;
    }

    return linkResult.rows;
  };

  const { data: attendanceRows = EMPTY_ATTENDANCE_ROWS } = useQuery({
    queryKey: attendanceQueryKey,
    queryFn: loadAttendanceRows,
    enabled: false,
    initialData: EMPTY_ATTENDANCE_ROWS,
    staleTime: 30_000,
  });

  const { data: assessmentRows = EMPTY_ASSESSMENT_ROWS } = useQuery({
    queryKey: assessmentQueryKey,
    queryFn: loadAssessmentRows,
    enabled: false,
    initialData: EMPTY_ASSESSMENT_ROWS,
    staleTime: 30_000,
  });

  const { data: rubricRows = EMPTY_RUBRIC_ROWS } = useQuery({
    queryKey: rubricQueryKey,
    queryFn: loadRubricRows,
    enabled: false,
    initialData: EMPTY_RUBRIC_ROWS,
    staleTime: 30_000,
  });

  const { data: groupRows = EMPTY_GROUP_ROWS } = useQuery({
    queryKey: groupQueryKey,
    queryFn: loadGroupRows,
    enabled: false,
    initialData: EMPTY_GROUP_ROWS,
    staleTime: 30_000,
  });

  const { data: calendarRows = EMPTY_CALENDAR_ROWS } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: loadCalendarRows,
    enabled: false,
    initialData: EMPTY_CALENDAR_ROWS,
    staleTime: 30_000,
  });

  const { data: linkRows = EMPTY_LINK_ROWS } = useQuery({
    queryKey: linkQueryKey,
    queryFn: loadLinkRows,
    enabled: false,
    initialData: EMPTY_LINK_ROWS,
    staleTime: 30_000,
  });

  const attendanceSessions = attendanceRows.sessionRows;
  const attendanceEntries = attendanceRows.entryRows;

  const assessments = assessmentRows.assessmentRows;
  const assessmentEntries = assessmentRows.assessmentEntryRows;
  const runningRecords = assessmentRows.runningRecordRows;
  const subjects = assessmentRows.subjectRows;
  const units = assessmentRows.unitRows;

  const rubrics = rubricRows.rubricRows;
  const rubricCategories = rubricRows.rubricCategoryRows;
  const rubricCriteria = rubricRows.rubricCriterionRows;
  const developmentScores = rubricRows.devScoreRows;

  const groups = groupRows.groupRows;
  const groupMembers = groupRows.groupMemberRows;
  const groupConstraints = groupRows.constraintRows;

  const calendarDiaryEntries = calendarRows.diaryRows;
  const calendarEvents = calendarRows.eventRows;
  const calendarTablesReady = calendarRows.tablesReady;
  const usefulLinks = linkRows.linkRows;

  const setAttendanceEntries = (updater) => {
    queryClient.setQueryData(attendanceQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_ATTENDANCE_ROWS;
      const nextEntryRows = typeof updater === "function" ? updater(safeRows.entryRows) : updater;
      return {
        ...safeRows,
        entryRows: Array.isArray(nextEntryRows) ? nextEntryRows : safeRows.entryRows,
      };
    });
  };

  const setAssessments = (updater) => {
    queryClient.setQueryData(assessmentQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_ASSESSMENT_ROWS;
      const nextAssessmentRows =
        typeof updater === "function" ? updater(safeRows.assessmentRows) : updater;
      return {
        ...safeRows,
        assessmentRows: Array.isArray(nextAssessmentRows)
          ? nextAssessmentRows
          : safeRows.assessmentRows,
      };
    });
  };

  const setAssessmentEntries = (updater) => {
    queryClient.setQueryData(assessmentQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_ASSESSMENT_ROWS;
      const nextEntryRows =
        typeof updater === "function" ? updater(safeRows.assessmentEntryRows) : updater;
      return {
        ...safeRows,
        assessmentEntryRows: Array.isArray(nextEntryRows)
          ? nextEntryRows
          : safeRows.assessmentEntryRows,
      };
    });
  };

  const setCalendarDiaryEntries = (updater) => {
    queryClient.setQueryData(calendarQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_CALENDAR_ROWS;
      const nextDiaryRows = typeof updater === "function" ? updater(safeRows.diaryRows) : updater;
      return {
        ...safeRows,
        diaryRows: Array.isArray(nextDiaryRows) ? nextDiaryRows : safeRows.diaryRows,
      };
    });
  };

  const setCalendarEvents = (updater) => {
    queryClient.setQueryData(calendarQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_CALENDAR_ROWS;
      const nextEventRows = typeof updater === "function" ? updater(safeRows.eventRows) : updater;
      return {
        ...safeRows,
        eventRows: Array.isArray(nextEventRows) ? nextEventRows : safeRows.eventRows,
      };
    });
  };

  const setUsefulLinks = (updater) => {
    queryClient.setQueryData(linkQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_LINK_ROWS;
      const nextLinkRows = typeof updater === "function" ? updater(safeRows.linkRows) : updater;
      return {
        ...safeRows,
        linkRows: Array.isArray(nextLinkRows) ? nextLinkRows : safeRows.linkRows,
      };
    });
  };

  const refreshCoreData = async () => {
    const coreResult = await loadCoreWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([coreResult.errors.classError, coreResult.errors.studentError]);
    if (hasError) return false;

    setClasses(coreResult.rows.classRows);
    setStudents(coreResult.rows.studentRows);
    return true;
  };

  const refreshAttendanceData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: attendanceQueryKey,
        queryFn: loadAttendanceRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load attendance data.");
      return false;
    }
  };

  const refreshAssessmentData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: assessmentQueryKey,
        queryFn: loadAssessmentRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load assessment data.");
      return false;
    }
  };

  const refreshRubricData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: rubricQueryKey,
        queryFn: loadRubricRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load rubric data.");
      return false;
    }
  };

  const refreshGroupData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: groupQueryKey,
        queryFn: loadGroupRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load group data.");
      return false;
    }
  };

  const refreshCalendarData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: calendarQueryKey,
        queryFn: loadCalendarRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load calendar data.");
      return false;
    }
  };

  const refreshUsefulLinksData = async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: linkQueryKey,
        queryFn: loadLinkRows,
        staleTime: 0,
      });
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load useful links.");
      return false;
    }
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
        refreshUsefulLinksData(),
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
    setCalendarDiaryEntries,
    calendarEvents,
    setCalendarEvents,
    calendarTablesReady,
    usefulLinks,
    setUsefulLinks,
    attendanceSessions,
    attendanceEntries,
    setAttendanceEntries,
    assessments,
    setAssessments,
    assessmentEntries,
    setAssessmentEntries,
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
    refreshUsefulLinksData,
  };
}

export default useWorkspaceReads;
