import { Suspense, lazy, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import Layout from "./components/layout/Layout";
import { WorkspaceProvider } from "./context/WorkspaceContext";
import useTeacherWorkspaceData from "./hooks/useTeacherWorkspaceData";
import "react-day-picker/dist/style.css";

const AttendancePage = lazy(() => import("./pages/AttendancePage"));
const AttendanceSessionDetailPage = lazy(() => import("./pages/AttendanceSessionDetailPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const SimpleClassesPage = lazy(() => import("./pages/SimpleClassesPage"));
const SimpleClassDetailPage = lazy(() => import("./pages/SimpleClassDetailPage"));
const StudentProfilePage = lazy(() => import("./pages/StudentProfilePage"));

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

function TeacherWorkspaceApp({ user, onSignOut }) {
  const workspace = useTeacherWorkspaceData(user?.id || "");
  const {
    profilePreferences,
    setProfilePreferences,
    classes,
    students,
    attendanceSessions,
    attendanceEntries,
    loading,
    formError,
    setFormError,
    classForm,
    setClassForm,
    studentForm,
    setStudentForm,
    classOptions,
    ensureDataForPath,
    handleCreateClass,
    handleCreateStudent,
    handleUpdateStudent,
    handleDeleteClass,
    handleUpdateAttendanceEntry,
    handleCreateAttendanceSessionForDate,
    handleDeleteAttendanceSession,
  } = workspace;

  return (
    <WorkspaceProvider value={workspace}>
      <BrowserRouter>
        <WorkspaceRouteDataLoader ensureDataForPath={ensureDataForPath} />
        <Layout
          user={user}
          onSignOut={onSignOut}
          preferences={profilePreferences}
        >
          <Suspense fallback={<RouteFallback />}>
            <Routes>
          <Route path="/" element={<Navigate to="/classes" replace />} />
          <Route
            path="/classes"
            element={
              <SimpleClassesPage
                formError={formError}
                classForm={classForm}
                setClassForm={setClassForm}
                handleCreateClass={handleCreateClass}
                handleDeleteClass={handleDeleteClass}
                classes={classes}
                students={students}
                loading={loading}
              />
            }
          />
          <Route
            path="/classes/:classId"
            element={
              <SimpleClassDetailPage
                formError={formError}
                classes={classes}
                students={students}
                studentForm={studentForm}
                setStudentForm={setStudentForm}
                handleCreateStudent={handleCreateStudent}
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
            path="/students/:studentId"
            element={
              <StudentProfilePage
                students={students}
                classes={classes}
                attendanceSessions={attendanceSessions}
                attendanceEntries={attendanceEntries}
                handleUpdateStudent={handleUpdateStudent}
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
          <Route path="*" element={<Navigate to="/classes" replace />} />
            </Routes>
          </Suspense>
        </Layout>
      </BrowserRouter>
    </WorkspaceProvider>
  );
}
export default TeacherWorkspaceApp;
