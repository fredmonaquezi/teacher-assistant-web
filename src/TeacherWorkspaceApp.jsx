import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import useTeacherWorkspaceData from "./hooks/useTeacherWorkspaceData";
import { APP_PATHS } from "./config/paths";
import "./App.css";
import "react-day-picker/dist/style.css";

const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AttendanceSessionDetailPage = lazy(() => import("./pages/AttendanceSessionDetailPage"));
const GroupsPage = lazy(() => import("./pages/GroupsPage"));
const RandomPickerPage = lazy(() => import("./pages/RandomPickerPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SimpleClassesPage = lazy(() => import("./pages/SimpleClassesPage"));
const SimpleClassDetailPage = lazy(() => import("./pages/SimpleClassDetailPage"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));
const ActivityAssessmentPage = lazy(() => import("./pages/ActivityAssessmentPage"));
const TeacherHomePage = lazy(() => import("./pages/TeacherHomePage"));
const UsefulLinksPage = lazy(() => import("./pages/UsefulLinksPage"));

function RouteFallback() {
  const { t } = useTranslation();
  return (
    <section className="panel">
      <p className="muted">{t("route.loadingPage")}</p>
    </section>
  );
}

function WorkspaceRouteDataLoader({ ensureDataForPath }) {
  const location = useLocation();

  useEffect(() => {
    ensureDataForPath(location.pathname);
    // Intentionally react to path changes only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  return null;
}

function WorkspaceRouteClassSync({
  classes,
  students,
  attendanceSessions,
  activeClassId,
  setActiveClassId,
}) {
  const location = useLocation();

  useEffect(() => {
    let routeClassId = "";
    const classRouteMatch = location.pathname.match(/^\/classes\/([^/]+)/);

    if (classRouteMatch) {
      routeClassId = classRouteMatch[1];
    } else {
      const studentRouteMatch = location.pathname.match(/^\/students\/([^/]+)$/);
      if (studentRouteMatch) {
        routeClassId =
          students.find((student) => student.id === studentRouteMatch[1])?.class_id || "";
      }

      const attendanceRouteMatch = location.pathname.match(/^\/attendance\/([^/]+)$/);
      if (attendanceRouteMatch) {
        routeClassId =
          attendanceSessions.find((session) => session.id === attendanceRouteMatch[1])?.class_id ||
          "";
      }
    }

    if (!routeClassId) {
      routeClassId = new URLSearchParams(location.search).get("classId") || "";
    }

    const isKnownClass = classes.some((classItem) => classItem.id === routeClassId);
    if (isKnownClass && routeClassId !== activeClassId) {
      setActiveClassId(routeClassId);
    }
  }, [
    activeClassId,
    attendanceSessions,
    classes,
    location.pathname,
    location.search,
    setActiveClassId,
    students,
  ]);

  return null;
}

function TeacherWorkspaceApp({ user, onSignOut }) {
  const workspace = useTeacherWorkspaceData(user?.id || "");
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
    usefulLinks,
    randomPickerCustomCategories,
    randomPickerRotationRows,
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
    ensureDataForPath,
    handleCreateClass,
    handleAddClassSubjects,
    handleRenameClassSubject,
    handleUpdateClass,
    handleCreateStudent,
    handleUpdateStudent,
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
    <WorkspaceProvider value={workspace}>
      <BrowserRouter basename={APP_PATHS.teacherAssistant}>
        <WorkspaceRouteDataLoader ensureDataForPath={ensureDataForPath} />
        <WorkspaceRouteClassSync
          classes={classes}
          students={students}
          attendanceSessions={attendanceSessions}
          activeClassId={activeClassId}
          setActiveClassId={setActiveClassId}
        />
        <Layout
          user={user}
          onSignOut={onSignOut}
          preferences={profilePreferences}
          classes={classes}
          activeClassId={activeClassId}
          setActiveClassId={setActiveClassId}
        >
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
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                handleCreateStudent={handleCreateStudent}
              />
            }
          />
          <Route
            path="/classes/:classId/assess-activity"
            element={<ActivityAssessmentPage classes={classes} students={students} subjects={subjects} />}
          />
          <Route
            path="/classes/:classId/assess-activity/:activityAssessmentId"
            element={<ActivityAssessmentPage classes={classes} students={students} subjects={subjects} />}
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
        </Layout>
      </BrowserRouter>
    </WorkspaceProvider>
  );
}
export default TeacherWorkspaceApp;
