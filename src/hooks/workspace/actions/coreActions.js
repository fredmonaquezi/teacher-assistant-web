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

  const resetRunningRecordForm = () => {
    setRunningRecordForm({
      studentId: "",
      recordDate: "",
      textTitle: "",
      bookLevel: "",
      totalWords: "",
      errors: "",
      selfCorrections: "",
      notes: "",
    });
  };

  const buildRunningRecordPayload = () => {
    setFormError("");

    const bookLevel = runningRecordForm.bookLevel ? runningRecordForm.bookLevel.trim().toUpperCase() : "";
    const totalWords = runningRecordForm.totalWords ? Number(runningRecordForm.totalWords) : 0;
    const errors = runningRecordForm.errors ? Number(runningRecordForm.errors) : 0;
    const selfCorrections = runningRecordForm.selfCorrections
      ? Number(runningRecordForm.selfCorrections)
      : 0;

    if (!runningRecordForm.studentId) {
      setFormError("Select a student for the running record.");
      return null;
    }
    if (!runningRecordForm.recordDate) {
      setFormError("Enter a date for the running record (YYYY-MM-DD).");
      return null;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(runningRecordForm.recordDate)) {
      setFormError("Date format should be YYYY-MM-DD.");
      return null;
    }
    if (bookLevel && !/^[A-Z]$/.test(bookLevel)) {
      setFormError("Book level must be a single letter from A to Z.");
      return null;
    }
    if (!Number.isFinite(totalWords) || totalWords <= 0) {
      setFormError("Total words must be greater than 0.");
      return null;
    }
    if (errors < 0 || selfCorrections < 0) {
      setFormError("Errors and self-corrections must be 0 or more.");
      return null;
    }

    const accuracy = ((totalWords - errors) / totalWords) * 100;
    let level = "Frustration (<90%)";
    if (accuracy >= 95) level = "Independent (95-100%)";
    else if (accuracy >= 90) level = "Instructional (90-94%)";

    const scRatio = selfCorrections > 0 ? (errors + selfCorrections) / selfCorrections : null;

    return {
      student_id: runningRecordForm.studentId,
      record_date: runningRecordForm.recordDate,
      text_title: runningRecordForm.textTitle.trim() || null,
      book_level: bookLevel || null,
      total_words: totalWords,
      errors,
      self_corrections: selfCorrections,
      accuracy_pct: Math.round(accuracy * 10) / 10,
      level,
      sc_ratio: scRatio ? Math.round(scRatio * 10) / 10 : null,
      notes: runningRecordForm.notes.trim() || null,
    };
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

    setFormError("");
    let createdClass;
    try {
      const { data, error } = await supabase.from("classes").insert(payload).select("id").single();
      if (error || !data?.id) throw error || new Error("Failed to create class.");
      createdClass = data;
    } catch (error) {
      setFormError(error.message || "Failed to create class.");
      return false;
    }
    setClassForm({ name: "", gradeLevel: "", schoolYear: "", sortOrder: "" });
    // Once inserted, return its ID even if refresh fails: never invite a duplicate insert.
    try {
      if (await refreshCoreData() === false) throw new Error("Refresh failed");
    } catch {
      setFormError("Class created, but the class list could not be reloaded. Refresh the page to see it.");
    }
    return createdClass.id;
  };

  const handleUpdateClass = async (classId, updates) => {
    if (!classId || !classes.some((item) => item.id === classId)) {
      setFormError("Class not found.");
      return false;
    }

    const payload = {
      name: (updates?.name || "").trim(),
      grade_level: updates?.gradeLevel?.trim() || null,
      school_year: updates?.schoolYear?.trim() || null,
    };
    if (!payload.name) {
      setFormError("Class name is required.");
      return false;
    }

    return runMutation({
      setFormError,
      execute: () => supabase.from("classes").update(payload).eq("id", classId).select("id").single(),
      refresh: async () => {
        if (await refreshCoreData() === false) {
          throw new Error("Class saved, but the updated details could not be loaded. Please try again.");
        }
      },
      fallbackErrorMessage: "Failed to update class.",
    });
  };

  const handleCreateStudent = async (event, overrides = {}) => {
    event.preventDefault();
    setFormError("");

    const sortOrder = studentForm.sortOrder ? Number(studentForm.sortOrder) : 0;
    const payload = {
      first_name: studentForm.firstName.trim(),
      last_name: studentForm.lastName.trim(),
      gender: studentForm.gender.trim() || "Prefer not to say",
      class_id: overrides.classId || studentForm.classId || null,
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
    await refreshCoreData();
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

    const hasFirstName = typeof updates.firstName === "string";
    const hasLastName = typeof updates.lastName === "string";
    if (hasFirstName || hasLastName) {
      const firstName = String(updates.firstName || "").trim();
      const lastName = String(updates.lastName || "").trim();
      if (!firstName || !lastName) {
        setFormError("Student first and last name are required.");
        return false;
      }
      payload.first_name = firstName;
      payload.last_name = lastName;
    }

    if (typeof updates.separationList === "string") {
      payload.separation_list = updates.separationList.trim() || null;
    }

    return runMutation({
      setFormError,
      execute: () => supabase.from("students").update(payload).eq("id", studentId),
      refresh: refreshCoreData,
      fallbackErrorMessage: "Failed to update student.",
    });
  };

  const handleUpdateStudentAcademicLevel = async (studentId, academicLevelOverride) => {
    if (!studentId || !students.some((student) => student.id === studentId)) {
      setFormError("Student not found.");
      return false;
    }
    const allowedOverrides = new Set(["needs_support", "developing", "on_track", "extending"]);
    const normalizedOverride = academicLevelOverride || null;
    if (normalizedOverride && !allowedOverrides.has(normalizedOverride)) {
      setFormError("Choose a valid learning profile.");
      return false;
    }

    return runMutation({
      setFormError,
      execute: () =>
        supabase
          .from("students")
          .update({ academic_level_override: normalizedOverride })
          .eq("id", studentId)
          .select("id")
          .single(),
      refresh: refreshCoreData,
      fallbackErrorMessage: "Failed to update the student's learning profile.",
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
    const payload = buildRunningRecordPayload();
    if (!payload) {
      return false;
    }

    const { error } = await supabase.from("running_records").insert(payload);
    if (error) {
      setFormError(error.message);
      return false;
    }

    resetRunningRecordForm();
    await refreshAssessmentData();
    return true;
  };

  const handleUpdateRunningRecord = async (recordId, event) => {
    event?.preventDefault();
    if (!recordId) return false;

    const payload = buildRunningRecordPayload();
    if (!payload) {
      return false;
    }

    const { error } = await supabase.from("running_records").update(payload).eq("id", recordId);
    if (error) {
      setFormError(error.message);
      return false;
    }

    resetRunningRecordForm();
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
    handleUpdateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleUpdateStudentAcademicLevel,
    handleDeleteClass,
    handleCleanupOrphanedStudents,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleCreateRunningRecord,
    handleUpdateRunningRecord,
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
