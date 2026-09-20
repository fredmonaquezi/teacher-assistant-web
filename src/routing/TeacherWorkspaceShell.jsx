import { useLocation } from "react-router-dom";
import Layout from "../components/layout/Layout";
import useTeacherWorkspaceData from "../hooks/useTeacherWorkspaceData";
import WorkspaceRouteClassSync from "./WorkspaceRouteClassSync";
import WorkspaceRoutes from "./WorkspaceRoutes";

function TeacherWorkspaceShell({ user, onSignOut }) {
  const location = useLocation();
  const workspace = useTeacherWorkspaceData(user?.id || "", location.pathname);
  const {
    activeClassId,
    attendanceSessions,
    classes,
    profilePreferences,
    setActiveClassId,
    students,
  } = workspace;

  return (
    <>
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
        <WorkspaceRoutes workspace={workspace} user={user} />
      </Layout>
    </>
  );
}

export default TeacherWorkspaceShell;
