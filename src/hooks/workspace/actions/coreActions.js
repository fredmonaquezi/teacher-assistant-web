import { supabase } from "../../../supabaseClient";
import { runMutation } from "./mutationHelpers";

function collectOrphanedStudents(classes, students) {
  const validClassIdSet = new Set(
    classes.map((classItem) => classItem.id).filter(Boolean)
  );

  return students.filter(
    (student) => student.class_id && !validClassIdSet.has(student.class_id)
  );
}

function createCoreActions({
  classes,
  students,
  subjects,
  units,
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
  setFormError,
  refreshCoreData,
  refreshAssessmentData,
  refreshRubricData,
  refreshGroupData,
  invalidateWorkspaceDomains,
  removeClassScopedWorkspaceData,
}) {
  const refreshBySortTable = async (table) => {
    const tableRefreshers = {
      classes: refreshCoreData,
      students: refreshCoreData,
      subjects: refreshAssessmentData,
      units: refreshAssessmentData,
      assessments: refreshAssessmentData,
      rubrics: refreshRubricData,
      rubric_categories: refreshRubricData,
      rubric_criteria: refreshRubricData,
      groups: refreshGroupData,
      group_constraints: refreshGroupData,
    };
    const refreshFn = tableRefreshers[table];
    if (refreshFn) {
      await refreshFn();
      return;
    }
    await refreshCoreData();
  };

  const handleCreateClass = async (event) => {
    event.preventDefault();

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

    const didCreate = await runMutation({
      setFormError,
      execute: () => supabase.from("classes").insert(payload),
      refresh: refreshCoreData,
      fallbackErrorMessage: "Failed to create class.",
    });
    if (!didCreate) {
      return;
    }

    setClassForm({ name: "", gradeLevel: "", schoolYear: "", sortOrder: "" });
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
    await Promise.all([refreshCoreData(), refreshAssessmentData()]);
    return true;
  };

  const handleUpdateStudent = async (studentId, updates) => {
    if (!studentId) return;

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

    await runMutation({
      setFormError,
      execute: () => supabase.from("students").update(payload).eq("id", studentId),
      refresh: refreshCoreData,
      fallbackErrorMessage: "Failed to update student.",
    });
  };

  const handleDeleteClass = async (classId) => {
    const removedStudentIds = students
      .filter((student) => student.class_id === classId)
      .map((student) => student.id);

    await runMutation({
      setFormError,
      execute: async () => {
        const studentDeleteResult = await supabase.from("students").delete().eq("class_id", classId);
        if (studentDeleteResult?.error) {
          return { error: studentDeleteResult.error };
        }

        const classDeleteResult = await supabase.from("classes").delete().eq("id", classId);
        return classDeleteResult?.error ? { error: classDeleteResult.error } : { data: true };
      },
      refresh: async () => {
        await refreshCoreData();
        removeClassScopedWorkspaceData(classId, removedStudentIds);
        await invalidateWorkspaceDomains([
          "attendance",
          "assessment",
          "rubric",
          "group",
          "calendar",
          "randomPicker",
        ]);
      },
      fallbackErrorMessage: "Failed to delete class.",
    });
  };

  const handleCleanupOrphanedStudents = async () => {
    const orphanedStudents = collectOrphanedStudents(classes, students);
    if (!orphanedStudents.length) return true;

    const orphanedStudentIds = orphanedStudents.map((student) => student.id).filter(Boolean);
    if (!orphanedStudentIds.length) return true;

    const orphanedStudentIdsByClass = orphanedStudents.reduce((acc, student) => {
      const classId = student.class_id;
      if (!classId) return acc;
      if (!acc.has(classId)) {
        acc.set(classId, []);
      }
      acc.get(classId).push(student.id);
      return acc;
    }, new Map());

    return runMutation({
      setFormError,
      execute: () => supabase.from("students").delete().in("id", orphanedStudentIds),
      refresh: async () => {
        await refreshCoreData();
        orphanedStudentIdsByClass.forEach((studentIds, orphanedClassId) => {
          removeClassScopedWorkspaceData(orphanedClassId, studentIds);
        });
        await invalidateWorkspaceDomains([
          "attendance",
          "assessment",
          "rubric",
          "group",
          "randomPicker",
        ]);
      },
      fallbackErrorMessage: "Failed to clean up orphaned students.",
    });
  };

  const handleUpdateSortOrder = async (table, id, currentOrder, delta) => {
    if (!id) return;
    const nextOrder = Math.max(0, Number(currentOrder ?? 0) + delta);
    await runMutation({
      setFormError,
      execute: () => supabase.from(table).update({ sort_order: nextOrder }).eq("id", id),
      refresh: () => refreshBySortTable(table),
      fallbackErrorMessage: "Failed to update sort order.",
    });
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

    await refreshBySortTable(table);
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
    await refreshAssessmentData();
    return true;
  };

  const handleDeleteRunningRecord = async (recordId) => {
    if (!recordId) return;
    await runMutation({
      setFormError,
      execute: () => supabase.from("running_records").delete().eq("id", recordId),
      refresh: refreshAssessmentData,
      fallbackErrorMessage: "Failed to delete running record.",
    });
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
    await refreshAssessmentData();
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
    await refreshAssessmentData();
  };

  const handleDeleteUnit = async (unitId) => {
    if (!unitId) return;
    await runMutation({
      setFormError,
      execute: () => supabase.from("units").delete().eq("id", unitId),
      refresh: refreshAssessmentData,
      fallbackErrorMessage: "Failed to delete unit.",
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
    await refreshRubricData();
    return true;
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

  const handleUpdateDevelopmentScore = async (scoreId, updates) => {
    if (!scoreId) return false;
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

    return runMutation({
      setFormError,
      execute: () => supabase.from("development_scores").update(payload).eq("id", scoreId),
      refresh: refreshRubricData,
      fallbackErrorMessage: "Failed to update development score.",
    });
  };

  return {
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleCleanupOrphanedStudents,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleCreateRunningRecord,
    handleDeleteRunningRecord,
    handleCreateSubject,
    handleCreateUnit,
    handleDeleteUnit,
    handleCreateDevelopmentScore,
    handleCreateDevelopmentScoreEntry,
    handleUpdateDevelopmentScore,
  };
}

export default createCoreActions;
