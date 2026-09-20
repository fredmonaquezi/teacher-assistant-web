export function activityDetailsForEntry(entry) {
  return Array.isArray(entry.activity_assessments)
    ? entry.activity_assessments[0]
    : entry.activity_assessments;
}

export function activitySubjectKey(entry) {
  const activity = activityDetailsForEntry(entry);
  if (activity?.subject_id) return `subject:${activity.subject_id}`;
  return `legacy:${(activity?.subject || "Activity").trim().toLocaleLowerCase()}`;
}

export function criterionEvidenceForEntry(entry, studentId) {
  const activity = activityDetailsForEntry(entry);
  return [...(activity?.activity_assessment_criteria || [])]
    .sort((first, second) => Number(first.sort_order || 0) - Number(second.sort_order || 0))
    .map((criterion) => {
      const result = (criterion.activity_assessment_criterion_results || [])
        .find((item) => item.student_id === studentId);
      return result ? { ...result, criterionTitle: criterion.title } : null;
    })
    .filter(Boolean);
}
