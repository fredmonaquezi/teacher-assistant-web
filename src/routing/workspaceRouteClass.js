export function getRouteClassId({
  pathname,
  search = "",
  students = [],
  attendanceSessions = [],
}) {
  const classRouteMatch = pathname.match(/^\/classes\/([^/]+)/);
  if (classRouteMatch) return classRouteMatch[1];

  let routeClassId = "";
  const studentRouteMatch = pathname.match(/^\/students\/([^/]+)$/);
  if (studentRouteMatch) {
    routeClassId =
      students.find((student) => student.id === studentRouteMatch[1])?.class_id || "";
  }

  const attendanceRouteMatch = pathname.match(/^\/attendance\/([^/]+)$/);
  if (attendanceRouteMatch) {
    routeClassId =
      attendanceSessions.find((session) => session.id === attendanceRouteMatch[1])?.class_id ||
      "";
  }

  return routeClassId || new URLSearchParams(search).get("classId") || "";
}
