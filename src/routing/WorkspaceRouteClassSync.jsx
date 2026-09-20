import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { getRouteClassId } from "./workspaceRouteClass";

function WorkspaceRouteClassSync({
  classes = [],
  students = [],
  attendanceSessions = [],
  activeClassId = "",
  setActiveClassId,
}) {
  const location = useLocation();

  useEffect(() => {
    const routeClassId = getRouteClassId({
      pathname: location.pathname,
      search: location.search,
      students,
      attendanceSessions,
    });
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

export default WorkspaceRouteClassSync;
