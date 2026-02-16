import { supabase } from "../../../supabaseClient";
import {
  buildAbilityProfiles,
  buildConstraintSet,
  generateGroups,
} from "../groupingEngine";

function createGroupActions({
  students,
  assessmentEntries,
  assessments,
  groupConstraints,
  groupGenForm,
  constraintForm,
  setConstraintForm,
  isGeneratingGroups,
  setIsGeneratingGroups,
  setFormError,
  loadData,
}) {
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

      const constraintSet = respectSeparations
        ? buildConstraintSet(classStudents, groupConstraints)
        : new Set();

      const abilityByStudentId = buildAbilityProfiles(
        classId,
        classStudents,
        assessments,
        assessmentEntries
      );

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

        const existingIds = (existingGroups ?? []).map((group) => group.id);
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
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
  };
}

export default createGroupActions;
