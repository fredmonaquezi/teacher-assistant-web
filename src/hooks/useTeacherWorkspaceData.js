import { useEffect, useMemo, useRef, useState } from "react";
import useWorkspaceActions from "./workspace/useWorkspaceActions";
import useWorkspaceReads from "./workspace/useWorkspaceReads";
import useActiveClassSelection from "./useActiveClassSelection";

function useTeacherWorkspaceData(userId) {
  const {
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
    activityAssessmentsForGrouping,
    activityAssessmentEntriesForGrouping,
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
  } = useWorkspaceReads(userId);

  const { activeClass, activeClassId, setActiveClassId } = useActiveClassSelection(
    userId,
    classes
  );

  const [seedingRubrics, setSeedingRubrics] = useState(false);
  const [classForm, setClassForm] = useState({
    name: "",
    gradeLevel: "",
    schoolYear: "",
    sortOrder: "",
  });
  const [studentForm, setStudentForm] = useState({
    firstName: "",
    lastName: "",
    gender: "Prefer not to say",
    classId: "",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
    separationList: "",
    sortOrder: "",
  });
  const [runningRecordForm, setRunningRecordForm] = useState({
    studentId: "",
    recordDate: "",
    textTitle: "",
    bookLevel: "",
    totalWords: "",
    errors: "",
    selfCorrections: "",
    notes: "",
  });
  const [subjectForm, setSubjectForm] = useState({
    classId: "",
    name: "",
    description: "",
    sortOrder: "",
  });
  const [unitForm, setUnitForm] = useState({
    subjectId: "",
    name: "",
    description: "",
    sortOrder: "",
  });
  const [developmentScoreForm, setDevelopmentScoreForm] = useState({
    studentId: "",
    criterionId: "",
    rating: "3",
    date: "",
    notes: "",
  });
  const [groupGenForm, setGroupGenForm] = useState({
    classId: "",
    size: "3",
    prefix: "Group",
    clearExisting: true,
    balanceGender: false,
    balanceAbility: false,
    pairSupportPartners: false,
    respectSeparations: true,
  });
  const [constraintForm, setConstraintForm] = useState({
    studentA: "",
    studentB: "",
  });
  const [groupsShowAdvanced, setGroupsShowAdvanced] = useState(false);
  const [groupsShowSeparations, setGroupsShowSeparations] = useState(false);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const groupsScrollTopRef = useRef(0);
  const orphanedStudentCleanupKeyRef = useRef("");

  const {
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleCleanupOrphanedStudents,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
    handleUpdateAssessmentEntry,
    handleSetAssessmentEntryScore,
    handleEnsureAssessmentEntries,
    handleUpdateAssessmentNotes,
    handleCreateRunningRecord,
    handleUpdateRunningRecord,
    handleDeleteRunningRecord,
    handleCreateSubject,
    handleCreateUnit,
    handleDeleteUnit,
    handleCreateAssessmentForUnit,
    handleDeleteAssessment,
    handleCopyAssessmentsFromUnit,
    handleCreateDevelopmentScore,
    handleCreateDevelopmentScoreEntry,
    handleUpdateDevelopmentScore,
    handleSeedDefaultRubrics,
    handleCreateRubricTemplate,
    handleUpdateRubricTemplate,
    handleDeleteRubricTemplate,
    handleDeleteAllRubrics,
    handleCreateRubricCategory,
    handleDeleteRubricCategory,
    handleCreateRubricCriterion,
    handleDeleteRubricCriterion,
    handleUpdateRubricCriterion,
    handleCreateCalendarDiaryEntry,
    handleUpdateCalendarDiaryEntry,
    handleDeleteCalendarDiaryEntry,
    handleCreateCalendarEvent,
    handleDeleteCalendarEvent,
    handleCreateUsefulLink,
    handleUpdateUsefulLink,
    handleDeleteUsefulLink,
    handleSwapUsefulLinkSortOrder,
    handleCreateRandomPickerCustomCategory,
    handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents,
    handleImportLegacyRandomPickerState,
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
  } = useWorkspaceActions({
    classes,
    students,
    attendanceSessions,
    setAttendanceEntries,
    setCalendarDiaryEntries,
    setCalendarEvents,
    usefulLinks,
    setUsefulLinks,
    randomPickerCustomCategories,
    setRandomPickerCustomCategories,
    randomPickerRotationRows,
    setRandomPickerRotationRows,
    assessmentEntries,
    setAssessmentEntries,
    assessments,
    subjects,
    units,
    rubrics,
    rubricCategories,
    rubricCriteria,
    groupConstraints,
    activityAssessmentsForGrouping,
    activityAssessmentEntriesForGrouping,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
    runningRecordForm,
    setRunningRecordForm,
    subjectForm,
    setSubjectForm,
    unitForm,
    setUnitForm,
    developmentScoreForm,
    setDevelopmentScoreForm,
    groupGenForm,
    constraintForm,
    setConstraintForm,
    isGeneratingGroups,
    setIsGeneratingGroups,
    setSeedingRubrics,
    setFormError,
    loadData,
    refreshCoreData,
    refreshAttendanceData,
    refreshAssessmentData,
    refreshRubricData,
    refreshGroupData,
    refreshCalendarData,
    refreshUsefulLinksData,
    refreshRandomPickerData,
    invalidateWorkspaceDomains,
    removeClassScopedWorkspaceData,
  });

  const orphanedStudentIds = useMemo(() => {
    const validClassIdSet = new Set(classes.map((classItem) => classItem.id).filter(Boolean));
    return students
      .filter((student) => student.class_id && !validClassIdSet.has(student.class_id))
      .map((student) => student.id)
      .filter(Boolean)
      .sort();
  }, [classes, students]);

  const visibleStudents = useMemo(() => {
    const validClassIdSet = new Set(classes.map((classItem) => classItem.id).filter(Boolean));
    return students.filter((student) => !student.class_id || validClassIdSet.has(student.class_id));
  }, [classes, students]);

  const visibleStudentIdSet = useMemo(
    () => new Set(visibleStudents.map((student) => student.id).filter(Boolean)),
    [visibleStudents]
  );

  const visibleAttendanceEntries = useMemo(
    () =>
      attendanceEntries.filter(
        (entry) => !entry.student_id || visibleStudentIdSet.has(entry.student_id)
      ),
    [attendanceEntries, visibleStudentIdSet]
  );

  const visibleAssessmentEntries = useMemo(
    () =>
      assessmentEntries.filter(
        (entry) => !entry.student_id || visibleStudentIdSet.has(entry.student_id)
      ),
    [assessmentEntries, visibleStudentIdSet]
  );

  const visibleRunningRecords = useMemo(
    () =>
      runningRecords.filter(
        (record) => !record.student_id || visibleStudentIdSet.has(record.student_id)
      ),
    [runningRecords, visibleStudentIdSet]
  );

  const visibleDevelopmentScores = useMemo(
    () =>
      developmentScores.filter(
        (score) => !score.student_id || visibleStudentIdSet.has(score.student_id)
      ),
    [developmentScores, visibleStudentIdSet]
  );

  const visibleGroupMembers = useMemo(
    () =>
      groupMembers.filter(
        (member) => !member.student_id || visibleStudentIdSet.has(member.student_id)
      ),
    [groupMembers, visibleStudentIdSet]
  );

  const visibleGroupConstraints = useMemo(
    () =>
      groupConstraints.filter(
        (constraint) =>
          (!constraint.student_a || visibleStudentIdSet.has(constraint.student_a)) &&
          (!constraint.student_b || visibleStudentIdSet.has(constraint.student_b))
      ),
    [groupConstraints, visibleStudentIdSet]
  );

  const visibleRandomPickerRotationRows = useMemo(
    () =>
      randomPickerRotationRows.map((row) => ({
        ...row,
        used_student_ids: (row.used_student_ids || []).filter((studentId) =>
          visibleStudentIdSet.has(studentId)
        ),
      })),
    [randomPickerRotationRows, visibleStudentIdSet]
  );

  useEffect(() => {
    if (loading) return;
    if (typeof handleCleanupOrphanedStudents !== "function") return;

    if (!orphanedStudentIds.length) {
      orphanedStudentCleanupKeyRef.current = "";
      return;
    }

    const nextCleanupKey = orphanedStudentIds.join(",");
    if (orphanedStudentCleanupKeyRef.current === nextCleanupKey) return;

    orphanedStudentCleanupKeyRef.current = nextCleanupKey;
    let isCurrent = true;

    void handleCleanupOrphanedStudents().then((didCleanup) => {
      if (isCurrent && !didCleanup) {
        orphanedStudentCleanupKeyRef.current = "";
      }
    });

    return () => {
      isCurrent = false;
    };
  }, [handleCleanupOrphanedStudents, loading, orphanedStudentIds]);

  return {
    activeClass,
    activeClassId,
    setActiveClassId,
    profilePreferences,
    setProfilePreferences,
    classes,
    students: visibleStudents,
    calendarDiaryEntries,
    calendarEvents,
    calendarTablesReady,
    usefulLinks,
    randomPickerCustomCategories,
    randomPickerRotationRows: visibleRandomPickerRotationRows,
    attendanceSessions,
    attendanceEntries: visibleAttendanceEntries,
    assessments,
    setAssessments,
    assessmentEntries: visibleAssessmentEntries,
    runningRecords: visibleRunningRecords,
    subjects,
    units,
    rubrics,
    rubricCategories,
    rubricCriteria,
    developmentScores: visibleDevelopmentScores,
    seedingRubrics,
    groups,
    groupMembers: visibleGroupMembers,
    groupConstraints: visibleGroupConstraints,
    loading,
    formError,
    setFormError,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
    runningRecordForm,
    setRunningRecordForm,
    subjectForm,
    setSubjectForm,
    unitForm,
    setUnitForm,
    developmentScoreForm,
    setDevelopmentScoreForm,
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
    classOptions,
    loadData,
    ensureDataForPath,
    invalidateWorkspaceDomains,
    refreshCoreData,
    refreshAttendanceData,
    refreshAssessmentData,
    refreshRubricData,
    refreshGroupData,
    refreshCalendarData,
    refreshUsefulLinksData,
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
    handleUpdateAssessmentEntry,
    handleSetAssessmentEntryScore,
    handleEnsureAssessmentEntries,
    handleUpdateAssessmentNotes,
    handleCreateRunningRecord,
    handleUpdateRunningRecord,
    handleDeleteRunningRecord,
    handleCreateSubject,
    handleCreateUnit,
    handleDeleteUnit,
    handleCreateAssessmentForUnit,
    handleDeleteAssessment,
    handleCopyAssessmentsFromUnit,
    handleCreateDevelopmentScore,
    handleCreateDevelopmentScoreEntry,
    handleUpdateDevelopmentScore,
    handleSeedDefaultRubrics,
    handleCreateRubricTemplate,
    handleUpdateRubricTemplate,
    handleDeleteRubricTemplate,
    handleDeleteAllRubrics,
    handleCreateRubricCategory,
    handleDeleteRubricCategory,
    handleCreateRubricCriterion,
    handleDeleteRubricCriterion,
    handleUpdateRubricCriterion,
    handleCreateCalendarDiaryEntry,
    handleUpdateCalendarDiaryEntry,
    handleDeleteCalendarDiaryEntry,
    handleCreateCalendarEvent,
    handleDeleteCalendarEvent,
    handleCreateUsefulLink,
    handleUpdateUsefulLink,
    handleDeleteUsefulLink,
    handleSwapUsefulLinkSortOrder,
    handleCreateRandomPickerCustomCategory,
    handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents,
    handleImportLegacyRandomPickerState,
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
  };
}

export default useTeacherWorkspaceData;
