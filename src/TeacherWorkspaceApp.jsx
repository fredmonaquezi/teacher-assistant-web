import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ReorderModeToggle from "./components/common/ReorderModeToggle";
import Layout from "./components/layout/Layout";
import TimerRuntimeOverlays from "./components/timer/TimerRuntimeOverlays";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import useClassroomTimer from "./hooks/useClassroomTimer";
import useTeacherWorkspaceData from "./hooks/useTeacherWorkspaceData";
import { useHandleDrag } from "./hooks/useHandleDrag";
import { useReorderMode } from "./hooks/useReorderMode";
import { STUDENT_GENDER_OPTIONS } from "./constants/options";
import "react-day-picker/dist/style.css";

const AssessmentDetailPage = lazy(() => import("./pages/AssessmentDetailPage"));
const AssessmentsPage = lazy(() => import("./pages/AssessmentsPage"));
const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AttendanceSessionDetailPage = lazy(() => import("./pages/AttendanceSessionDetailPage"));
const CalendarPage = lazy(() => import("./pages/CalendarPage"));
const ClassDetailPage = lazy(() => import("./pages/ClassDetailPage"));
const ClassesPage = lazy(() => import("./pages/ClassesPage"));
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const RandomPickerPage = lazy(() => import("./pages/RandomPickerPage"));
const RunningRecordsPage = lazy(() => import("./pages/RunningRecordsPage"));
const RubricsPage = lazy(() => import("./pages/RubricsPage"));
const StudentDetailPage = lazy(() => import("./pages/StudentDetailPage"));
const SubjectDetailPage = lazy(() => import("./pages/SubjectDetailPage"));
const TimerPage = lazy(() => import("./pages/TimerPage"));
const UnitDetailPage = lazy(() => import("./pages/UnitDetailPage"));
const UsefulLinksPage = lazy(() => import("./pages/UsefulLinksPage"));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <section className="panel">
      <p className="muted">{t("route.loadingPage")}</p>
    </section>
  );
}

