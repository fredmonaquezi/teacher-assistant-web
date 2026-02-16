import { useEffect, useMemo, useRef, useState } from "react";
import { DEFAULT_PROFILE_PREFERENCES } from "../constants/options";
import { DEFAULT_RUBRICS } from "../data/defaultRubrics";
import { supabase } from "../supabaseClient";
import {
  averageFromPercents,
  getAssessmentMaxScore,
  scoreToPercent,
} from "../utils/assessmentMetrics";

function useTeacherWorkspaceData() {
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
  const [seedingRubrics, setSeedingRubrics] = useState(false);
  const [groups, setGroups] = useState([]);
  const [groupMembers, setGroupMembers] = useState([]);
  const [groupConstraints, setGroupConstraints] = useState([]);
  const [loading, setLoading] = useState(true);
  const [formError, setFormError] = useState("");
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

  useEffect(() => {
    localStorage.setItem("ta_profile_preferences", JSON.stringify(profilePreferences));
  }, [profilePreferences]);
  const [runningRecordForm, setRunningRecordForm] = useState({
    studentId: "",
    recordDate: "",
    textTitle: "",
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
  const [groupsShowAdvanced, setGroupsShowAdvanced] = useState(true);
  const [groupsShowSeparations, setGroupsShowSeparations] = useState(false);
  const [isGeneratingGroups, setIsGeneratingGroups] = useState(false);
  const groupsScrollTopRef = useRef(0);

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
    loadData();
  }, []);

  const handleCreateClass = async (event) => {
    event.preventDefault();
    setFormError("");

    const maxSortOrder = classes.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)),
      -1
    );
    const inferredSortOrder = maxSortOrder + 1;
    const sortOrder = classForm.sortOrder ? Number(classForm.sortOrder) : inferredSortOrder;
    const payload = {
      name: classForm.name.trim(),
      grade_level: classForm.gradeLevel.trim() || null,
      school_year: classForm.schoolYear.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.name) {
      setFormError("Class name is required.");
      return;
    }

    const { error } = await supabase.from("classes").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setClassForm({ name: "", gradeLevel: "", schoolYear: "", sortOrder: "" });
    await loadData();
  };

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = studentForm.sortOrder ? Number(studentForm.sortOrder) : 0;
    const payload = {
      first_name: studentForm.firstName.trim(),
      last_name: studentForm.lastName.trim(),
      gender: studentForm.gender.trim() || "Prefer not to say",
      class_id: studentForm.classId || null,
      notes: studentForm.notes.trim() || null,
      is_participating_well: !!studentForm.isParticipatingWell,
      needs_help: !!studentForm.needsHelp,
      missing_homework: !!studentForm.missingHomework,
      separation_list: studentForm.separationList.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.first_name || !payload.last_name) {
      setFormError("Student first and last name are required.");
      return false;
    }

    const { data: insertedStudent, error } = await supabase
      .from("students")
      .insert(payload)
      .select("id,class_id")
      .single();
    if (error || !insertedStudent?.id) {
      setFormError(error?.message || "Failed to create student.");
      return false;
    }

    if (insertedStudent.class_id) {
      const { data: classAssessments, error: assessmentsError } = await supabase
        .from("assessments")
        .select("id")
        .eq("class_id", insertedStudent.class_id);

      if (assessmentsError) {
        setFormError(`Student created, but assessment linking failed: ${assessmentsError.message}`);
      } else if (classAssessments && classAssessments.length > 0) {
        const rows = classAssessments.map((assessment) => ({
          assessment_id: assessment.id,
          student_id: insertedStudent.id,
          score: null,
          notes: null,
        }));

        const { error: linkError } = await supabase
          .from("assessment_entries")
          .upsert(rows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });

        if (linkError) {
          setFormError(`Student created, but assessment linking failed: ${linkError.message}`);
        }
      }
    }

    setStudentForm({
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
    await loadData();
    return true;
  };

  const handleUpdateStudent = async (studentId, updates) => {
    if (!studentId) return;
    setFormError("");

    const payload = {
      gender: updates.gender?.trim() || "Prefer not to say",
      notes: updates.notes?.trim() || null,
      is_participating_well: !!updates.isParticipatingWell,
      needs_help: !!updates.needsHelp,
      missing_homework: !!updates.missingHomework,
    };

    if (typeof updates.separationList === "string") {
      payload.separation_list = updates.separationList.trim() || null;
    }

    const { error } = await supabase.from("students").update(payload).eq("id", studentId);
    if (error) {
      setFormError(error.message);
      return;
    }

    await loadData();
  };

  const handleDeleteClass = async (classId) => {
    if (!window.confirm("Delete this class and all related data?")) return;
    setFormError("");
    const { error } = await supabase.from("classes").delete().eq("id", classId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleUpdateSortOrder = async (table, id, currentOrder, delta) => {
    if (!id) return;
    const nextOrder = Math.max(0, Number(currentOrder ?? 0) + delta);
    const { error } = await supabase.from(table).update({ sort_order: nextOrder }).eq("id", id);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleSwapSortOrder = async (table, items, draggedId, targetId) => {
    if (!Array.isArray(items) || !draggedId || !targetId || draggedId === targetId) return;

    const fromIndex = items.findIndex((item) => item.id === draggedId);
    const toIndex = items.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;

    const reordered = [...items];
    const [movedItem] = reordered.splice(fromIndex, 1);
    reordered.splice(toIndex, 0, movedItem);

    const changedUpdates = reordered
      .map((item, index) => ({
        id: item.id,
        sort_order: index,
      }))
      .filter((update) => {
        const original = items.find((item) => item.id === update.id);
        return Number(original?.sort_order ?? 0) !== update.sort_order;
      });

    if (!changedUpdates.length) return;

    const updateResults = await Promise.all(
      changedUpdates.map((update) =>
        supabase.from(table).update({ sort_order: update.sort_order }).eq("id", update.id)
      )
    );

    const updateError = updateResults.find((result) => result.error)?.error;
    if (updateError) {
      setFormError(updateError.message);
      return;
    }

    await loadData();
  };

  const handleUpdateAttendanceEntry = async (entryId, updates) => {
    if (!entryId) return;
    setFormError("");
    const { error } = await supabase.from("attendance_entries").update(updates).eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleUpdateAssessmentEntry = async (entryId, updates) => {
    if (!entryId) return;
    setFormError("");
    const { error } = await supabase.from("assessment_entries").update(updates).eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateRunningRecord = async (event) => {
    event.preventDefault();
    setFormError("");

    const totalWords = runningRecordForm.totalWords ? Number(runningRecordForm.totalWords) : 0;
    const errors = runningRecordForm.errors ? Number(runningRecordForm.errors) : 0;
    const selfCorrections = runningRecordForm.selfCorrections
      ? Number(runningRecordForm.selfCorrections)
      : 0;

    if (!runningRecordForm.studentId) {
      setFormError("Select a student for the running record.");
      return false;
    }
    if (!runningRecordForm.recordDate) {
      setFormError("Enter a date for the running record (YYYY-MM-DD).");
      return false;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(runningRecordForm.recordDate)) {
      setFormError("Date format should be YYYY-MM-DD.");
      return false;
    }
    if (!Number.isFinite(totalWords) || totalWords <= 0) {
      setFormError("Total words must be greater than 0.");
      return false;
    }
    if (errors < 0 || selfCorrections < 0) {
      setFormError("Errors and self-corrections must be 0 or more.");
      return false;
    }

    const accuracy = ((totalWords - errors) / totalWords) * 100;
    let level = "Frustration (<90%)";
    if (accuracy >= 95) level = "Independent (95-100%)";
    else if (accuracy >= 90) level = "Instructional (90-94%)";

    const scRatio = selfCorrections > 0 ? (errors + selfCorrections) / selfCorrections : null;

    const payload = {
      student_id: runningRecordForm.studentId,
      record_date: runningRecordForm.recordDate,
      text_title: runningRecordForm.textTitle.trim() || null,
      total_words: totalWords,
      errors,
      self_corrections: selfCorrections,
      accuracy_pct: Math.round(accuracy * 10) / 10,
      level,
      sc_ratio: scRatio ? Math.round(scRatio * 10) / 10 : null,
      notes: runningRecordForm.notes.trim() || null,
    };

    const { error } = await supabase.from("running_records").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    setRunningRecordForm({
      studentId: "",
      recordDate: "",
      textTitle: "",
      totalWords: "",
      errors: "",
      selfCorrections: "",
      notes: "",
    });
    await loadData();
    return true;
  };

  const handleDeleteRunningRecord = async (recordId) => {
    if (!recordId) return;
    if (!window.confirm("Delete this running record?")) return;
    setFormError("");
    const { error } = await supabase.from("running_records").delete().eq("id", recordId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateSubject = async (event, classIdOverride) => {
    event.preventDefault();
    setFormError("");

    const targetClassId = classIdOverride || subjectForm.classId;
    const maxSortOrder = subjects
      .filter((item) => item.class_id === targetClassId)
      .reduce((maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)), -1);
    const inferredSortOrder = maxSortOrder + 1;
    const sortOrder = subjectForm.sortOrder ? Number(subjectForm.sortOrder) : inferredSortOrder;
    const payload = {
      class_id: targetClassId,
      name: subjectForm.name.trim(),
      description: subjectForm.description.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : 0,
    };

    if (!payload.class_id || !payload.name) {
      setFormError("Select a class and enter a subject name.");
      return;
    }

    const { error } = await supabase.from("subjects").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setSubjectForm({ classId: "", name: "", description: "", sortOrder: "" });
    await loadData();
  };

  const handleCreateUnit = async (event, subjectIdOverride) => {
    event.preventDefault();
    setFormError("");

    const targetSubjectId = subjectIdOverride || unitForm.subjectId;
    const sortOrder = unitForm.sortOrder ? Number(unitForm.sortOrder) : null;
    const inferredSortOrder =
      units
        .filter((unit) => unit.subject_id === targetSubjectId)
        .reduce((maxValue, unit) => Math.max(maxValue, Number(unit.sort_order ?? -1)), -1) + 1;
    const payload = {
      subject_id: targetSubjectId,
      name: unitForm.name.trim(),
      description: unitForm.description.trim() || null,
      sort_order: Number.isFinite(sortOrder) ? sortOrder : inferredSortOrder,
    };

    if (!payload.subject_id || !payload.name) {
      setFormError("Select a subject and enter a unit name.");
      return;
    }

    const { error } = await supabase.from("units").insert(payload);
    if (error) {
      setFormError(error.message);
      return;
    }

    setUnitForm({ subjectId: "", name: "", description: "", sortOrder: "" });
    await loadData();
  };

  const handleDeleteUnit = async (unitId) => {
    if (!unitId) return;
    setFormError("");
    const { error } = await supabase.from("units").delete().eq("id", unitId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCreateAssessmentForUnit = async (event, unitId, subjectId, classId, formValues = null) => {
    event.preventDefault();
    setFormError("");

    const form = event.target;
    const title = (formValues?.title ?? form.elements["title"]?.value ?? "").trim();
    const assessmentDate = (formValues?.assessmentDate ?? form.elements["assessmentDate"]?.value) || null;
    const maxScoreRaw = formValues?.maxScore ?? form.elements["maxScore"]?.value;
    const maxScore = maxScoreRaw ? Number(maxScoreRaw) : 10;
    const inferredSortOrder =
      assessments
        .filter((item) => item.unit_id === unitId)
        .reduce((maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)), -1) + 1;

    if (!title) {
      setFormError("Assessment title is required.");
      return false;
    }
    if (!Number.isFinite(maxScore) || maxScore <= 0) {
      setFormError("Max score must be greater than 0.");
      return false;
    }

    const payload = {
      title,
      assessment_date: assessmentDate,
      max_score: maxScore,
      class_id: classId || null,
      subject_id: subjectId || null,
      unit_id: unitId || null,
      sort_order: inferredSortOrder,
    };

    const { data: insertedAssessment, error } = await supabase
      .from("assessments")
      .insert(payload)
      .select("id")
      .single();
    if (error || !insertedAssessment?.id) {
      setFormError(error?.message || "Failed to create assessment.");
      return false;
    }

    if (classId) {
      const classStudents = students.filter((student) => student.class_id === classId);
      if (classStudents.length > 0) {
        const entryRows = classStudents.map((student) => ({
          assessment_id: insertedAssessment.id,
          student_id: student.id,
          score: null,
          notes: null,
        }));

        const { error: entriesError } = await supabase
          .from("assessment_entries")
          .upsert(entryRows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });
        if (entriesError) {
          setFormError(
            `Assessment created, but assigning students failed: ${entriesError.message}`
          );
        }
      }
    }

    form.reset();
    await loadData();
    return true;
  };

  const handleDeleteAssessment = async (assessmentId) => {
    if (!assessmentId) return;
    setFormError("");
    const { error } = await supabase.from("assessments").delete().eq("id", assessmentId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const handleCopyAssessmentsFromUnit = async (
    sourceUnitId,
    targetUnitId,
    targetSubjectId,
    targetClassId
  ) => {
    if (!sourceUnitId || !targetUnitId) return;
    setFormError("");

    const sourceUnit = units.find((item) => item.id === sourceUnitId);
    const targetUnit = units.find((item) => item.id === targetUnitId);
    const sourceSubject = subjects.find((item) => item.id === sourceUnit?.subject_id);
    const targetSubject =
      subjects.find((item) => item.id === targetUnit?.subject_id) ||
      subjects.find((item) => item.id === targetSubjectId);

    if (!sourceUnit || !targetUnit || !sourceSubject || !targetSubject) {
      setFormError("Invalid source or target selection.");
      return;
    }

    if (sourceSubject.class_id !== targetSubject.class_id) {
      setFormError("Copy is only allowed between units of the same class/year.");
      return;
    }

    const sourceAssessments = assessments
      .filter((item) => item.unit_id === sourceUnitId)
      .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0));

    if (sourceAssessments.length === 0) {
      setFormError("No assessments found in selected source unit.");
      return;
    }

    const existingCount = assessments.filter((item) => item.unit_id === targetUnitId).length;
    const rows = sourceAssessments.map((item, index) => ({
      title: item.title,
      assessment_date: null,
      max_score: item.max_score ?? null,
      notes: null,
      class_id: targetClassId || null,
      subject_id: targetSubjectId || null,
      unit_id: targetUnitId,
      sort_order: existingCount + index,
    }));

    const { data: insertedRows, error: insertError } = await supabase
      .from("assessments")
      .insert(rows)
      .select("id");

    if (insertError || !insertedRows) {
      setFormError(insertError?.message || "Failed to copy assessments.");
      return;
    }

    if (targetClassId) {
      const classStudents = students.filter((student) => student.class_id === targetClassId);
      if (classStudents.length > 0) {
        const entryRows = [];
        insertedRows.forEach((assessment) => {
          classStudents.forEach((student) => {
            entryRows.push({
              assessment_id: assessment.id,
              student_id: student.id,
              score: null,
              notes: null,
            });
          });
        });

        const { error: entriesError } = await supabase
          .from("assessment_entries")
          .upsert(entryRows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });
        if (entriesError) {
          setFormError(`Assessments copied, but assigning students failed: ${entriesError.message}`);
        }
      }
    }

    await loadData();
  };

  const handleCreateDevelopmentScore = async (event, studentIdOverride) => {
    event.preventDefault();
    await handleCreateDevelopmentScoreEntry({
      studentId: studentIdOverride || developmentScoreForm.studentId,
      criterionId: developmentScoreForm.criterionId,
      rating: developmentScoreForm.rating,
      date: developmentScoreForm.date,
      notes: developmentScoreForm.notes,
    });
  };

  const handleCreateDevelopmentScoreEntry = async ({
    studentId,
    criterionId,
    rating,
    date,
    notes,
  }) => {
    setFormError("");

    const payload = {
      student_id: studentId,
      criterion_id: criterionId,
      rating: Number(rating),
      score_date: date || null,
      notes: notes?.trim() || null,
    };

    if (!payload.student_id || !payload.criterion_id) {
      setFormError("Select a student and a rubric criterion.");
      return false;
    }
    if (!Number.isFinite(payload.rating) || payload.rating < 1 || payload.rating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return false;
    }

    const { error } = await supabase.from("development_scores").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    setDevelopmentScoreForm({
      studentId: "",
      criterionId: "",
      rating: "3",
      date: "",
      notes: "",
    });
    await loadData();
    return true;
  };

  const handleUpdateDevelopmentScore = async (scoreId, updates) => {
    if (!scoreId) return false;
    setFormError("");
    const nextRating = Number(updates?.rating);
    if (!Number.isFinite(nextRating) || nextRating < 1 || nextRating > 5) {
      setFormError("Rating must be between 1 and 5.");
      return false;
    }

    const payload = {
      rating: nextRating,
      score_date: updates?.date || null,
      notes: updates?.notes?.trim() || null,
    };

    const { error } = await supabase.from("development_scores").update(payload).eq("id", scoreId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    await loadData();
    return true;
  };

  const handleSeedDefaultRubrics = async () => {
    setFormError("");
    setSeedingRubrics(true);

    const existingTitles = new Set(
      rubrics.map((rubric) => rubric.title.trim().toLowerCase())
    );

    try {
      for (const rubric of DEFAULT_RUBRICS) {
        if (existingTitles.has(rubric.title.trim().toLowerCase())) {
          continue;
        }
        const { data: rubricRow, error: rubricError } = await supabase
          .from("rubrics")
          .insert({
            title: rubric.title,
            subject: rubric.subject,
            grade_band: rubric.gradeBand,
            description: rubric.description ?? null,
          })
          .select()
          .single();

        if (rubricError) throw rubricError;

        for (const category of rubric.categories) {
          const { data: categoryRow, error: categoryError } = await supabase
            .from("rubric_categories")
            .insert({
              rubric_id: rubricRow.id,
              name: category.name,
            })
            .select()
            .single();

          if (categoryError) throw categoryError;

          const criteriaRows = category.criteria.map((criterion) => ({
            category_id: categoryRow.id,
            label: criterion.label,
            description: criterion.description,
          }));

          if (criteriaRows.length > 0) {
            const { error: criteriaError } = await supabase
              .from("rubric_criteria")
              .insert(criteriaRows);
            if (criteriaError) throw criteriaError;
          }
        }
      }
    } catch (error) {
      setFormError(error.message || "Failed to seed default rubrics.");
      setSeedingRubrics(false);
      return;
    }

    await loadData();
    setSeedingRubrics(false);
  };

  const handleAddConstraint = async (event) => {
    if (event?.preventDefault) event.preventDefault();
    setFormError("");

    const studentA = constraintForm.studentA;
    const studentB = constraintForm.studentB;

    if (!studentA || !studentB || studentA === studentB) {
      setFormError("Select two different students.");
      return;
    }

    const [firstId, secondId] = studentA < studentB ? [studentA, studentB] : [studentB, studentA];

    const { error } = await supabase.from("group_constraints").insert({
      student_a: firstId,
      student_b: secondId,
    });

    if (error) {
      setFormError(error.message);
      return;
    }

    setConstraintForm({ studentA: "", studentB: "" });
    await loadData();
  };

  const handleDeleteConstraint = async (constraintId) => {
    if (!constraintId) return;
    if (!window.confirm("Delete this separation rule?")) return;
    setFormError("");
    const { error } = await supabase.from("group_constraints").delete().eq("id", constraintId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await loadData();
  };

  const buildConstraintSet = (studentList) => {
    const set = new Set();
    const studentIdSet = new Set(studentList.map((student) => student.id));
    const addPair = (a, b) => {
      if (!studentIdSet.has(a) || !studentIdSet.has(b) || a === b) return;
      const [firstId, secondId] = a < b ? [a, b] : [b, a];
      set.add(`${firstId}|${secondId}`);
    };
    groupConstraints.forEach((constraint) => {
      addPair(constraint.student_a, constraint.student_b);
    });
    studentList.forEach((student) => {
      const rawList = student.separation_list || "";
      rawList
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean)
        .forEach((otherId) => addPair(student.id, otherId));
    });
    return set;
  };

  const canJoinGroup = (studentId, group, constraintSet) => {
    for (const memberId of group) {
      const [firstId, secondId] =
        studentId < memberId ? [studentId, memberId] : [memberId, studentId];
      if (constraintSet.has(`${firstId}|${secondId}`)) {
        return false;
      }
    }
    return true;
  };

  const shuffleArray = (input) => {
    const arr = [...input];
    for (let i = arr.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  };

  const normalizeGender = (value) => (value || "").trim().toLowerCase();

  const buildAbilityProfiles = (classId, classStudents) => {
    const classAssessmentMap = new Map(
      assessments
        .filter((assessment) => assessment.class_id === classId)
        .map((assessment) => [assessment.id, assessment])
    );
    const scoreSamplesByStudent = new Map();

    assessmentEntries.forEach((entry) => {
      const assessment = classAssessmentMap.get(entry.assessment_id);
      if (!assessment) return;
      const percent = scoreToPercent(entry.score, getAssessmentMaxScore(assessment));
      if (!Number.isFinite(percent)) return;
      if (!scoreSamplesByStudent.has(entry.student_id)) {
        scoreSamplesByStudent.set(entry.student_id, []);
      }
      scoreSamplesByStudent.get(entry.student_id).push(percent);
    });

    const averages = classStudents
      .map((student) => {
        const samples = scoreSamplesByStudent.get(student.id) || [];
        if (samples.length === 0) return null;
        return averageFromPercents(samples);
      })
      .filter((value) => Number.isFinite(value))
      .sort((a, b) => a - b);

    const lowerIndex = averages.length
      ? Math.max(0, Math.floor((averages.length - 1) * 0.33))
      : -1;
    const upperIndex = averages.length
      ? Math.max(0, Math.floor((averages.length - 1) * 0.66))
      : -1;
    const lowerThreshold = lowerIndex >= 0 ? averages[lowerIndex] : null;
    const upperThreshold = upperIndex >= 0 ? averages[upperIndex] : null;

    const abilityByStudentId = new Map();

    classStudents.forEach((student) => {
      const samples = scoreSamplesByStudent.get(student.id) || [];
      const avgPercent = samples.length ? averageFromPercents(samples) : null;
      let abilityBand = "unknown";
      let abilityRank = 1;

      if (Number.isFinite(avgPercent)) {
        if (!Number.isFinite(lowerThreshold) || !Number.isFinite(upperThreshold)) {
          abilityBand = "proficient";
          abilityRank = 1;
        } else if (avgPercent <= lowerThreshold) {
          abilityBand = "developing";
          abilityRank = 0;
        } else if (avgPercent >= upperThreshold) {
          abilityBand = "advanced";
          abilityRank = 2;
        } else {
          abilityBand = "proficient";
          abilityRank = 1;
        }
      }

      abilityByStudentId.set(student.id, {
        averagePercent: avgPercent,
        band: abilityBand,
        rank: abilityRank,
        isSupportPartner:
          !student.needs_help &&
          Number.isFinite(avgPercent) &&
          (abilityBand === "advanced" || avgPercent >= 75),
      });
    });

    return abilityByStudentId;
  };

  const pickBestStudent = (candidates, group, constraintSet, options, abilityByStudentId) => {
    let filtered = candidates.filter((student) =>
      canJoinGroup(student.id, group.map((g) => g.id), constraintSet)
    );
    if (filtered.length === 0) return null;

    if (options.balanceGender && group.length > 0) {
      const groupGenders = new Set(group.map((s) => normalizeGender(s.gender)));
      const differentGender = filtered.find(
        (student) => !groupGenders.has(normalizeGender(student.gender))
      );
      if (differentGender) return differentGender;
    }

    if (options.pairSupportPartners && group.length > 0) {
      const hasNeedsHelp = group.some((s) => s.needs_help);
      const hasSupportPartner = group.some(
        (s) => abilityByStudentId.get(s.id)?.isSupportPartner
      );

      if (hasNeedsHelp && !hasSupportPartner) {
        const candidate = filtered.find(
          (s) => !s.needs_help && abilityByStudentId.get(s.id)?.isSupportPartner
        );
        if (candidate) return candidate;
      }

      if (hasSupportPartner && !hasNeedsHelp) {
        const candidate = filtered.find((s) => s.needs_help);
        if (candidate) return candidate;
      }
    }

    if (options.balanceAbility && group.length > 0) {
      const bandCounts = group.reduce((acc, student) => {
        const band = abilityByStudentId.get(student.id)?.band || "unknown";
        acc.set(band, (acc.get(band) || 0) + 1);
        return acc;
      }, new Map());

      const ranked = [...filtered].sort((a, b) => {
        const aBand = abilityByStudentId.get(a.id)?.band || "unknown";
        const bBand = abilityByStudentId.get(b.id)?.band || "unknown";
        const aBandCount = bandCounts.get(aBand) || 0;
        const bBandCount = bandCounts.get(bBand) || 0;
        if (aBandCount !== bBandCount) return aBandCount - bBandCount;

        const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
        const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
        if (aRank !== bRank) return aRank - bRank;

        const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
        const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
        return aAvg - bAvg;
      });

      if (ranked.length > 0) return ranked[0];
    }

    return filtered[0];
  };

  const generateGroups = (
    studentList,
    groupSize,
    constraintSet,
    options,
    abilityByStudentId,
    maxAttempts = 200
  ) => {
    if (studentList.length === 0) return [];
    const size = Math.max(2, groupSize);
    let available = [...studentList];

    if (options.balanceAbility) {
      available.sort((a, b) => {
        const aRank = abilityByStudentId.get(a.id)?.rank ?? 1;
        const bRank = abilityByStudentId.get(b.id)?.rank ?? 1;
        if (aRank !== bRank) return aRank - bRank;
        const aAvg = abilityByStudentId.get(a.id)?.averagePercent ?? -1;
        const bAvg = abilityByStudentId.get(b.id)?.averagePercent ?? -1;
        return aAvg - bAvg;
      });
    } else if (options.pairSupportPartners) {
      available.sort((a, b) => (a.needs_help ? 0 : 1) - (b.needs_help ? 0 : 1));
    } else {
      available = shuffleArray(available);
    }

    const groupsDraft = [];
    let attempts = 0;

    while (available.length > 0 && attempts < maxAttempts) {
      attempts += 1;
      const group = [];

      while (group.length < size && available.length > 0 && attempts < maxAttempts) {
        const candidate = pickBestStudent(available, group, constraintSet, options, abilityByStudentId);
        if (!candidate) break;
        group.push(candidate);
        available = available.filter((s) => s.id !== candidate.id);
      }

      if (group.length > 0) groupsDraft.push(group);
    }

    return groupsDraft;
  };

  const handleGenerateGroups = async () => {
    if (isGeneratingGroups) return;
    setIsGeneratingGroups(true);
    setFormError("");
    try {
      const classId = groupGenForm.classId;
      const size = Number(groupGenForm.size);
      const prefix = groupGenForm.prefix.trim() || "Group";
      const clearExisting = groupGenForm.clearExisting;
      const balanceGender = groupGenForm.balanceGender;
      const balanceAbility = groupGenForm.balanceAbility;
      const pairSupportPartners = groupGenForm.pairSupportPartners;
      const respectSeparations = groupGenForm.respectSeparations;

      if (!classId) {
        setFormError("Select a class to generate groups.");
        return;
      }
      if (!Number.isFinite(size) || size < 2) {
        setFormError("Group size must be 2 or more.");
        return;
      }

      const classStudents = students.filter((student) => student.class_id === classId);
      if (classStudents.length === 0) {
        setFormError("No students found in that class.");
        return;
      }

      const constraintSet = respectSeparations ? buildConstraintSet(classStudents) : new Set();
      const abilityByStudentId = buildAbilityProfiles(classId, classStudents);
      const groupList = generateGroups(
        classStudents,
        size,
        constraintSet,
        { balanceGender, balanceAbility, pairSupportPartners, respectSeparations },
        abilityByStudentId
      );
      if (!groupList) {
        setFormError("Could not satisfy the grouping rules. Try adjusting constraints or size.");
        return;
      }

      if (clearExisting) {
        const { data: existingGroups, error: groupFetchError } = await supabase
          .from("groups")
          .select("id")
          .eq("class_id", classId);
        if (groupFetchError) {
          setFormError(groupFetchError.message);
          return;
        }
        const existingIds = (existingGroups ?? []).map((g) => g.id);
        if (existingIds.length > 0) {
          const { error: memberDeleteError } = await supabase
            .from("group_members")
            .delete()
            .in("group_id", existingIds);
          if (memberDeleteError) {
            setFormError(memberDeleteError.message);
            return;
          }
          const { error: groupDeleteError } = await supabase
            .from("groups")
            .delete()
            .in("id", existingIds);
          if (groupDeleteError) {
            setFormError(groupDeleteError.message);
            return;
          }
        }
      }

      const createdGroups = [];
      for (let index = 0; index < groupList.length; index += 1) {
        const label = `${prefix} ${index + 1}`;
        const { data, error } = await supabase
          .from("groups")
          .insert({ name: label, class_id: classId })
          .select()
          .single();
        if (error) {
          setFormError(error.message);
          return;
        }
        createdGroups.push(data);
      }

      const memberRows = groupList.flatMap((memberList, idx) =>
        memberList.map((student) => ({
          group_id: createdGroups[idx].id,
          student_id: student.id,
        }))
      );

      const { error: memberError } = await supabase.from("group_members").insert(memberRows);
      if (memberError) {
        setFormError(memberError.message);
        return;
      }

      await loadData();
    } finally {
      setIsGeneratingGroups(false);
    }
  };

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
    seedingRubrics,
    groups,
    groupMembers,
    groupConstraints,
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
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleUpdateAttendanceEntry,
    handleUpdateAssessmentEntry,
    handleCreateRunningRecord,
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
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
  };
}

export default useTeacherWorkspaceData;
