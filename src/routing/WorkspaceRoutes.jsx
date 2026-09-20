import { Suspense, lazy } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, Route, Routes } from "react-router-dom";
import LoadingState from "../components/common/LoadingState";

const AttendancePage = lazy(() => import("../pages/AttendancePage"));
const AttendanceSessionDetailPage = lazy(() => import("../pages/AttendanceSessionDetailPage"));
const GroupsPage = lazy(() => import("../pages/GroupsPage"));
const RandomPickerPage = lazy(() => import("../pages/RandomPickerPage"));
const ProfilePage = lazy(() => import("../pages/ProfilePage"));
const SimpleClassesPage = lazy(() => import("../pages/SimpleClassesPage"));
const SimpleClassDetailPage = lazy(() => import("../pages/SimpleClassDetailPage"));
const StudentProfilePage = lazy(() => import("../pages/StudentProfilePage"));
const ActivityAssessmentPage = lazy(() => import("../pages/ActivityAssessmentPage"));
const TeacherHomePage = lazy(() => import("../pages/TeacherHomePage"));
const UsefulLinksPage = lazy(() => import("../pages/UsefulLinksPage"));

function RouteFallback() {
  const { t } = useTranslation();
  return <LoadingState>{t("route.loadingPage")}</LoadingState>;
}

function WorkspaceRoutes({ workspace, user }) {
  const {
    activeClass,
    activeClassId,
    setActiveClassId,
    profilePreferences,
    setProfilePreferences,
    classes,
    students,
    attendanceSessions,
    attendanceEntries,
    subjects,
    groups,
    groupMembers,
    groupConstraints,
    activityAssessmentsForGrouping,
    activityAssessmentEntriesForGrouping,
    usefulLinks,
    randomPickerCustomCategories,
    randomPickerRotationRows,
    classroomLoading,
    loading,
    formError,
    setFormError,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
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
    handleAddClassSubjects,
    handleRenameClassSubject,
    handleUpdateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleUpdateStudentAcademicLevel,
    handleDeleteClass,
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
    handleAddConstraint,
    handleDeleteConstraint,
    handleGenerateGroups,
    handleCreateRandomPickerCustomCategory,
    handleDeleteRandomPickerCustomCategory,
    handleSetRandomPickerRotationUsedStudents,
    handleImportLegacyRandomPickerState,
    handleCreateUsefulLink,
    handleUpdateUsefulLink,
    handleDeleteUsefulLink,
    handleSwapUsefulLinkSortOrder,
  } = workspace;

  return (
    <Suspense fallback={<RouteFallback />}>
      <Routes>
        <Route
          path="/"
          element={
            <TeacherHomePage
              activeClass={activeClass}
              activeClassId={activeClassId}
              students={students}
              loading={loading}
              preferences={profilePreferences}
              onPreferencesChange={setProfilePreferences}
            />
          }
        />
        <Route
          path="/classes"
          element={
            <SimpleClassesPage
              formError={formError}
              setFormError={setFormError}
              classForm={classForm}
              setClassForm={setClassForm}
              handleCreateClass={handleCreateClass}
              handleAddClassSubjects={handleAddClassSubjects}
              handleUpdateClass={handleUpdateClass}
              handleDeleteClass={handleDeleteClass}
              classes={classes}
              students={students}
              activeClassId={activeClassId}
              setActiveClassId={setActiveClassId}
              loading={loading}
            />
          }
        />
        <Route
          path="/classes/:classId"
          element={
            <SimpleClassDetailPage
              subjects={subjects}
              handleAddClassSubjects={handleAddClassSubjects}
              handleRenameClassSubject={handleRenameClassSubject}
              formError={formError}
              setFormError={setFormError}
              handleUpdateClass={handleUpdateClass}
              classes={classes}
              students={students}
              loading={classroomLoading}
              studentForm={studentForm}
              setStudentForm={setStudentForm}
              handleCreateStudent={handleCreateStudent}
            />
          }
        />
        <Route
          path="/classes/:classId/assess-activity"
          element={
            <ActivityAssessmentPage
              classes={classes}
              students={students}
              subjects={subjects}
              preferences={profilePreferences}
              loading={classroomLoading}
            />
          }
        />
        <Route
          path="/classes/:classId/assess-activity/:activityAssessmentId"
          element={
            <ActivityAssessmentPage
              classes={classes}
              students={students}
              subjects={subjects}
              preferences={profilePreferences}
              loading={classroomLoading}
            />
          }
        />
        <Route
          path="/attendance"
          element={
            <AttendancePage
              classOptions={classOptions}
              activeClassId={activeClassId}
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
          path="/groups"
          element={
            <GroupsPage
              formError={formError}
              activeClass={activeClass}
              activeClassId={activeClassId}
              students={students}
              activityAssessments={activityAssessmentsForGrouping}
              activityAssessmentEntries={activityAssessmentEntriesForGrouping}
              subjects={subjects}
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
              handleUpdateStudentAcademicLevel={handleUpdateStudentAcademicLevel}
            />
          }
        />
        <Route
          path="/random"
          element={
            <RandomPickerPage
              key={activeClassId || "no-active-class"}
              formError={formError}
              loading={loading}
              classOptions={classOptions}
              activeClassId={activeClassId}
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
          path="/students/:studentId"
          element={
            <StudentProfilePage
              students={students}
              classes={classes}
              subjects={subjects}
              attendanceSessions={attendanceSessions}
              attendanceEntries={attendanceEntries}
              loading={classroomLoading}
              handleUpdateStudent={handleUpdateStudent}
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
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export default WorkspaceRoutes;
