import { useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { averageFromPercents, entryToPercent, performanceColor } from "../../utils/assessmentMetrics";
import { getAttendanceTotal, summarizeAttendanceEntries } from "../../utils/attendanceMetrics";

function normalizedLevel(value, t) {
  const level = (value || "").toLowerCase();
  if (level.startsWith("independent")) return { label: t("runningRecords.levels.independent.short"), color: "#16a34a", short: t("runningRecords.levels.independent.short") };
  if (level.startsWith("instructional")) return { label: t("runningRecords.levels.instructional.short"), color: "#ea580c", short: t("runningRecords.levels.instructional.short") };
  return { label: t("runningRecords.levels.frustration.short"), color: "#dc2626", short: t("runningRecords.levels.frustration.short") };
}

function ratingLabel(rating, t) {
  if (rating === 1) return t("development.ratingShort.1");
  if (rating === 2) return t("development.ratingShort.2");
  if (rating === 3) return t("development.ratingShort.3");
  if (rating === 4) return t("development.ratingShort.4");
  if (rating === 5) return t("development.ratingShort.5");
  return t("development.notRated");
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
  const { t } = useTranslation();
  const student = useMemo(
    () => students.find((item) => item.id === studentId),
    [students, studentId]
  );

  const classItem = useMemo(
    () => classes.find((item) => item.id === student?.class_id),
    [classes, student]
  );

  const studentInitials = useMemo(
    () =>
      `${student?.first_name?.[0] || ""}${student?.last_name?.[0] || ""}`.toUpperCase().trim() ||
      "S",
    [student]
  );

  const classLabel = useMemo(
    () =>
      classItem
        ? `${classItem.name}${classItem.grade_level ? ` (${classItem.grade_level})` : ""}`
        : t("studentOverview.noClass"),
    [classItem, t]
  );

  const records = useMemo(
    () =>
      runningRecords
        .filter((record) => record.student_id === studentId)
        .sort((a, b) => (b.record_date || "").localeCompare(a.record_date || "")),
    [runningRecords, studentId]
  );

  const latestLevel = useMemo(
    () => (records.length ? normalizedLevel(records[0].level, t) : null),
    [records, t]
  );

  const avgAccuracy = useMemo(
    () =>
      records.length
        ? records.reduce((sum, record) => sum + Number(record.accuracy_pct || 0), 0) / records.length
        : 0,
    [records]
  );

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

  const overallAverage = useMemo(
    () => averageFromPercents(scoredAssessments.map((entry) => entryToPercent(entry, assessmentLookup))),
    [scoredAssessments, assessmentLookup]
  );

  const attendanceForStudent = useMemo(
    () => attendanceEntries.filter((entry) => entry.student_id === studentId),
    [attendanceEntries, studentId]
  );

  const attendanceSummary = useMemo(
    () => summarizeAttendanceEntries(attendanceForStudent),
    [attendanceForStudent]
  );
  const attendanceTotal = useMemo(
    () => getAttendanceTotal(attendanceSummary),
    [attendanceSummary]
  );

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
            title: assessment?.title || t("assessments.title"),
            subjectName: subjectLookup.get(assessment?.subject_id)?.name || "",
            assessmentDate: assessment?.assessment_date || "",
            percent,
            isGraded:
              entry.score !== null && Number.isFinite(Number(entry.score)) && percent !== null,
          };
        }),
    [assessmentsForStudent, assessmentLookup, subjectLookup, t]
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
        const categoryName = categoryLookup.get(criterion?.category_id)?.name || t("development.other");
        if (!acc[categoryName]) acc[categoryName] = [];
        acc[categoryName].push(score);
        return acc;
      }, {}),
    [latestScoresByCriterion, criteriaLookup, categoryLookup, t]
  );

  const activeDevelopmentHistory = useMemo(
    () =>
      activeDevelopmentCriterionId
        ? studentScores.filter((score) => score.criterion_id === activeDevelopmentCriterionId)
        : [],
    [activeDevelopmentCriterionId, studentScores]
  );

  const activeDevelopmentHistoryChronological = useMemo(
    () => [...activeDevelopmentHistory].reverse(),
    [activeDevelopmentHistory]
  );

  const activeDevelopmentCriterion = activeDevelopmentCriterionId
    ? criteriaLookup.get(activeDevelopmentCriterionId)
    : null;

  const activeDevelopmentCategoryName = activeDevelopmentCriterion
    ? categoryLookup.get(activeDevelopmentCriterion.category_id)?.name || t("development.other")
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
          categoryName: category?.name || t("development.other"),
          gradeBand: (rubric?.grade_band || t("development.general")).trim() || t("development.general"),
        };
      }),
    [rubricCriteria, categoryLookup, rubricLookup, t]
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
    normalizedLevel: (value) => normalizedLevel(value, t),
    ratingLabel: (rating) => ratingLabel(rating, t),
    averageColor,
    trendLabel,
  };
}

export default useStudentDetailData;
