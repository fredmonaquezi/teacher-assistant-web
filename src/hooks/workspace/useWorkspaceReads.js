import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { DEFAULT_PROFILE_PREFERENCES } from "../../constants/options";
import { supabase } from "../../supabaseClient";
import { loadAssessmentWorkspaceRows } from "./readers/assessmentLoader";
import { loadAttendanceWorkspaceRows } from "./readers/attendanceLoader";
import { loadCalendarWorkspaceRows } from "./readers/calendarLoader";
import { loadCoreWorkspaceRows } from "./readers/coreLoader";
import { loadGroupWorkspaceRows } from "./readers/groupLoader";
import { loadLinkWorkspaceRows } from "./readers/linkLoader";
import { loadRandomPickerWorkspaceRows } from "./readers/randomPickerLoader";
import { loadRubricWorkspaceRows } from "./readers/rubricLoader";

const attendanceQueryKeyForUser = (userId) => ["workspace", "attendance", userId || "anonymous"];
const assessmentQueryKeyForUser = (userId) => ["workspace", "assessment", userId || "anonymous"];
const rubricQueryKeyForUser = (userId) => ["workspace", "rubric", userId || "anonymous"];
const groupQueryKeyForUser = (userId) => ["workspace", "group", userId || "anonymous"];
const calendarQueryKeyForUser = (userId) => ["workspace", "calendar", userId || "anonymous"];
const linkQueryKeyForUser = (userId) => ["workspace", "link", userId || "anonymous"];
const randomPickerQueryKeyForUser = (userId) => ["workspace", "random-picker", userId || "anonymous"];

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

const EMPTY_RANDOM_PICKER_ROWS = {
  customCategoryRows: [],
  rotationRows: [],
};

const WORKSPACE_DOMAIN_STALE_TIME_MS = 30_000;
const WORKSPACE_DOMAIN_KEYS = [
  "core",
  "attendance",
  "assessment",
  "rubric",
  "group",
  "calendar",
  "links",
  "randomPicker",
];

function getWorkspaceDomainsForPath(pathname) {
  const path = typeof pathname === "string" && pathname ? pathname : "/";
  const domains = {
    core: false,
    attendance: false,
    assessment: false,
    rubric: false,
    group: false,
    calendar: true,
    links: false,
    randomPicker: false,
  };

  if (path === "/" || path === "/timer" || path === "/profile") {
    return domains;
  }

  domains.core = true;

  if (path.startsWith("/attendance")) {
    domains.attendance = true;
  }

  if (
    path.startsWith("/assessments") ||
    path.startsWith("/subjects/") ||
    path.startsWith("/units/") ||
    path.startsWith("/running-records")
  ) {
    domains.assessment = true;
  }

  if (path.startsWith("/classes/")) {
    domains.attendance = true;
    domains.assessment = true;
    domains.rubric = true;
  }

  if (path.startsWith("/students/")) {
    domains.attendance = true;
    domains.assessment = true;
    domains.rubric = true;
  }

  if (path.startsWith("/rubrics")) {
    domains.rubric = true;
  }

  if (path.startsWith("/groups")) {
    domains.group = true;
  }

  if (path.startsWith("/useful-links")) {
    domains.links = true;
  }

  if (path.startsWith("/random")) {
    domains.randomPicker = true;
  }

  return domains;
}

