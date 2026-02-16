import { format } from "date-fns";
import { useState } from "react";
import { useParams } from "react-router-dom";
import DevelopmentTrackingSection from "../components/student-detail/DevelopmentTrackingSection";
import EditStudentModal from "../components/student-detail/EditStudentModal";
import StudentOverviewSections from "../components/student-detail/StudentOverviewSections";
import useStudentDetailData from "../hooks/student-detail/useStudentDetailData";

function StudentDetailPage({
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
  developmentScoreForm,
  setDevelopmentScoreForm,
  handleCreateDevelopmentScore,
  handleCreateDevelopmentScoreEntry,
  handleUpdateDevelopmentScore,
  handleUpdateStudent,
  formError,
}) {
  const { studentId } = useParams();

  const [showEditInfo, setShowEditInfo] = useState(false);
  const [showDevelopmentForm, setShowDevelopmentForm] = useState(false);
  const [activeDevelopmentCriterionId, setActiveDevelopmentCriterionId] = useState("");
  const [editingDevelopmentScoreId, setEditingDevelopmentScoreId] = useState("");
  const [showAddDevelopmentHistoryForm, setShowAddDevelopmentHistoryForm] = useState(false);
  const [developmentHistoryEditForm, setDevelopmentHistoryEditForm] = useState({
    rating: "3",
    date: "",
    notes: "",
  });
  const [newDevelopmentHistoryForm, setNewDevelopmentHistoryForm] = useState({
    rating: "3",
    date: format(new Date(), "yyyy-MM-dd"),
    notes: "",
  });
  const [editForm, setEditForm] = useState({
    gender: "Prefer not to say",
    notes: "",
    isParticipatingWell: false,
    needsHelp: false,
    missingHomework: false,
  });
  const [developmentYearFilter, setDevelopmentYearFilter] = useState("all");

  const {
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
    activeDevelopmentHistory,
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
  } = useStudentDetailData({
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
  });

  const startEditingDevelopmentHistory = (score) => {
    setEditingDevelopmentScoreId(score.id);
    setDevelopmentHistoryEditForm({
      rating: String(Number(score.rating || 3)),
      date: score.score_date || "",
      notes: score.notes || "",
    });
  };

  const resetDevelopmentHistoryState = () => {
    setEditingDevelopmentScoreId("");
    setShowAddDevelopmentHistoryForm(false);
    setNewDevelopmentHistoryForm({
      rating: "3",
      date: format(new Date(), "yyyy-MM-dd"),
      notes: "",
    });
  };

  const selectDevelopmentCriterion = (criterionId) => {
    setActiveDevelopmentCriterionId(criterionId);
    resetDevelopmentHistoryState();
  };

  const toggleStatus = async (field) => {
    if (!student) return;

    const next = {
      gender: student.gender || "Prefer not to say",
      notes: student.notes || "",
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
      [field]:
        field === "isParticipatingWell"
          ? !student.is_participating_well
          : field === "needsHelp"
            ? !student.needs_help
            : !student.missing_homework,
    };

    await handleUpdateStudent(studentId, next);
  };

  const openEditInfo = () => {
    if (!student) return;

    setEditForm({
      gender: student.gender || "Prefer not to say",
      notes: student.notes || "",
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
    });
    setShowEditInfo(true);
  };

  if (!student) {
    return (
      <section className="panel">
        <h2>Student not found</h2>
        <p className="muted">Select a student from a class.</p>
      </section>
    );
  }

  return (
    <>
      {formError && <div className="error">{formError}</div>}

      <StudentOverviewSections
        student={student}
        studentInitials={studentInitials}
        classLabel={classLabel}
        onOpenEditInfo={openEditInfo}
        onToggleStatus={toggleStatus}
        overallAverage={overallAverage}
        totalAssessments={assessmentsForStudent.length}
        averageColor={averageColor}
        attendanceSummary={attendanceSummary}
        attendanceTotal={attendanceTotal}
        records={records}
        avgAccuracy={avgAccuracy}
        latestLevel={latestLevel}
        normalizedLevel={normalizedLevel}
        performanceBySubject={performanceBySubject}
        recentAssessments={recentAssessments}
      />

      <DevelopmentTrackingSection
        groupedDevelopment={groupedDevelopment}
        criteriaLookup={criteriaLookup}
        ratingLabel={ratingLabel}
        selectDevelopmentCriterion={selectDevelopmentCriterion}
        setShowDevelopmentForm={setShowDevelopmentForm}
        activeDevelopmentCriterion={activeDevelopmentCriterion}
        activeDevelopmentCategoryName={activeDevelopmentCategoryName}
        showAddDevelopmentHistoryForm={showAddDevelopmentHistoryForm}
        setShowAddDevelopmentHistoryForm={setShowAddDevelopmentHistoryForm}
        activeDevelopmentHistory={activeDevelopmentHistory}
        sparklineData={sparklineData}
        handleCreateDevelopmentScoreEntry={handleCreateDevelopmentScoreEntry}
        studentId={studentId}
        activeDevelopmentCriterionId={activeDevelopmentCriterionId}
        newDevelopmentHistoryForm={newDevelopmentHistoryForm}
        setNewDevelopmentHistoryForm={setNewDevelopmentHistoryForm}
        editingDevelopmentScoreId={editingDevelopmentScoreId}
        setEditingDevelopmentScoreId={setEditingDevelopmentScoreId}
        developmentHistoryEditForm={developmentHistoryEditForm}
        setDevelopmentHistoryEditForm={setDevelopmentHistoryEditForm}
        handleUpdateDevelopmentScore={handleUpdateDevelopmentScore}
        startEditingDevelopmentHistory={startEditingDevelopmentHistory}
        trendLabel={trendLabel}
        showDevelopmentForm={showDevelopmentForm}
        handleCreateDevelopmentScore={handleCreateDevelopmentScore}
        developmentYearFilter={developmentYearFilter}
        setDevelopmentYearFilter={setDevelopmentYearFilter}
        rubricYearOptions={rubricYearOptions}
        developmentScoreForm={developmentScoreForm}
        setDevelopmentScoreForm={setDevelopmentScoreForm}
        groupedCriterionOptions={groupedCriterionOptions}
        selectedCriterionMeta={selectedCriterionMeta}
      />

      <EditStudentModal
        showEditInfo={showEditInfo}
        setShowEditInfo={setShowEditInfo}
        student={student}
        studentId={studentId}
        editForm={editForm}
        setEditForm={setEditForm}
        handleUpdateStudent={handleUpdateStudent}
      />
    </>
  );
}

export default StudentDetailPage;
