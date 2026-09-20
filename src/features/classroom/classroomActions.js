import { supabase } from "../../supabaseClient";
import { runMutation } from "../shared/mutationHelpers";

function collectOrphanedStudents(classes, students) {
  const validClassIds = new Set(classes.map((classItem) => classItem.id).filter(Boolean));
  return students.filter(
    (student) => student.class_id && !validClassIds.has(student.class_id)
  );
}

function createCoreActions({
  classes = [],
  students = [],
  classForm = {},
  setClassForm = () => {},
  studentForm = {},
  setStudentForm = () => {},
  setFormError,
  refreshCoreData,
  invalidateWorkspaceDomains = async () => {},
  removeClassScopedWorkspaceData = () => {},
}) {
  const handleCreateClass = async (event) => {
    event.preventDefault();
    const maxSortOrder = classes.reduce(
      (maxValue, item) => Math.max(maxValue, Number(item.sort_order ?? -1)),
      -1
    );
    const requestedSortOrder = classForm.sortOrder ? Number(classForm.sortOrder) : maxSortOrder + 1;
    const payload = {
      name: String(classForm.name || "").trim(),
      grade_level: String(classForm.gradeLevel || "").trim() || null,
      school_year: String(classForm.schoolYear || "").trim() || null,
      sort_order: Number.isFinite(requestedSortOrder) ? requestedSortOrder : 0,
    };

    if (!payload.name) {
      setFormError("Class name is required.");
      return false;
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
      name: String(updates?.name || "").trim(),
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
    const requestedSortOrder = studentForm.sortOrder ? Number(studentForm.sortOrder) : 0;
    const payload = {
      first_name: String(studentForm.firstName || "").trim(),
      last_name: String(studentForm.lastName || "").trim(),
      gender: String(studentForm.gender || "").trim() || "Prefer not to say",
      class_id: overrides.classId || studentForm.classId || null,
      notes: String(studentForm.notes || "").trim() || null,
      is_participating_well: !!studentForm.isParticipatingWell,
      needs_help: !!studentForm.needsHelp,
      missing_homework: !!studentForm.missingHomework,
      separation_list: String(studentForm.separationList || "").trim() || null,
      sort_order: Number.isFinite(requestedSortOrder) ? requestedSortOrder : 0,
    };
    if (!payload.first_name || !payload.last_name) {
      setFormError("Student first and last name are required.");
      return false;
    }

    const { data, error } = await supabase
      .from("students")
      .insert(payload)
      .select("id,class_id")
      .single();
    if (error || !data?.id) {
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
    if (!studentId) return false;
    const payload = {
      gender: updates.gender?.trim() || "Prefer not to say",
      notes: updates.notes?.trim() || null,
      is_participating_well: !!updates.isParticipatingWell,
      needs_help: !!updates.needsHelp,
      missing_homework: !!updates.missingHomework,
    };

    if (typeof updates.firstName === "string" || typeof updates.lastName === "string") {
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

    return runMutation({
      setFormError,
      execute: async () => {
        const studentResult = await supabase.from("students").delete().eq("class_id", classId);
        if (studentResult?.error) return { error: studentResult.error };
        const classResult = await supabase.from("classes").delete().eq("id", classId);
        return classResult?.error ? { error: classResult.error } : { data: true };
      },
      refresh: async () => {
        await refreshCoreData();
        removeClassScopedWorkspaceData(classId, removedStudentIds);
        await invalidateWorkspaceDomains(["attendance", "subjects", "group", "randomPicker"]);
      },
      fallbackErrorMessage: "Failed to delete class.",
    });
  };

  const handleCleanupOrphanedStudents = async () => {
    const orphanedStudents = collectOrphanedStudents(classes, students);
    const orphanedStudentIds = orphanedStudents.map((student) => student.id).filter(Boolean);
    if (!orphanedStudentIds.length) return true;

    const idsByClass = orphanedStudents.reduce((map, student) => {
      if (!student.class_id) return map;
      if (!map.has(student.class_id)) map.set(student.class_id, []);
      map.get(student.class_id).push(student.id);
      return map;
    }, new Map());

    return runMutation({
      setFormError,
      execute: () => supabase.from("students").delete().in("id", orphanedStudentIds),
      refresh: async () => {
        await refreshCoreData();
        idsByClass.forEach((studentIds, classId) => {
          removeClassScopedWorkspaceData(classId, studentIds);
        });
        await invalidateWorkspaceDomains(["attendance", "group", "randomPicker"]);
      },
      fallbackErrorMessage: "Failed to clean up orphaned students.",
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
  };
}

export default createCoreActions;
