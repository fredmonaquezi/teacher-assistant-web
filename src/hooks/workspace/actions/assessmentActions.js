import { supabase } from "../../../supabaseClient";

function createAssessmentActions({
  students,
  assessmentEntries,
  assessments,
  subjects,
  units,
  setFormError,
  refreshAssessmentData,
}) {
  const handleUpdateAssessmentEntry = async (entryId, updates) => {
    if (!entryId) return;
    setFormError("");
    const { error } = await supabase.from("assessment_entries").update(updates).eq("id", entryId);
    if (error) {
      setFormError(error.message);
      return;
    }
    await refreshAssessmentData();
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
    await refreshAssessmentData();
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
    await refreshAssessmentData();
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

    await refreshAssessmentData();
  };

  const handleEnsureAssessmentEntries = async (assessmentId) => {
    if (!assessmentId) return true;
    const assessment = assessments.find((item) => item.id === assessmentId);
    if (!assessment?.class_id) return true;

    const classStudents = students.filter((student) => student.class_id === assessment.class_id);
    if (classStudents.length === 0) return true;

    const existingIds = new Set(
      assessmentEntries
        .filter((entry) => entry.assessment_id === assessmentId)
        .map((entry) => entry.student_id)
    );
    const missingStudents = classStudents.filter((student) => !existingIds.has(student.id));
    if (missingStudents.length === 0) return true;

    const rows = missingStudents.map((student) => ({
      assessment_id: assessment.id,
      student_id: student.id,
      score: null,
      notes: null,
    }));

    const { error } = await supabase
      .from("assessment_entries")
      .upsert(rows, { onConflict: "assessment_id,student_id", ignoreDuplicates: true });

    if (error) {
      setFormError(
        error.code === "23505"
          ? "Some assessment entries already existed. Refresh and try again."
          : error.message
      );
      return false;
    }

    await refreshAssessmentData();
    return true;
  };

  const handleUpdateAssessmentNotes = async (assessmentId, notes) => {
    if (!assessmentId) return false;

    const { error } = await supabase
      .from("assessments")
      .update({ notes })
      .eq("id", assessmentId);

    if (error) {
      setFormError(error.message);
      return false;
    }

    return true;
  };

  return {
    handleUpdateAssessmentEntry,
    handleCreateAssessmentForUnit,
    handleDeleteAssessment,
    handleCopyAssessmentsFromUnit,
    handleEnsureAssessmentEntries,
    handleUpdateAssessmentNotes,
  };
}

export default createAssessmentActions;
