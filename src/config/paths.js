export const APP_PATHS = {
  home: "/",
  teacherAssistant: "/teacherassistant",
  teacherAssistantHome: "/teacherassistant/",
  teacherAssistantResetPassword: "/teacherassistant/reset-password",
  toolbox: "/toolbox/",
};

export function isTeacherAssistantPath(pathname = "") {
  return (
    pathname === APP_PATHS.teacherAssistant ||
    pathname.startsWith(`${APP_PATHS.teacherAssistant}/`)
  );
}
