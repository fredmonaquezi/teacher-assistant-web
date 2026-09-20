import { startTransition, useCallback, useDeferredValue, useEffect, useMemo, useState } from "react";
import { buildAbilityProfiles } from "./groupingEngine";

const INITIAL_VISIBLE_GROUP_CARDS = 24;
const VISIBLE_GROUP_CARD_STEP = 24;

export default function useGroupsPageController({
  activeClassId,
  students,
  activityAssessments,
  activityAssessmentEntries,
  subjects,
  groups,
  groupMembers,
  groupConstraints,
  groupGenForm,
  setGroupGenForm,
  constraintForm,
  groupsShowSeparations,
  setGroupsShowSeparations,
  groupsScrollTopRef,
  handleUpdateStudentAcademicLevel,
}) {
  const [showAdvancedHelp, setShowAdvancedHelp] = useState(false);
  const [constraintToDelete, setConstraintToDelete] = useState(null);
  const [visibleGroupCardCount, setVisibleGroupCardCount] = useState(INITIAL_VISIBLE_GROUP_CARDS);
  const [savingAcademicProfileIds, setSavingAcademicProfileIds] = useState(() => new Set());
  const deferredStudents = useDeferredValue(students);
  const deferredGroups = useDeferredValue(groups);
  const deferredGroupMembers = useDeferredValue(groupMembers);
  const deferredGroupConstraints = useDeferredValue(groupConstraints);

  const openSeparationsModal = () => {
    if (typeof window !== "undefined") groupsScrollTopRef.current = window.scrollY;
    setGroupsShowSeparations(true);
  };
  const closeSeparationsModal = () => {
    if (typeof window !== "undefined") groupsScrollTopRef.current = window.scrollY;
    setGroupsShowSeparations(false);
    if (typeof window !== "undefined") {
      window.requestAnimationFrame(() => window.requestAnimationFrame(() =>
        window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" })
      ));
    }
  };

  useEffect(() => {
    if (!groupsShowSeparations || typeof window === "undefined") return;
    window.requestAnimationFrame(() =>
      window.scrollTo({ top: groupsScrollTopRef.current, behavior: "auto" })
    );
  }, [groupsScrollTopRef, groupsShowSeparations]);

  const studentsById = useMemo(
    () => new Map(deferredStudents.map((student) => [student.id, student])),
    [deferredStudents]
  );
  const classStudents = useMemo(
    () => activeClassId
      ? deferredStudents.filter((student) => student.class_id === activeClassId)
      : [],
    [activeClassId, deferredStudents]
  );
  const academicProfiles = useMemo(
    () => buildAbilityProfiles(activeClassId, classStudents, activityAssessments, activityAssessmentEntries),
    [activeClassId, activityAssessmentEntries, activityAssessments, classStudents]
  );
  const subjectsById = useMemo(
    () => new Map(subjects.map((subject) => [subject.id, subject])),
    [subjects]
  );
  const classStudentIdSet = useMemo(
    () => new Set(classStudents.map((student) => student.id)),
    [classStudents]
  );
  const classConstraintList = useMemo(
    () => activeClassId
      ? deferredGroupConstraints.filter((constraint) =>
          classStudentIdSet.has(constraint.student_a) && classStudentIdSet.has(constraint.student_b)
        )
      : [],
    [activeClassId, classStudentIdSet, deferredGroupConstraints]
  );
  const constraintDisplayRows = useMemo(
    () => classConstraintList.map((constraint) => ({
      constraint,
      studentA: studentsById.get(constraint.student_a) || null,
      studentB: studentsById.get(constraint.student_b) || null,
    })),
    [classConstraintList, studentsById]
  );
  const classGroups = useMemo(
    () => activeClassId ? deferredGroups.filter((group) => group.class_id === activeClassId) : [],
    [activeClassId, deferredGroups]
  );
  const classGroupIdSet = useMemo(() => new Set(classGroups.map((group) => group.id)), [classGroups]);
  const classGroupMembers = useMemo(
    () => classGroups.length
      ? deferredGroupMembers.filter((member) => classGroupIdSet.has(member.group_id))
      : [],
    [classGroupIdSet, classGroups.length, deferredGroupMembers]
  );
  const memberIdsByGroupId = useMemo(() => {
    const map = new Map();
    classGroupMembers.forEach((member) => {
      if (!map.has(member.group_id)) map.set(member.group_id, []);
      map.get(member.group_id).push(member.student_id);
    });
    return map;
  }, [classGroupMembers]);
  const grouped = useMemo(
    () => classGroups.map((group) => ({
      group,
      members: (memberIdsByGroupId.get(group.id) || [])
        .map((studentId) => studentsById.get(studentId))
        .filter((student) => student && classStudentIdSet.has(student.id)),
    })),
    [classGroups, classStudentIdSet, memberIdsByGroupId, studentsById]
  );
  const visibleGrouped = grouped.slice(0, visibleGroupCardCount);
  const groupsDataIsPending = deferredStudents !== students || deferredGroups !== groups ||
    deferredGroupMembers !== groupMembers || deferredGroupConstraints !== groupConstraints;
  const groupSize = Number(groupGenForm.size) || 4;
  const genderCounts = new Map();
  if (groupGenForm.separateGender) {
    classStudents.forEach((student) => {
      const gender = (student.gender || "").trim().toLowerCase() || "prefer not to say";
      genderCounts.set(gender, (genderCounts.get(gender) || 0) + 1);
    });
  }
  const expectedGroupCount = groupGenForm.separateGender
    ? [...genderCounts.values()].reduce((total, count) => total + Math.ceil(count / groupSize), 0)
    : Math.ceil(classStudents.length / groupSize);
  const selectedStudentA = classStudentIdSet.has(constraintForm.studentA) ? constraintForm.studentA : "";
  const selectedStudentB = classStudentIdSet.has(constraintForm.studentB) ? constraintForm.studentB : "";
  const adjustGroupSize = useCallback((delta) => {
    startTransition(() => setGroupGenForm((current) => ({
      ...current,
      size: String(Math.max(2, Math.min(10, (Number(current.size) || 4) + delta))),
    })));
  }, [setGroupGenForm]);
  const updateAcademicProfile = async (studentId, nextProfile) => {
    setSavingAcademicProfileIds((current) => new Set(current).add(studentId));
    try {
      await handleUpdateStudentAcademicLevel(studentId, nextProfile || null);
    } finally {
      setSavingAcademicProfileIds((current) => {
        const next = new Set(current);
        next.delete(studentId);
        return next;
      });
    }
  };
  const showMoreGroups = () => startTransition(() =>
    setVisibleGroupCardCount((current) => Math.min(current + VISIBLE_GROUP_CARD_STEP, grouped.length))
  );

  return {
    showAdvancedHelp, setShowAdvancedHelp, constraintToDelete, setConstraintToDelete,
    savingAcademicProfileIds, classStudents, academicProfiles, subjectsById,
    classConstraintList, constraintDisplayRows, classGroups, grouped, visibleGrouped,
    hasMoreGroups: visibleGrouped.length < grouped.length, groupsDataIsPending,
    groupSize, expectedGroupCount, selectedStudentA, selectedStudentB,
    adjustGroupSize, updateAcademicProfile, openSeparationsModal, closeSeparationsModal,
    showMoreGroups,
  };
}
