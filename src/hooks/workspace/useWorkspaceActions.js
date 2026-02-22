import createAssessmentActions from "./actions/assessmentActions";
import createAttendanceActions from "./actions/attendanceActions";
import createCalendarActions from "./actions/calendarActions";
import createCoreActions from "./actions/coreActions";
import createGroupActions from "./actions/groupActions";
import createLinkActions from "./actions/linkActions";
import createRubricActions from "./actions/rubricActions";

function useWorkspaceActions(params) {
  return {
    ...createCoreActions(params),
    ...createAssessmentActions(params),
    ...createAttendanceActions(params),
    ...createRubricActions(params),
    ...createCalendarActions(params),
    ...createGroupActions(params),
    ...createLinkActions(params),
  };
}

export default useWorkspaceActions;