function useWorkspaceReads(userId) {
  const queryClient = useQueryClient();
  const attendanceQueryKey = attendanceQueryKeyForUser(userId);
  const assessmentQueryKey = assessmentQueryKeyForUser(userId);
  const rubricQueryKey = rubricQueryKeyForUser(userId);
  const groupQueryKey = groupQueryKeyForUser(userId);
  const calendarQueryKey = calendarQueryKeyForUser(userId);
  const linkQueryKey = linkQueryKeyForUser(userId);
  const randomPickerQueryKey = randomPickerQueryKeyForUser(userId);

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
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const pendingLoadCountRef = useRef(0);
  const loadedDomainsRef = useRef(
    WORKSPACE_DOMAIN_KEYS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {})
  );

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

  const loadAttendanceRows = useCallback(async () => {
    if (!userId) {
      return EMPTY_ATTENDANCE_ROWS;
    }

    const attendanceResult = await loadAttendanceWorkspaceRows(supabase);
    const firstError = [attendanceResult.errors.sessionError, attendanceResult.errors.entryError].find(Boolean);
    if (firstError) {
      throw firstError;
    }
    return attendanceResult.rows;
  }, [userId]);

  const loadAssessmentRows = useCallback(async () => {
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
  }, [userId]);

  const loadRubricRows = useCallback(async () => {
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
  }, [userId]);

  const loadGroupRows = useCallback(async () => {
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
  }, [userId]);

  const loadCalendarRows = useCallback(async () => {
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
  }, [userId]);

  const loadLinkRows = useCallback(async () => {
    if (!userId) {
      return EMPTY_LINK_ROWS;
    }

    const linkResult = await loadLinkWorkspaceRows(supabase);
    const firstError = [linkResult.errors.linkError].find(Boolean);
    if (firstError) {
      throw firstError;
    }

    return linkResult.rows;
  }, [userId]);

  const loadRandomPickerRows = useCallback(async () => {
    if (!userId) {
      return EMPTY_RANDOM_PICKER_ROWS;
    }

    const randomPickerResult = await loadRandomPickerWorkspaceRows(supabase);
    const firstError = [
      randomPickerResult.errors.customCategoryError && !randomPickerResult.missing.customCategoryMissing
        ? randomPickerResult.errors.customCategoryError
        : null,
      randomPickerResult.errors.rotationError && !randomPickerResult.missing.rotationMissing
        ? randomPickerResult.errors.rotationError
        : null,
    ].find(Boolean);

    if (firstError) {
      throw firstError;
    }

    return randomPickerResult.rows;
  }, [userId]);

  const { data: attendanceRows = EMPTY_ATTENDANCE_ROWS } = useQuery({
    queryKey: attendanceQueryKey,
    queryFn: loadAttendanceRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: assessmentRows = EMPTY_ASSESSMENT_ROWS } = useQuery({
    queryKey: assessmentQueryKey,
    queryFn: loadAssessmentRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: rubricRows = EMPTY_RUBRIC_ROWS } = useQuery({
    queryKey: rubricQueryKey,
    queryFn: loadRubricRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: groupRows = EMPTY_GROUP_ROWS } = useQuery({
    queryKey: groupQueryKey,
    queryFn: loadGroupRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: calendarRows = EMPTY_CALENDAR_ROWS } = useQuery({
    queryKey: calendarQueryKey,
    queryFn: loadCalendarRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: linkRows = EMPTY_LINK_ROWS } = useQuery({
    queryKey: linkQueryKey,
    queryFn: loadLinkRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
  });

  const { data: randomPickerRows = EMPTY_RANDOM_PICKER_ROWS } = useQuery({
    queryKey: randomPickerQueryKey,
    queryFn: loadRandomPickerRows,
    enabled: false,
    staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
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
  const randomPickerCustomCategories = randomPickerRows.customCategoryRows;
  const randomPickerRotationRows = randomPickerRows.rotationRows;

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

  const setRandomPickerCustomCategories = (updater) => {
    queryClient.setQueryData(randomPickerQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_RANDOM_PICKER_ROWS;
      const nextCustomCategoryRows =
        typeof updater === "function" ? updater(safeRows.customCategoryRows) : updater;
      return {
        ...safeRows,
        customCategoryRows: Array.isArray(nextCustomCategoryRows)
          ? nextCustomCategoryRows
          : safeRows.customCategoryRows,
      };
    });
  };

  const setRandomPickerRotationRows = (updater) => {
    queryClient.setQueryData(randomPickerQueryKey, (currentRows) => {
      const safeRows = currentRows || EMPTY_RANDOM_PICKER_ROWS;
      const nextRotationRows =
        typeof updater === "function" ? updater(safeRows.rotationRows) : updater;
      return {
        ...safeRows,
        rotationRows: Array.isArray(nextRotationRows) ? nextRotationRows : safeRows.rotationRows,
      };
    });
  };

  const queryKeyByDomain = useMemo(
    () => ({
      attendance: attendanceQueryKey,
      assessment: assessmentQueryKey,
      rubric: rubricQueryKey,
      group: groupQueryKey,
      calendar: calendarQueryKey,
      links: linkQueryKey,
      randomPicker: randomPickerQueryKey,
    }),
    [
      assessmentQueryKey,
      attendanceQueryKey,
      calendarQueryKey,
      groupQueryKey,
      linkQueryKey,
      randomPickerQueryKey,
      rubricQueryKey,
    ]
  );

  const invalidateWorkspaceDomains = useCallback(
    async (domains = []) => {
      const uniqueDomains = Array.from(new Set(domains)).filter(Boolean);
      uniqueDomains.forEach((domain) => {
        if (domain in loadedDomainsRef.current) {
          loadedDomainsRef.current[domain] = false;
        }
      });

      await Promise.all(
        uniqueDomains
          .map((domain) => queryKeyByDomain[domain])
          .filter(Boolean)
          .map((queryKey) => queryClient.invalidateQueries({ queryKey }))
      );
    },
    [queryClient, queryKeyByDomain]
  );

  const removeClassScopedWorkspaceData = useCallback(
    (classId, removedStudentIds = []) => {
      if (!classId) return;
      const removedStudentIdSet = new Set(removedStudentIds.filter(Boolean));

      queryClient.setQueryData(attendanceQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_ATTENDANCE_ROWS;
        const nextSessionRows = safeRows.sessionRows.filter((session) => session.class_id !== classId);
        const validSessionIds = new Set(nextSessionRows.map((session) => session.id));
        const nextEntryRows = safeRows.entryRows.filter((entry) => {
          if (!validSessionIds.has(entry.session_id)) return false;
          if (removedStudentIdSet.has(entry.student_id)) return false;
          return true;
        });
        return {
          sessionRows: nextSessionRows,
          entryRows: nextEntryRows,
        };
      });

      queryClient.setQueryData(assessmentQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_ASSESSMENT_ROWS;
        const nextAssessmentRows = safeRows.assessmentRows.filter((assessment) => assessment.class_id !== classId);
        const removedAssessmentIds = new Set(
          safeRows.assessmentRows
            .filter((assessment) => assessment.class_id === classId)
            .map((assessment) => assessment.id)
        );
        const nextSubjectRows = safeRows.subjectRows.filter((subject) => subject.class_id !== classId);
        const validSubjectIds = new Set(nextSubjectRows.map((subject) => subject.id));
        const nextUnitRows = safeRows.unitRows.filter((unit) => validSubjectIds.has(unit.subject_id));
        const nextAssessmentEntryRows = safeRows.assessmentEntryRows.filter((entry) => {
          if (removedAssessmentIds.has(entry.assessment_id)) return false;
          if (removedStudentIdSet.has(entry.student_id)) return false;
          return true;
        });
        const nextRunningRecordRows = safeRows.runningRecordRows.filter(
          (record) => !removedStudentIdSet.has(record.student_id)
        );
        return {
          assessmentRows: nextAssessmentRows,
          assessmentEntryRows: nextAssessmentEntryRows,
          runningRecordRows: nextRunningRecordRows,
          subjectRows: nextSubjectRows,
          unitRows: nextUnitRows,
        };
      });

      queryClient.setQueryData(rubricQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_RUBRIC_ROWS;
        return {
          ...safeRows,
          devScoreRows: safeRows.devScoreRows.filter((score) => !removedStudentIdSet.has(score.student_id)),
        };
      });

      queryClient.setQueryData(groupQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_GROUP_ROWS;
        const nextGroupRows = safeRows.groupRows.filter((group) => group.class_id !== classId);
        const validGroupIds = new Set(nextGroupRows.map((group) => group.id));
        const nextGroupMemberRows = safeRows.groupMemberRows.filter((member) => {
          if (!validGroupIds.has(member.group_id)) return false;
          if (removedStudentIdSet.has(member.student_id)) return false;
          return true;
        });
        const nextConstraintRows = safeRows.constraintRows.filter((constraint) => {
          if (removedStudentIdSet.has(constraint.student_a)) return false;
          if (removedStudentIdSet.has(constraint.student_b)) return false;
          return true;
        });
        return {
          groupRows: nextGroupRows,
          groupMemberRows: nextGroupMemberRows,
          constraintRows: nextConstraintRows,
        };
      });

      queryClient.setQueryData(calendarQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_CALENDAR_ROWS;
        return {
          ...safeRows,
          diaryRows: safeRows.diaryRows.filter((entry) => entry.class_id !== classId),
          eventRows: safeRows.eventRows.filter((event) => event.class_id !== classId),
        };
      });

      queryClient.setQueryData(randomPickerQueryKey, (currentRows) => {
        const safeRows = currentRows || EMPTY_RANDOM_PICKER_ROWS;
        return {
          ...safeRows,
          customCategoryRows: safeRows.customCategoryRows.filter((item) => item.class_id !== classId),
          rotationRows: safeRows.rotationRows.filter((item) => item.class_id !== classId),
        };
      });
    },
    [
      assessmentQueryKey,
      attendanceQueryKey,
      calendarQueryKey,
      groupQueryKey,
      queryClient,
      randomPickerQueryKey,
      rubricQueryKey,
    ]
  );

  const beginLoading = useCallback(() => {
    pendingLoadCountRef.current += 1;
    setLoading(true);
  }, []);

  const endLoading = useCallback(() => {
    pendingLoadCountRef.current = Math.max(0, pendingLoadCountRef.current - 1);
    if (pendingLoadCountRef.current === 0) {
      setLoading(false);
    }
  }, []);

  const withLoading = useCallback(
    async (work) => {
      beginLoading();
      try {
        return await work();
      } finally {
        endLoading();
      }
    },
    [beginLoading, endLoading]
  );

  const markDomainLoaded = useCallback((domain) => {
    loadedDomainsRef.current[domain] = true;
  }, []);

  const refreshCoreData = useCallback(async () => {
    const coreResult = await loadCoreWorkspaceRows(supabase);
    const hasError = setFirstErrorFromList([coreResult.errors.classError, coreResult.errors.studentError]);
    if (hasError) return false;

    setClasses(coreResult.rows.classRows);
    setStudents(coreResult.rows.studentRows);
    markDomainLoaded("core");
    return true;
  }, [markDomainLoaded]);

  const refreshAttendanceData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: attendanceQueryKey,
        queryFn: loadAttendanceRows,
        staleTime: 0,
      });
      markDomainLoaded("attendance");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load attendance data.");
      return false;
    }
  }, [attendanceQueryKey, loadAttendanceRows, markDomainLoaded, queryClient]);

  const refreshAssessmentData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: assessmentQueryKey,
        queryFn: loadAssessmentRows,
        staleTime: 0,
      });
      markDomainLoaded("assessment");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load assessment data.");
      return false;
    }
  }, [assessmentQueryKey, loadAssessmentRows, markDomainLoaded, queryClient]);

  const refreshRubricData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: rubricQueryKey,
        queryFn: loadRubricRows,
        staleTime: 0,
      });
      markDomainLoaded("rubric");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load rubric data.");
      return false;
    }
  }, [rubricQueryKey, loadRubricRows, markDomainLoaded, queryClient]);

  const refreshGroupData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: groupQueryKey,
        queryFn: loadGroupRows,
        staleTime: 0,
      });
      markDomainLoaded("group");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load group data.");
      return false;
    }
  }, [groupQueryKey, loadGroupRows, markDomainLoaded, queryClient]);

  const refreshCalendarData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: calendarQueryKey,
        queryFn: loadCalendarRows,
        staleTime: 0,
      });
      markDomainLoaded("calendar");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load calendar data.");
      return false;
    }
  }, [calendarQueryKey, loadCalendarRows, markDomainLoaded, queryClient]);

  const refreshUsefulLinksData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: linkQueryKey,
        queryFn: loadLinkRows,
        staleTime: 0,
      });
      markDomainLoaded("links");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load useful links.");
      return false;
    }
  }, [linkQueryKey, loadLinkRows, markDomainLoaded, queryClient]);

  const refreshRandomPickerData = useCallback(async () => {
    try {
      await queryClient.fetchQuery({
        queryKey: randomPickerQueryKey,
        queryFn: loadRandomPickerRows,
        staleTime: 0,
      });
      markDomainLoaded("randomPicker");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load random picker data.");
      return false;
    }
  }, [randomPickerQueryKey, loadRandomPickerRows, markDomainLoaded, queryClient]);

  const ensureCoreData = useCallback(async () => {
    if (loadedDomainsRef.current.core) return true;
    return refreshCoreData();
  }, [refreshCoreData]);

  const ensureAttendanceData = useCallback(async () => {
    if (loadedDomainsRef.current.attendance) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: attendanceQueryKey,
        queryFn: loadAttendanceRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("attendance");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load attendance data.");
      return false;
    }
  }, [attendanceQueryKey, loadAttendanceRows, markDomainLoaded, queryClient]);

  const ensureAssessmentData = useCallback(async () => {
    if (loadedDomainsRef.current.assessment) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: assessmentQueryKey,
        queryFn: loadAssessmentRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("assessment");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load assessment data.");
      return false;
    }
  }, [assessmentQueryKey, loadAssessmentRows, markDomainLoaded, queryClient]);

  const ensureRubricData = useCallback(async () => {
    if (loadedDomainsRef.current.rubric) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: rubricQueryKey,
        queryFn: loadRubricRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("rubric");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load rubric data.");
      return false;
    }
  }, [rubricQueryKey, loadRubricRows, markDomainLoaded, queryClient]);

  const ensureGroupData = useCallback(async () => {
    if (loadedDomainsRef.current.group) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: groupQueryKey,
        queryFn: loadGroupRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("group");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load group data.");
      return false;
    }
  }, [groupQueryKey, loadGroupRows, markDomainLoaded, queryClient]);

  const ensureCalendarData = useCallback(async () => {
    if (loadedDomainsRef.current.calendar) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: calendarQueryKey,
        queryFn: loadCalendarRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("calendar");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load calendar data.");
      return false;
    }
  }, [calendarQueryKey, loadCalendarRows, markDomainLoaded, queryClient]);

  const ensureUsefulLinksData = useCallback(async () => {
    if (loadedDomainsRef.current.links) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: linkQueryKey,
        queryFn: loadLinkRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("links");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load useful links.");
      return false;
    }
  }, [linkQueryKey, loadLinkRows, markDomainLoaded, queryClient]);

  const ensureRandomPickerData = useCallback(async () => {
    if (loadedDomainsRef.current.randomPicker) return true;
    try {
      await queryClient.fetchQuery({
        queryKey: randomPickerQueryKey,
        queryFn: loadRandomPickerRows,
        staleTime: WORKSPACE_DOMAIN_STALE_TIME_MS,
      });
      markDomainLoaded("randomPicker");
      return true;
    } catch (error) {
      setFormError(error?.message || "Failed to load random picker data.");
      return false;
    }
  }, [randomPickerQueryKey, loadRandomPickerRows, markDomainLoaded, queryClient]);

  const ensureDataForPath = useCallback(
    async (pathname) => {
      const domains = getWorkspaceDomainsForPath(pathname);
      const tasks = [];

      if (domains.core && !loadedDomainsRef.current.core) tasks.push(ensureCoreData);
      if (domains.attendance && !loadedDomainsRef.current.attendance) tasks.push(ensureAttendanceData);
      if (domains.assessment && !loadedDomainsRef.current.assessment) tasks.push(ensureAssessmentData);
      if (domains.rubric && !loadedDomainsRef.current.rubric) tasks.push(ensureRubricData);
      if (domains.group && !loadedDomainsRef.current.group) tasks.push(ensureGroupData);
      if (domains.calendar && !loadedDomainsRef.current.calendar) tasks.push(ensureCalendarData);
      if (domains.links && !loadedDomainsRef.current.links) tasks.push(ensureUsefulLinksData);
      if (domains.randomPicker && !loadedDomainsRef.current.randomPicker) {
        tasks.push(ensureRandomPickerData);
      }

      if (!tasks.length) return true;

      return withLoading(async () => {
        const results = await Promise.all(tasks.map((task) => task()));
        return results.every(Boolean);
      });
    },
    [
      ensureAssessmentData,
      ensureAttendanceData,
      ensureCalendarData,
      ensureCoreData,
      ensureGroupData,
      ensureRandomPickerData,
      ensureRubricData,
      ensureUsefulLinksData,
      withLoading,
    ]
  );

  const loadData = useCallback(async () => {
    return withLoading(async () => {
      setFormError("");
      const results = await Promise.all([
        refreshCoreData(),
        refreshAttendanceData(),
        refreshAssessmentData(),
        refreshRubricData(),
        refreshGroupData(),
        refreshUsefulLinksData(),
        refreshRandomPickerData(),
        refreshCalendarData(),
      ]);
      return results.every(Boolean);
    });
  }, [
    refreshAssessmentData,
    refreshAttendanceData,
    refreshCalendarData,
    refreshCoreData,
    refreshGroupData,
    refreshRandomPickerData,
    refreshRubricData,
    refreshUsefulLinksData,
    withLoading,
  ]);

  useEffect(() => {
    pendingLoadCountRef.current = 0;
    loadedDomainsRef.current = WORKSPACE_DOMAIN_KEYS.reduce((acc, key) => {
      acc[key] = false;
      return acc;
    }, {});
    setClasses([]);
    setStudents([]);
    setLoading(false);
    setFormError("");
  }, [userId]);

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
    randomPickerCustomCategories,
    setRandomPickerCustomCategories,
    randomPickerRotationRows,
    setRandomPickerRotationRows,
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
    ensureDataForPath,
    invalidateWorkspaceDomains,
    removeClassScopedWorkspaceData,
    refreshCoreData,
    refreshAttendanceData,
    refreshAssessmentData,
    refreshRubricData,
    refreshGroupData,
    refreshCalendarData,
    refreshUsefulLinksData,
    refreshRandomPickerData,
  };
}

export default useWorkspaceReads;
