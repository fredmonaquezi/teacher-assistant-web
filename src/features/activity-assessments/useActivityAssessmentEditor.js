import { format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import { criterionKey } from "../../utils/activityAssessmentCriteria";
import {
  ACTIVITY_ASSESSMENT_SCALES,
  activityAssessmentOptions,
  convertActivityAssessmentValue,
} from "../../utils/activityAssessmentScale";
import { fetchActivityAssessment, saveActivityAssessment } from "./activityAssessmentRepository";
import {
  OTHER_SUBJECT_VALUE,
  byStudentName,
  createEmptyCriterion,
  criterionResultKey,
  emptyStudentResult,
} from "./activityAssessmentEditorModel";

export default function useActivityAssessmentEditor({
  classId,
  activityAssessmentId,
  students,
  subjects,
  preferences,
  onSaved,
}) {
  const queryClient = useQueryClient();
  const isExistingActivity = Boolean(activityAssessmentId);
  const classStudents = useMemo(
    () => students.filter((student) => student.class_id === classId).sort(byStudentName),
    [classId, students]
  );
  const classSubjects = useMemo(
    () => subjects.filter((subject) => subject.class_id === classId).sort((first, second) => {
      const sortDifference = Number(first.sort_order || 0) - Number(second.sort_order || 0);
      return sortDifference || first.name.localeCompare(second.name, undefined, { sensitivity: "base" });
    }),
    [classId, subjects]
  );
  const [activity, setActivity] = useState({
    activityDate: format(new Date(), "yyyy-MM-dd"),
    subjectId: "",
    customSubject: "",
    title: "",
    description: "",
  });
  const [studentResults, setStudentResults] = useState({});
  const [dirtyStudentIds, setDirtyStudentIds] = useState([]);
  const [criteria, setCriteria] = useState([]);
  const [criterionResults, setCriterionResults] = useState({});
  const [dirtyCriterionResultKeys, setDirtyCriterionResultKeys] = useState([]);
  const [removedCriterionIds, setRemovedCriterionIds] = useState([]);
  const [assessmentMode, setAssessmentMode] = useState("criterion");
  const [activeCriterionKey, setActiveCriterionKey] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [assessmentScale, setAssessmentScale] = useState(
    preferences?.activityAssessmentScale === ACTIVITY_ASSESSMENT_SCALES.GRADE
      ? ACTIVITY_ASSESSMENT_SCALES.GRADE
      : ACTIVITY_ASSESSMENT_SCALES.OUTCOME
  );
  const assessmentOptions = useMemo(() => activityAssessmentOptions(assessmentScale), [assessmentScale]);
  const assessmentValues = useMemo(() => assessmentOptions.map((option) => option.value), [assessmentOptions]);
  const resultLabel = assessmentScale === ACTIVITY_ASSESSMENT_SCALES.GRADE ? "Grade" : "Outcome";
  const activityQuery = useQuery({
    queryKey: ["activity-assessment", classId, activityAssessmentId],
    queryFn: () => fetchActivityAssessment(supabase, { activityAssessmentId, classId }),
    enabled: isExistingActivity,
  });

  const suggestedOutcomeForStudent = (studentId) => {
    const outcomes = criteria
      .map((criterion) => criterionResults[criterionResultKey(criterionKey(criterion), studentId)]?.outcome)
      .filter(Boolean);
    if (!outcomes.length) return "";
    const averageRank = outcomes.reduce(
      (total, outcome) => total + assessmentValues.indexOf(outcome), 0
    ) / outcomes.length;
    return assessmentValues[Math.round(averageRank)] || "";
  };
  const effectiveOutcomeForStudent = (studentId) =>
    studentResults[studentId]?.outcome || suggestedOutcomeForStudent(studentId);
  const assessedCount = criteria.length
    ? classStudents.filter((student) => criteria.every((criterion) =>
        criterionResults[criterionResultKey(criterionKey(criterion), student.id)]?.outcome
      )).length
    : classStudents.filter((student) => effectiveOutcomeForStudent(student.id)).length;

  useEffect(() => {
    if (!activityQuery.data) return;
    const { activity: row, entries, criteria: loadedRows } = activityQuery.data;
    const matchingSubject = classSubjects.find((subject) =>
      subject.id === row.subject_id ||
      subject.name.trim().toLocaleLowerCase() === row.subject.trim().toLocaleLowerCase()
    );
    setActivity({
      activityDate: row.activity_date,
      subjectId: matchingSubject?.id || OTHER_SUBJECT_VALUE,
      customSubject: matchingSubject ? "" : row.subject,
      title: row.title || row.subject,
      description: row.description,
    });
    setAssessmentScale(
      row.assessment_scale === ACTIVITY_ASSESSMENT_SCALES.GRADE
        ? ACTIVITY_ASSESSMENT_SCALES.GRADE
        : ACTIVITY_ASSESSMENT_SCALES.OUTCOME
    );
    setStudentResults(Object.fromEntries(entries.map((entry) => [entry.student_id, {
      outcome: entry.outcome,
      notes: entry.notes || "",
      assessedAt: entry.created_at,
    }])));
    setDirtyStudentIds([]);
    const loadedCriteria = loadedRows.map((criterion) => ({
      id: criterion.id,
      title: criterion.title,
      description: criterion.description || "",
    }));
    setCriteria(loadedCriteria);
    setActiveCriterionKey(loadedCriteria[0]?.id || "");
    setCriterionResults(Object.fromEntries(loadedRows.flatMap((criterion) =>
      (criterion.activity_assessment_criterion_results || []).map((result) => [
        criterionResultKey(criterion.id, result.student_id),
        { id: result.id, outcome: result.outcome, notes: result.notes || "", observedAt: result.observed_at },
      ])
    )));
    setDirtyCriterionResultKeys([]);
    setRemovedCriterionIds([]);
    setError("");
  }, [activityQuery.data, classSubjects]);

  const updateStudentResult = (studentId, field, value) => {
    setStudentResults((current) => ({
      ...current,
      [studentId]: { ...(current[studentId] || emptyStudentResult()), [field]: value },
    }));
    setDirtyStudentIds((current) => current.includes(studentId) ? current : [...current, studentId]);
  };
  const setOutcomeForAll = (outcome) => {
    setStudentResults((current) => Object.fromEntries(classStudents.map((student) => [
      student.id,
      { ...(current[student.id] || emptyStudentResult()), outcome },
    ])));
    setDirtyStudentIds(classStudents.map((student) => student.id));
  };
  const changeAssessmentScale = (nextScale) => {
    if (isExistingActivity || nextScale === assessmentScale) return;
    setStudentResults((current) => Object.fromEntries(Object.entries(current).map(([studentId, result]) => [
      studentId,
      { ...result, outcome: convertActivityAssessmentValue(result.outcome, nextScale) },
    ])));
    setCriterionResults((current) => Object.fromEntries(Object.entries(current).map(([key, result]) => [
      key,
      { ...result, outcome: convertActivityAssessmentValue(result.outcome, nextScale) },
    ])));
    setAssessmentScale(nextScale);
  };
  const addCriterion = () => {
    const criterion = createEmptyCriterion();
    setCriteria((current) => [...current, criterion]);
    setActiveCriterionKey(criterion.clientId);
  };
  const updateCriterion = (key, field, value) => setCriteria((current) =>
    current.map((criterion) => criterionKey(criterion) === key ? { ...criterion, [field]: value } : criterion)
  );
  const moveCriterion = (index, direction) => setCriteria((current) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= current.length) return current;
    const next = [...current];
    [next[index], next[targetIndex]] = [next[targetIndex], next[index]];
    return next;
  });
  const removeCriterion = (key) => {
    const criterion = criteria.find((item) => criterionKey(item) === key);
    if (!criterion || (criterion.id && !window.confirm(`Remove “${criterion.title}” and its recorded results?`))) return;
    const nextCriteria = criteria.filter((item) => criterionKey(item) !== key);
    setCriteria(nextCriteria);
    setCriterionResults((current) => Object.fromEntries(
      Object.entries(current).filter(([resultKey]) => !resultKey.startsWith(`${key}:`))
    ));
    setDirtyCriterionResultKeys((current) => current.filter((item) => !item.startsWith(`${key}:`)));
    if (criterion.id) setRemovedCriterionIds((current) => [...current, criterion.id]);
    if (activeCriterionKey === key) setActiveCriterionKey(nextCriteria[0] ? criterionKey(nextCriteria[0]) : "");
  };
  const updateCriterionResult = (criterionId, studentId, field, value) => {
    const key = criterionResultKey(criterionId, studentId);
    setCriterionResults((current) => ({
      ...current,
      [key]: { ...(current[key] || { outcome: "", notes: "", observedAt: "" }), [field]: value },
    }));
    setDirtyCriterionResultKeys((current) => current.includes(key) ? current : [...current, key]);
    setDirtyStudentIds((current) => current.includes(studentId) ? current : [...current, studentId]);
  };
  const saveAssessment = async (event) => {
    event.preventDefault();
    setError("");
    if (criteria.some((criterion) => !criterion.title.trim())) {
      setError("Give every assessment criterion a title, or remove the empty criterion.");
      return;
    }
    setSaving(true);
    const selectedSubject = classSubjects.find((subject) => subject.id === activity.subjectId);
    const studentIdsToSave = isExistingActivity
      ? dirtyStudentIds
      : classStudents.filter((student) => effectiveOutcomeForStudent(student.id)).map((student) => student.id);
    try {
      await saveActivityAssessment(supabase, {
        activityAssessmentId,
        classId,
        activityPayload: {
          class_id: classId,
          activity_date: activity.activityDate,
          subject_id: selectedSubject?.id || null,
          subject: selectedSubject?.name || activity.customSubject.trim(),
          title: activity.title.trim(),
          description: activity.description.trim(),
          assessment_scale: assessmentScale,
        },
        criteria,
        removedCriterionIds,
        criterionResults,
        dirtyCriterionResultKeys,
        classStudents,
        studentRows: studentIdsToSave.filter((studentId) => effectiveOutcomeForStudent(studentId)).map((studentId) => ({
          student_id: studentId,
          outcome: effectiveOutcomeForStudent(studentId),
          notes: studentResults[studentId]?.notes?.trim() || null,
        })),
        criterionKey,
        criterionResultKey,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["class-activity-history", classId] }),
        queryClient.invalidateQueries({ queryKey: ["student-activity-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["groups"] }),
      ]);
      onSaved();
    } catch (saveError) {
      setError(saveError.message || "The activity assessment could not be saved.");
    } finally {
      setSaving(false);
    }
  };

  return {
    isExistingActivity, classStudents, classSubjects, activity, setActivity,
    studentResults, criteria, criterionResults, assessmentMode, setAssessmentMode,
    activeCriterionKey, setActiveCriterionKey, saving, assessmentScale, assessmentOptions, resultLabel,
    loadingActivity: isExistingActivity && activityQuery.isPending,
    displayError: error || activityQuery.error?.message || "",
    assessedCount, suggestedOutcomeForStudent, updateStudentResult, setOutcomeForAll, changeAssessmentScale,
    addCriterion, updateCriterion, moveCriterion, removeCriterion, updateCriterionResult,
    saveAssessment,
  };
}
