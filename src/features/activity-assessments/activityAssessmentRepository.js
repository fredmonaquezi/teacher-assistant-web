export async function fetchActivityAssessment(supabaseClient, { activityAssessmentId, classId }) {
  const [activityResult, entriesResult, criteriaResult] = await Promise.all([
    supabaseClient
      .from("activity_assessments")
      .select("id,class_id,activity_date,subject_id,subject,title,description,assessment_scale")
      .eq("id", activityAssessmentId)
      .eq("class_id", classId)
      .single(),
    supabaseClient
      .from("activity_assessment_entries")
      .select("id,student_id,outcome,notes,created_at")
      .eq("activity_assessment_id", activityAssessmentId),
    supabaseClient
      .from("activity_assessment_criteria")
      .select("id,title,description,sort_order,activity_assessment_criterion_results(id,student_id,outcome,notes,observed_at)")
      .eq("activity_assessment_id", activityAssessmentId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  ]);
  const error = activityResult.error || entriesResult.error || criteriaResult.error;
  if (error) throw error;
  if (!activityResult.data) throw new Error("Activity not found.");
  return {
    activity: activityResult.data,
    entries: entriesResult.data || [],
    criteria: criteriaResult.data || [],
  };
}

export async function fetchClassActivityHistory(supabaseClient, classId) {
  const { data, error } = await supabaseClient
    .from("activity_assessments")
    .select("id,activity_date,subject,title,description,created_at,activity_assessment_entries(id,student_id),activity_assessment_criteria(id)")
    .eq("class_id", classId)
    .order("activity_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function fetchStudentActivityEntries(supabaseClient, studentId) {
  const { data, error } = await supabaseClient
    .from("activity_assessment_entries")
    .select("id,outcome,notes,created_at,activity_assessments!inner(id,class_id,subject_id,activity_date,subject,title,description,assessment_scale,activity_assessment_criteria(id,title,description,sort_order,activity_assessment_criterion_results(id,student_id,outcome,notes,observed_at)))")
    .eq("student_id", studentId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function saveActivityAssessment(supabaseClient, input) {
  const {
    activityAssessmentId,
    classId,
    activityPayload,
    criteria,
    removedCriterionIds,
    criterionResults,
    dirtyCriterionResultKeys,
    classStudents,
    studentRows,
    criterionKey,
    criterionResultKey,
  } = input;
  const isExisting = Boolean(activityAssessmentId);
  const mutation = isExisting
    ? supabaseClient
        .from("activity_assessments")
        .update(activityPayload)
        .eq("id", activityAssessmentId)
        .eq("class_id", classId)
        .select("id")
        .single()
    : supabaseClient.from("activity_assessments").insert(activityPayload).select("id").single();
  const { data: savedActivity, error: activityError } = await mutation;
  if (activityError || !savedActivity?.id) {
    throw activityError || new Error("The activity assessment could not be saved.");
  }

  const rollbackNewActivity = async (error) => {
    if (!isExisting) {
      await supabaseClient.from("activity_assessments").delete().eq("id", savedActivity.id);
    }
    throw error;
  };
  const criterionIdByKey = new Map();
  criteria.filter((criterion) => criterion.id).forEach((criterion) => {
    criterionIdByKey.set(criterionKey(criterion), criterion.id);
  });

  const persistedCriteria = criteria.filter((criterion) => criterion.id);
  if (persistedCriteria.length) {
    const { error } = await supabaseClient.from("activity_assessment_criteria").upsert(
      persistedCriteria.map((criterion, index) => ({
        id: criterion.id,
        activity_assessment_id: savedActivity.id,
        title: criterion.title.trim(),
        description: criterion.description.trim() || null,
        sort_order: index,
      })),
      { onConflict: "id" }
    );
    if (error) return rollbackNewActivity(error);
  }

  for (const [index, criterion] of criteria.entries()) {
    if (criterion.id) continue;
    const { data, error } = await supabaseClient
      .from("activity_assessment_criteria")
      .insert({
        activity_assessment_id: savedActivity.id,
        title: criterion.title.trim(),
        description: criterion.description.trim() || null,
        sort_order: index,
      })
      .select("id")
      .single();
    if (error || !data?.id) return rollbackNewActivity(error || new Error("An assessment criterion could not be saved."));
    criterionIdByKey.set(criterionKey(criterion), data.id);
  }

  if (removedCriterionIds.length) {
    const { error } = await supabaseClient
      .from("activity_assessment_criteria")
      .delete()
      .in("id", removedCriterionIds)
      .eq("activity_assessment_id", savedActivity.id);
    if (error) return rollbackNewActivity(error);
  }

  const observedAt = new Date().toISOString();
  const criterionRows = [];
  criteria.forEach((criterion) => {
    const localCriterionKey = criterionKey(criterion);
    const savedCriterionId = criterionIdByKey.get(localCriterionKey);
    if (!savedCriterionId) return;
    classStudents.forEach((student) => {
      const localResultKey = criterionResultKey(localCriterionKey, student.id);
      const result = criterionResults[localResultKey];
      const shouldSave = !isExisting || dirtyCriterionResultKeys.includes(localResultKey);
      if (!shouldSave || !result?.outcome) return;
      criterionRows.push({
        criterion_id: savedCriterionId,
        student_id: student.id,
        outcome: result.outcome,
        notes: result.notes?.trim() || null,
        observed_at: observedAt,
      });
    });
  });

  if (criterionRows.length) {
    const { error } = await supabaseClient
      .from("activity_assessment_criterion_results")
      .upsert(criterionRows, { onConflict: "criterion_id,student_id" });
    if (error) return rollbackNewActivity(error);
  }

  if (studentRows.length) {
    const { error } = await supabaseClient
      .from("activity_assessment_entries")
      .upsert(
        studentRows.map((row) => ({
          ...row,
          activity_assessment_id: savedActivity.id,
        })),
        { onConflict: "activity_assessment_id,student_id" }
      );
    if (error) return rollbackNewActivity(error);
  }

  return { id: savedActivity.id };
}