function TeacherWorkspaceApp({ user, onSignOut }) {
  const workspace = useTeacherWorkspaceData(user?.id || "");
  const {
    profilePreferences,
    setProfilePreferences,
    classes,
    students,
    calendarDiaryEntries,
    calendarEvents,
    calendarTablesReady,
    usefulLinks,
    randomPickerCustomCategories,
    randomPickerRotationRows,
    attendanceSessions,
    attendanceEntries,
    assessments,
    setAssessments,
    assessmentEntries,
    runningRecords,
    subjects,
    units,
    rubrics,
    rubricCategories,
    rubricCriteria,
    developmentScores,
    seedingRubrics,
    groups,
    groupMembers,
    groupConstraints,
    loading,
    formError,
    setFormError,
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
    groupGenForm,
    setGroupGenForm,
    constraintForm,
    setConstraintForm,
    groupsShowAdvanced,
    setGroupsShowAdvanced,
    groupsShowSeparations,
    setGroupsShowSeparations,
    isGeneratingGroups,
    groupsScrollTopRef,
    classOptions,
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleUpdateSortOrder,
    handleSwapSortOrder,
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
    handleUpdateAssessmentEntry,
    handleSetAssessmentEntryScore,
    handleEnsureAssessmentEntries,
    handleUpdateAssessmentNotes,
    handleCreateRunningRecord,
    handleDeleteRunningRecord,
    handleCreateSubject,
    handleCreateUnit,
    handleDeleteUnit,
    handleCreateAssessmentForUnit,
    handleDeleteAssessment,
    handleCopyAssessmentsFromUnit,
    handleCreateDevelopmentScore,
    handleCreateDevelopmentScoreEntry,
    handleUpdateDevelopmentScore,
    handleSeedDefaultRubrics,
    handleCreateRubricTemplate,
    handleUpdateRubricTemplate,
    handleDeleteRubricTemplate,
    handleDeleteAllRubrics,
    handleCreateRubricCategory,
    handleDeleteRubricCategory,
    handleCreateRubricCriterion,
    handleDeleteRubricCriterion,
    handleUpdateRubricCriterion,
    handleCreateCalendarDiaryEntry,
    handleUpdateCalendarDiaryEntry,
    handleDeleteCalendarDiaryEntry,
    handleCreateCalendarEvent,
    handleDeleteCalendarEvent,
    handleCreateUsefulLink,
    handleUpdateUsefulLink,
    handleDeleteUsefulLink,
    handleSwapUsefulLinkSortOrder,
    handleCreateRandomPickerCustomCategory,
    handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents,
    handleImportLegacyRandomPickerState,
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
  } = workspace;

  const timer = useClassroomTimer();

  return (
    <WorkspaceProvider value={workspace}>
      <BrowserRouter>
        <Layout
          user={user}
          onSignOut={onSignOut}
          preferences={profilePreferences}
          calendarEvents={calendarEvents}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
          <Route
            path="/"
            element={
              profilePreferences.defaultLandingPath &&
              profilePreferences.defaultLandingPath !== "/"
                ? <Navigate to={profilePreferences.defaultLandingPath} replace />
                : <DashboardPage />
            }
          />
          <Route
            path="/classes"
            element={
              <ClassesPage
                formError={formError}
                classForm={classForm}
                setClassForm={setClassForm}
                handleCreateClass={handleCreateClass}
                handleDeleteClass={handleDeleteClass}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                classes={classes}
                students={students}
                subjects={subjects}
                classOptions={classOptions}
                loading={loading}
              />
            }
          />
          <Route
            path="/classes/:classId"
            element={
              <ClassDetailPage
                formError={formError}
                classes={classes}
                subjects={subjects}
                students={students}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                developmentScores={developmentScores}
                subjectForm={subjectForm}
                setSubjectForm={setSubjectForm}
                handleCreateSubject={handleCreateSubject}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                handleCreateStudent={handleCreateStudent}
                useReorderModeHook={useReorderMode}
                useHandleDragHook={useHandleDrag}
                ReorderModeToggleComponent={ReorderModeToggle}
                studentGenderOptions={STUDENT_GENDER_OPTIONS}
              />
            }
          />
          <Route
            path="/attendance"
            element={
              <AttendancePage
                classOptions={classOptions}
                students={students}
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                formError={formError}
                setFormError={setFormError}
                handleCreateAttendanceSessionForDate={handleCreateAttendanceSessionForDate}
                handleDeleteAttendanceSession={handleDeleteAttendanceSession}
              />
            }
          />
          <Route
            path="/attendance/:sessionId"
            element={
              <AttendanceSessionDetailPage
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                classes={classes}
                students={students}
                handleUpdateAttendanceEntry={handleUpdateAttendanceEntry}
              />
            }
          />
          <Route
            path="/assessments"
            element={
              <AssessmentsPage
                formError={formError}
                loading={loading}
                classes={classes}
                subjects={subjects}
                units={units}
                students={students}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                handleSetAssessmentEntryScore={handleSetAssessmentEntryScore}
              />
            }
          />
          <Route
            path="/assessments/:assessmentId"
            element={
              <AssessmentDetailPage
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                classes={classes}
                subjects={subjects}
                units={units}
                students={students}
                handleUpdateAssessmentEntry={handleUpdateAssessmentEntry}
                setAssessments={setAssessments}
                handleEnsureAssessmentEntries={handleEnsureAssessmentEntries}
                handleUpdateAssessmentNotes={handleUpdateAssessmentNotes}
              />
            }
          />
          <Route
            path="/groups"
            element={
              <GroupsPage
                formError={formError}
                loading={loading}
                classOptions={classOptions}
                students={students}
                groups={groups}
                groupMembers={groupMembers}
                groupConstraints={groupConstraints}
                groupGenForm={groupGenForm}
                setGroupGenForm={setGroupGenForm}
                constraintForm={constraintForm}
                setConstraintForm={setConstraintForm}
                groupsShowAdvanced={groupsShowAdvanced}
                setGroupsShowAdvanced={setGroupsShowAdvanced}
                groupsShowSeparations={groupsShowSeparations}
                setGroupsShowSeparations={setGroupsShowSeparations}
                groupsScrollTopRef={groupsScrollTopRef}
                handleGenerateGroups={handleGenerateGroups}
                isGeneratingGroups={isGeneratingGroups}
                handleAddConstraint={handleAddConstraint}
                handleDeleteConstraint={handleDeleteConstraint}
              />
            }
          />
          <Route
            path="/random"
            element={
              <RandomPickerPage
                formError={formError}
                classOptions={classOptions}
                students={students}
                randomPickerCustomCategories={randomPickerCustomCategories}
                randomPickerRotationRows={randomPickerRotationRows}
                handleCreateRandomPickerCustomCategory={handleCreateRandomPickerCustomCategory}
                handleDeleteRandomPickerCustomCategory={handleDeleteRandomPickerCustomCategory}
                handleSetRandomPickerRotationUsedStudents={handleSetRandomPickerRotationUsedStudents}
                handleImportLegacyRandomPickerState={handleImportLegacyRandomPickerState}
              />
            }
          />
          <Route
            path="/rubrics"
            element={
              <RubricsPage
                formError={formError}
                rubrics={rubrics}
                rubricCategories={rubricCategories}
                rubricCriteria={rubricCriteria}
                loading={loading}
                seedingRubrics={seedingRubrics}
                handleSeedDefaultRubrics={handleSeedDefaultRubrics}
                handleUpdateSortOrder={handleUpdateSortOrder}
                handleSwapSortOrder={handleSwapSortOrder}
                handleCreateRubricTemplate={handleCreateRubricTemplate}
                handleUpdateRubricTemplate={handleUpdateRubricTemplate}
                handleDeleteRubricTemplate={handleDeleteRubricTemplate}
                handleDeleteAllRubrics={handleDeleteAllRubrics}
                handleCreateRubricCategory={handleCreateRubricCategory}
                handleDeleteRubricCategory={handleDeleteRubricCategory}
                handleCreateRubricCriterion={handleCreateRubricCriterion}
                handleDeleteRubricCriterion={handleDeleteRubricCriterion}
                handleUpdateRubricCriterion={handleUpdateRubricCriterion}
              />
            }
          />
          <Route path="/timer" element={<TimerPage startTimerSeconds={timer.startTimerSeconds} />} />
          <Route
            path="/subjects/:subjectId"
            element={
              <SubjectDetailPage
                formError={formError}
                subjects={subjects}
                units={units}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                unitForm={unitForm}
                setUnitForm={setUnitForm}
                handleCreateUnit={handleCreateUnit}
                handleSwapSortOrder={handleSwapSortOrder}
                handleDeleteUnit={handleDeleteUnit}
              />
            }
          />
          <Route
            path="/units/:unitId"
            element={
              <UnitDetailPage
                formError={formError}
                units={units}
                subjects={subjects}
                assessments={assessments}
                assessmentEntries={assessmentEntries}
                handleCreateAssessmentForUnit={handleCreateAssessmentForUnit}
                handleSwapSortOrder={handleSwapSortOrder}
                handleDeleteAssessment={handleDeleteAssessment}
                handleCopyAssessmentsFromUnit={handleCopyAssessmentsFromUnit}
              />
            }
          />
          <Route
            path="/running-records"
            element={
              <RunningRecordsPage
                formError={formError}
                handleCreateRunningRecord={handleCreateRunningRecord}
                handleDeleteRunningRecord={handleDeleteRunningRecord}
                runningRecordForm={runningRecordForm}
                setRunningRecordForm={setRunningRecordForm}
                students={students}
                classes={classes}
                loading={loading}
                runningRecords={runningRecords}
              />
            }
          />
          <Route
            path="/students/:studentId"
            element={
              <StudentDetailPage
                students={students}
                classes={classes}
                subjects={subjects}
                assessments={assessments}
                attendanceEntries={attendanceEntries}
                runningRecords={runningRecords}
                assessmentEntries={assessmentEntries}
                rubricCriteria={rubricCriteria}
                rubricCategories={rubricCategories}
                rubrics={rubrics}
                developmentScores={developmentScores}
                developmentScoreForm={developmentScoreForm}
                setDevelopmentScoreForm={setDevelopmentScoreForm}
                handleCreateDevelopmentScore={handleCreateDevelopmentScore}
                handleCreateDevelopmentScoreEntry={handleCreateDevelopmentScoreEntry}
                handleUpdateDevelopmentScore={handleUpdateDevelopmentScore}
                handleUpdateStudent={handleUpdateStudent}
                formError={formError}
              />
            }
          />
          <Route
            path="/calendar"
            element={
              <CalendarPage
                formError={formError}
                setFormError={setFormError}
                classOptions={classOptions}
                calendarDiaryEntries={calendarDiaryEntries}
                calendarEvents={calendarEvents}
                calendarTablesReady={calendarTablesReady}
                classes={classes}
                subjects={subjects}
                units={units}
                handleCreateCalendarDiaryEntry={handleCreateCalendarDiaryEntry}
                handleUpdateCalendarDiaryEntry={handleUpdateCalendarDiaryEntry}
                handleDeleteCalendarDiaryEntry={handleDeleteCalendarDiaryEntry}
                handleCreateCalendarEvent={handleCreateCalendarEvent}
                handleDeleteCalendarEvent={handleDeleteCalendarEvent}
              />
            }
          />
          <Route
            path="/useful-links"
            element={
              <UsefulLinksPage
                formError={formError}
                usefulLinks={usefulLinks}
                handleCreateUsefulLink={handleCreateUsefulLink}
                handleUpdateUsefulLink={handleUpdateUsefulLink}
                handleDeleteUsefulLink={handleDeleteUsefulLink}
                handleSwapUsefulLinkSortOrder={handleSwapUsefulLinkSortOrder}
              />
            }
          />
          <Route
            path="/profile"
            element={
              <ProfilePage
                user={user}
                preferences={profilePreferences}
                onPreferencesChange={setProfilePreferences}
              />
            }
          />
            </Routes>
          </Suspense>
          <TimerRuntimeOverlays timer={timer} />
        </Layout>
      </BrowserRouter>
    </WorkspaceProvider>
  );
}
export default TeacherWorkspaceApp;
