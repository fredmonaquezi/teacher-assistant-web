import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabaseClient";
import createCoreActions from "./classroomActions";
import { fetchClassroom } from "./classroomRepository";
import { featureQueryKeys } from "../queryKeys";
import useFeatureQuery from "../shared/useFeatureQuery";
import useMutationAction from "../shared/useMutationAction";

const EMPTY_CLASSROOM = { classRows: [], studentRows: [] };

export default function useClassroomFeature({ userId }) {
  const queryClient = useQueryClient();
  const [mutationError, setMutationError] = useState("");
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
  const queryKey = featureQueryKeys.classroom(userId);
  const query = useFeatureQuery({
    queryKey,
    enabled: !!userId,
    emptyData: EMPTY_CLASSROOM,
    errorMessage: "Failed to load classes and students.",
    queryFn: async () => {
      const result = await fetchClassroom(supabase);
      const error = result.errors.classError || result.errors.studentError;
      if (error) throw error;
      return result.rows;
    },
  });
  const classes = query.data.classRows;
  const students = query.data.studentRows;

  const invalidateWorkspaceDomains = async (domains) => {
    const keyByDomain = {
      attendance: featureQueryKeys.attendance(userId),
      subjects: featureQueryKeys.subjects(userId),
      group: featureQueryKeys.groups(userId),
      randomPicker: featureQueryKeys.randomPicker(userId),
    };
    await Promise.all(
      [...new Set(domains)]
        .map((domain) => keyByDomain[domain])
        .filter(Boolean)
        .map((key) => queryClient.invalidateQueries({ queryKey: key }))
    );
  };

  const actions = createCoreActions({
    classes,
    students,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
    setFormError: setMutationError,
    refreshCoreData: query.refresh,
    invalidateWorkspaceDomains,
  });
  const createClass = useMutationAction(actions.handleCreateClass, (error) => setMutationError(error.message));
  const updateClass = useMutationAction(actions.handleUpdateClass, (error) => setMutationError(error.message));
  const createStudent = useMutationAction(actions.handleCreateStudent, (error) => setMutationError(error.message));
  const updateStudent = useMutationAction(actions.handleUpdateStudent, (error) => setMutationError(error.message));
  const updateAcademicLevel = useMutationAction(actions.handleUpdateStudentAcademicLevel, (error) => setMutationError(error.message));
  const deleteClass = useMutationAction(actions.handleDeleteClass, (error) => setMutationError(error.message));
  const cleanupOrphans = useMutationAction(actions.handleCleanupOrphanedStudents, (error) => setMutationError(error.message));

  return {
    classes,
    students,
    loading: query.isPending,
    error: mutationError || query.errorMessage,
    setError: setMutationError,
    refresh: query.refresh,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
    handleCreateClass: createClass.run,
    handleUpdateClass: updateClass.run,
    handleCreateStudent: createStudent.run,
    handleUpdateStudent: updateStudent.run,
    handleUpdateStudentAcademicLevel: updateAcademicLevel.run,
    handleDeleteClass: deleteClass.run,
    handleCleanupOrphanedStudents: cleanupOrphans.run,
    mutationPending:
      createClass.isPending ||
      updateClass.isPending ||
      createStudent.isPending ||
      updateStudent.isPending ||
      updateAcademicLevel.isPending ||
      deleteClass.isPending ||
      cleanupOrphans.isPending,
  };
}
