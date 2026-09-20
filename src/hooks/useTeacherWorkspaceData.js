import { useCallback, useEffect, useMemo, useRef } from "react";
import useActiveClassSelection from "./useActiveClassSelection";
import useAttendanceFeature from "../features/attendance/useAttendanceFeature";
import useClassroomFeature from "../features/classroom/useClassroomFeature";
import useGroupsFeature from "../features/groups/useGroupsFeature";
import useProfilePreferences from "../features/profile/useProfilePreferences";
import { getFeatureDomainsForPath } from "../features/queryKeys";
import useRandomPickerFeature from "../features/random-picker/useRandomPickerFeature";
import useSubjectsFeature from "../features/subjects/useSubjectsFeature";
import useUsefulLinksFeature from "../features/useful-links/useUsefulLinksFeature";

function useTeacherWorkspaceData(userId, pathname = "/") {
  const domains = getFeatureDomainsForPath(pathname);
  const [profilePreferences, setProfilePreferences] = useProfilePreferences();
  const orphanedStudentCleanupKeyRef = useRef("");

  const classroom = useClassroomFeature({ userId });
  const subjectsFeature = useSubjectsFeature({ userId, enabled: domains.subjects });
  const attendance = useAttendanceFeature({
    userId,
    enabled: domains.attendance,
    students: classroom.students,
  });
  const groupsFeature = useGroupsFeature({
    userId,
    enabled: domains.groups,
    students: classroom.students,
  });
  const usefulLinksFeature = useUsefulLinksFeature({ userId, enabled: domains.usefulLinks });
  const randomPickerFeature = useRandomPickerFeature({ userId, enabled: domains.randomPicker });
  const setClassroomError = classroom.setError;
  const setSubjectsError = subjectsFeature.setError;
  const setAttendanceError = attendance.setError;
  const setGroupsError = groupsFeature.setError;
  const setUsefulLinksError = usefulLinksFeature.setError;
  const setRandomPickerError = randomPickerFeature.setError;
  const cleanupOrphanedStudents = classroom.handleCleanupOrphanedStudents;
  const classroomLoading = classroom.loading;

  const { activeClass, activeClassId, setActiveClassId } = useActiveClassSelection(
    userId,
    classroom.classes
  );

  const validClassIds = useMemo(
    () => new Set(classroom.classes.map((classItem) => classItem.id).filter(Boolean)),
    [classroom.classes]
  );
  const orphanedStudentIds = useMemo(
    () =>
      classroom.students
        .filter((student) => student.class_id && !validClassIds.has(student.class_id))
        .map((student) => student.id)
        .filter(Boolean)
        .sort(),
    [classroom.students, validClassIds]
  );
  const visibleStudents = useMemo(
    () =>
      classroom.students.filter(
        (student) => !student.class_id || validClassIds.has(student.class_id)
      ),
    [classroom.students, validClassIds]
  );
  const visibleStudentIds = useMemo(
    () => new Set(visibleStudents.map((student) => student.id).filter(Boolean)),
    [visibleStudents]
  );
  const attendanceEntries = useMemo(
    () =>
      attendance.attendanceEntries.filter(
        (entry) => !entry.student_id || visibleStudentIds.has(entry.student_id)
      ),
    [attendance.attendanceEntries, visibleStudentIds]
  );
  const groupMembers = useMemo(
    () =>
      groupsFeature.groupMembers.filter(
        (member) => !member.student_id || visibleStudentIds.has(member.student_id)
      ),
    [groupsFeature.groupMembers, visibleStudentIds]
  );
  const groupConstraints = useMemo(
    () =>
      groupsFeature.groupConstraints.filter(
        (constraint) =>
          (!constraint.student_a || visibleStudentIds.has(constraint.student_a)) &&
          (!constraint.student_b || visibleStudentIds.has(constraint.student_b))
      ),
    [groupsFeature.groupConstraints, visibleStudentIds]
  );
  const randomPickerRotationRows = useMemo(
    () =>
      randomPickerFeature.rotationRows.map((row) => ({
        ...row,
        used_student_ids: (row.used_student_ids || []).filter((studentId) =>
          visibleStudentIds.has(studentId)
        ),
      })),
    [randomPickerFeature.rotationRows, visibleStudentIds]
  );

  const clearCurrentError = useCallback(
    (message = "") => {
      setClassroomError(message);
      setSubjectsError(message);
      setAttendanceError(message);
      setGroupsError(message);
      setUsefulLinksError(message);
      setRandomPickerError(message);
    },
    [setAttendanceError, setClassroomError, setGroupsError, setRandomPickerError, setSubjectsError, setUsefulLinksError]
  );
  const formError = useMemo(() => {
    if (pathname.startsWith("/attendance")) return attendance.error;
    if (pathname.startsWith("/groups")) return groupsFeature.error || subjectsFeature.error;
    if (pathname.startsWith("/random")) return randomPickerFeature.error;
    if (pathname.startsWith("/useful-links")) return usefulLinksFeature.error;
    if (pathname.startsWith("/classes")) return classroom.error || subjectsFeature.error;
    return classroom.error;
  }, [attendance.error, classroom.error, groupsFeature.error, pathname, randomPickerFeature.error, subjectsFeature.error, usefulLinksFeature.error]);

  useEffect(() => {
    if (classroomLoading || !orphanedStudentIds.length) {
      if (!orphanedStudentIds.length) orphanedStudentCleanupKeyRef.current = "";
      return;
    }
    const cleanupKey = orphanedStudentIds.join(",");
    if (orphanedStudentCleanupKeyRef.current === cleanupKey) return;
    orphanedStudentCleanupKeyRef.current = cleanupKey;
    let isCurrent = true;
    void cleanupOrphanedStudents().then((didCleanup) => {
      if (isCurrent && !didCleanup) orphanedStudentCleanupKeyRef.current = "";
    });
    return () => {
      isCurrent = false;
    };
  }, [classroomLoading, cleanupOrphanedStudents, orphanedStudentIds]);

  const classOptions = useMemo(
    () =>
      classroom.classes.map((item) => ({
        id: item.id,
        label: `${item.name}${item.grade_level ? ` (${item.grade_level})` : ""}`,
      })),
    [classroom.classes]
  );

  return {
    ...classroom,
    ...subjectsFeature,
    ...attendance,
    ...groupsFeature,
    ...usefulLinksFeature,
    ...randomPickerFeature,
    activeClass,
    activeClassId,
    setActiveClassId,
    profilePreferences,
    setProfilePreferences,
    classes: classroom.classes,
    students: visibleStudents,
    usefulLinks: usefulLinksFeature.usefulLinks,
    randomPickerCustomCategories: randomPickerFeature.customCategories,
    randomPickerRotationRows,
    classroomLoading,
    attendanceSessions: attendance.attendanceSessions,
    attendanceEntries,
    subjects: subjectsFeature.subjects,
    groups: groupsFeature.groups,
    groupMembers,
    groupConstraints,
    activityAssessmentsForGrouping: groupsFeature.activityAssessments,
    activityAssessmentEntriesForGrouping: groupsFeature.activityAssessmentEntries,
    loading:
      classroom.loading ||
      subjectsFeature.loading ||
      attendance.loading ||
      groupsFeature.loading ||
      usefulLinksFeature.loading ||
      randomPickerFeature.loading,
    formError,
    setFormError: clearCurrentError,
    classOptions,
  };
}

export default useTeacherWorkspaceData;
