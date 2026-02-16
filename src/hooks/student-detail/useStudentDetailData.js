import { useEffect, useMemo } from "react";
import { averageFromPercents, entryToPercent, performanceColor } from "../../utils/assessmentMetrics";

function normalizedLevel(value) {
  const level = (value || "").toLowerCase();
  if (level.startsWith("independent")) return { label: "Independent", color: "#16a34a", short: "Ind." };
  if (level.startsWith("instructional")) return { label: "Instructional", color: "#ea580c", short: "Inst." };
  return { label: "Frustration", color: "#dc2626", short: "Frust." };
}

function ratingLabel(rating) {
  if (rating === 1) return "Needs Significant Support";
  if (rating === 2) return "Beginning to Develop";
  if (rating === 3) return "Developing";
  if (rating === 4) return "Proficient";
  if (rating === 5) return "Mastering / Exceeding";
  return "Not Rated";
}

function averageColor(value) {
  return performanceColor(value);
}

function trendLabel(current, previous) {
  if (!previous) return "Baseline";
  const currentRating = Number(current?.rating || 0);
  const previousRating = Number(previous?.rating || 0);
  if (currentRating > previousRating) return "Improved";
  if (currentRating < previousRating) return "Needs Support";
  return "Steady";
}

function useStudentDetailData({
  studentId,
  students,
  classes,
  subjects,
  assessments,
  attendanceEntries,
  runningRecords,
  assessmentEntries,
  rubricCriteria,
  rubricCategories,
  rubrics,
  developmentScores,
  activeDevelopmentCriterionId,
  developmentYearFilter,
  developmentScoreForm,
  setDevelopmentScoreForm,
}) {
  const student = useMemo(
    () => students.find((item) => item.id === studentId),
    [students, studentId]
  );

  const classItem = useMemo(
    () => classes.find((item) => item.id === student?.class_id),
    [classes, student]
  );

  const studentInitials = `${student?.first_name?.[0] || ""}${student?.last_name?.[0] || ""}`
    .toUpperCase()
    .trim() || "S";

  const classLabel = classItem
    ? `${classItem.name}${classItem.grade_level ? ` (${classItem.grade_level})` : ""}`
    : "No class";

  const records = useMemo(
    () =>
      runningRecords
        .filter((record) => record.student_id === studentId)
        .sort((a, b) => (b.record_date || "").localeCompare(a.record_date || "")),
    [runningRecords, studentId]
  );

  const latestLevel = records.length ? normalizedLevel(records[0].level) : null;

  const avgAccuracy = records.length
    ? records.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) / records.length
    : 0;

  const assessmentsForStudent = useMemo(
    () => assessmentEntries.filter((entry) => entry.student_id === studentId),
    [assessmentEntries, studentId]
  );

  const scoredAssessments = useMemo(
    () =>
      assessmentsForStudent.filter(
        (entry) => entry.score !== null && Number.isFinite(Number(entry.score))
      ),
    [assessmentsForStudent]
  );

  const assessmentLookup = useMemo(() => {
    const map = new Map();
    assessments.forEach((assessment) => map.set(assessment.id, assessment));
    return map;
  }, [assessments]);

  const subjectLookup = useMemo(() => {
    const map = new Map();
    subjects.forEach((subject) => map.set(subject.id, subject));
    return map;
  }, [subjects]);

  const overallAverage = averageFromPercents(
    scoredAssessments.map((entry) => entryToPercent(entry, assessmentLookup))
  );

  const attendanceForStudent = useMemo(
    () => attendanceEntries.filter((entry) => entry.student_id === studentId),
    [attendanceEntries, studentId]
  );

  const attendanceSummary = {
    present: attendanceForStudent.filter((entry) => entry.status === "Present").length,
    absent: attendanceForStudent.filter((entry) => entry.status === "Didn't come").length,
    late: attendanceForStudent.filter((entry) => entry.status === "Arrived late").length,
    leftEarly: attendanceForStudent.filter((entry) => entry.status === "Left early").length,
  };

  const attendanceTotal =
    attendanceSummary.present +
    attendanceSummary.absent +
    attendanceSummary.late +
    attendanceSummary.leftEarly;

  const subjectsForClass = useMemo(
    () =>
      subjects
        .filter((subject) => subject.class_id === student?.class_id)
        .sort(
          (a, b) =>
            Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0) ||
            (a.created_at || "").localeCompare(b.created_at || "")
        ),
    [subjects, student]
  );

  const performanceBySubject = useMemo(
    () =>
      subjectsForClass.map((subject) => {
        const assessmentIds = new Set(
          assessments
            .filter((assessment) => assessment.subject_id === subject.id)
            .map((assessment) => assessment.id)
        );
        const subjectScores = assessmentsForStudent.filter(
          (entry) =>
            assessmentIds.has(entry.assessment_id) &&
            entry.score !== null &&
            Number.isFinite(Number(entry.score))
        );
        const average = averageFromPercents(
          subjectScores.map((entry) => entryToPercent(entry, assessmentLookup))
        );
        return { subject, count: subjectScores.length, average };
      }),
    [subjectsForClass, assessments, assessmentsForStudent, assessmentLookup]
  );

  const recentAssessments = useMemo(
    () =>
      assessmentsForStudent
        .map((entry) => ({ entry, assessment: assessmentLookup.get(entry.assessment_id) }))
        .sort((a, b) => {
          const dateA = a.assessment?.assessment_date || "";
          const dateB = b.assessment?.assessment_date || "";
          if (dateA !== dateB) return dateB.localeCompare(dateA);
          return Number(b.assessment?.sort_order ?? 0) - Number(a.assessment?.sort_order ?? 0);
        })
        .slice(0, 10)
        .map(({ entry, assessment }) => {
          const percent = entryToPercent(entry, assessmentLookup);
          return {
            id: entry.id,
            title: assessment?.title || "Assessment",
            subjectName: subjectLookup.get(assessment?.subject_id)?.name || "",
            assessmentDate: assessment?.assessment_date || "",
            percent,
            isGraded:
              entry.score !== null && Number.isFinite(Number(entry.score)) && percent !== null,
          };
        }),
    [assessmentsForStudent, assessmentLookup, subjectLookup]
  );

  const criteriaLookup = useMemo(() => {
    const map = new Map();
    rubricCriteria.forEach((criterion) => map.set(criterion.id, criterion));
    return map;
  }, [rubricCriteria]);

  const categoryLookup = useMemo(() => {
    const map = new Map();
    rubricCategories.forEach((category) => map.set(category.id, category));
    return map;
  }, [rubricCategories]);

  const rubricLookup = useMemo(() => {
    const map = new Map();
    rubrics.forEach((rubric) => map.set(rubric.id, rubric));
    return map;
  }, [rubrics]);

  const studentScores = useMemo(
    () =>
      developmentScores
        .filter((score) => score.student_id === studentId)
        .sort(
          (a, b) =>
            (b.score_date || b.created_at || "").localeCompare(a.score_date || a.created_at || "")
        ),
    [developmentScores, studentId]
  );

  const latestScoresByCriterion = useMemo(() => {
    const scoreList = [];
    const seenCriteria = new Set();

    for (const score of studentScores) {
      if (!score.criterion_id || seenCriteria.has(score.criterion_id)) continue;
      seenCriteria.add(score.criterion_id);
      scoreList.push(score);
    }

    return scoreList;
  }, [studentScores]);

  const groupedDevelopment = useMemo(
    () =>
      latestScoresByCriterion.reduce((acc, score) => {
        const criterion = criteriaLookup.get(score.criterion_id);
        const categoryName = categoryLookup.get(criterion?.category_id)?.name || "Other";
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(score);
        return acc;
      }, {}),
    [latestScoresByCriterion, criteriaLookup, categoryLookup]
  );

  const activeDevelopmentHistory = activeDevelopmentCriterionId
    ? studentScores.filter((score) => score.criterion_id === activeDevelopmentCriterionId)
    : [];

  const activeDevelopmentHistoryChronological = [...activeDevelopmentHistory].reverse();

  const activeDevelopmentCriterion = activeDevelopmentCriterionId
    ? criteriaLookup.get(activeDevelopmentCriterionId)
    : null;

  const activeDevelopmentCategoryName = activeDevelopmentCriterion
    ? categoryLookup.get(activeDevelopmentCriterion.category_id)?.name || "Other"
    : "";

  const sparklineData = useMemo(() => {
    const ratings = activeDevelopmentHistoryChronological
      .map((item) => Number(item.rating))
      .filter((value) => Number.isFinite(value));

    if (!ratings.length) return null;

    const width = 320;
    const height = ratings.length <= 2 ? 56 : 88;
    const padX = 12;
    const padY = 12;
    const usableWidth = width - padX * 2;
    const usableHeight = height - padY * 2;

    const xForIndex = (index) =>
      ratings.length === 1 ? width / 2 : padX + (usableWidth * index) / (ratings.length - 1);
    const yForRating = (rating) => padY + ((5 - rating) / 4) * usableHeight;

    const points = ratings
      .map((rating, index) => `${xForIndex(index)},${yForRating(rating)}`)
      .join(" ");

    return {
      width,
      height,
      points,
      dots: ratings.map((rating, index) => ({
        x: xForIndex(index),
        y: yForRating(rating),
        rating,
      })),
      first: ratings[0],
      last: ratings[ratings.length - 1],
      total: ratings.length,
    };
  }, [activeDevelopmentHistoryChronological]);

  const rubricYearOptions = useMemo(() => {
    const values = new Set();
    rubrics.forEach((rubric) => {
      const gradeBand = (rubric.grade_band || "").trim();
      if (gradeBand) values.add(gradeBand);
    });
    return Array.from(values).sort((a, b) => a.localeCompare(b));
  }, [rubrics]);

  const rubricCriteriaWithMeta = useMemo(
    () =>
      rubricCriteria.map((criterion) => {
        const category = categoryLookup.get(criterion.category_id);
        const rubric = rubricLookup.get(category?.rubric_id);
        return {
          ...criterion,
          categoryName: category?.name || "Other",
          gradeBand: (rubric?.grade_band || "General").trim() || "General",
        };
      }),
    [rubricCriteria, categoryLookup, rubricLookup]
  );

  const filteredCriteriaForForm = useMemo(() => {
    const byYear =
      developmentYearFilter === "all"
        ? rubricCriteriaWithMeta
        : rubricCriteriaWithMeta.filter((criterion) => criterion.gradeBand === developmentYearFilter);

    return byYear.sort((a, b) => {
      const groupA = `${a.gradeBand} ${a.categoryName}`;
      const groupB = `${b.gradeBand} ${b.categoryName}`;
      if (groupA !== groupB) return groupA.localeCompare(groupB);
      return (a.label || a.description || "").localeCompare(b.label || b.description || "");
    });
  }, [rubricCriteriaWithMeta, developmentYearFilter]);

  const selectedCriterionMeta = useMemo(
    () =>
      rubricCriteriaWithMeta.find((criterion) => criterion.id === developmentScoreForm.criterionId) ||
      null,
    [rubricCriteriaWithMeta, developmentScoreForm.criterionId]
  );

  const filteredCriteriaIds = useMemo(
    () => new Set(filteredCriteriaForForm.map((criterion) => criterion.id)),
    [filteredCriteriaForForm]
  );

  useEffect(() => {
    if (!developmentScoreForm.criterionId) return;
    if (filteredCriteriaIds.has(developmentScoreForm.criterionId)) return;
    setDevelopmentScoreForm((prev) => ({ ...prev, criterionId: "" }));
  }, [developmentScoreForm.criterionId, filteredCriteriaIds, setDevelopmentScoreForm]);

  const groupedCriterionOptions = useMemo(() => {
    const groupMap = new Map();
    filteredCriteriaForForm.forEach((criterion) => {
      const groupLabel = `${criterion.gradeBand} • ${criterion.categoryName}`;
      if (!groupMap.has(groupLabel)) groupMap.set(groupLabel, []);
      groupMap.get(groupLabel).push(criterion);
    });
    return Array.from(groupMap.entries());
  }, [filteredCriteriaForForm]);

  return {
    student,
    studentInitials,
    classLabel,
    records,
    latestLevel,
    avgAccuracy,
    assessmentsForStudent,
    overallAverage,
    attendanceSummary,
    attendanceTotal,
    performanceBySubject,
    recentAssessments,
    groupedDevelopment,
    criteriaLookup,
    studentScores,
    activeDevelopmentHistory,
    activeDevelopmentHistoryChronological,
    activeDevelopmentCriterion,
    activeDevelopmentCategoryName,
    sparklineData,
    rubricYearOptions,
    groupedCriterionOptions,
    selectedCriterionMeta,
    normalizedLevel,
    ratingLabel,
    averageColor,
    trendLabel,
  };
}

export default useStudentDetailData;
