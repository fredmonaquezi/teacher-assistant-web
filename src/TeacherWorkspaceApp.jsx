import { BrowserRouter } from "react-router-dom";
import { APP_PATHS } from "./config/paths";
import TeacherWorkspaceShell from "./routing/TeacherWorkspaceShell";
import "./App.css";

function TeacherWorkspaceApp({ user, onSignOut }) {
  return (
    <BrowserRouter basename={APP_PATHS.teacherAssistant}>
      <TeacherWorkspaceShell user={user} onSignOut={onSignOut} />
    </BrowserRouter>
  );
}

export default TeacherWorkspaceApp;
