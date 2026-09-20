import { format, parseISO } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { fetchClassActivityHistory } from "../features/activity-assessments/activityAssessmentRepository";

function ActivityAssessmentHistory({ classId, studentCount, refreshKey = "" }) {
  const activitiesQuery = useQuery({
    queryKey: ["class-activity-history", classId, refreshKey],
    queryFn: () => fetchClassActivityHistory(supabase, classId),
    enabled: Boolean(classId),
  });
  const activities = activitiesQuery.data || [];
  const error = activitiesQuery.error?.message || "";

  return (
    <section className="class-activity-history">
      <div className="simple-section-heading">
        <div>
          <p className="simple-kicker">Ongoing records</p>
          <h3>Activity assessments</h3>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {activitiesQuery.isPending ? (
        <p className="muted">Loading activity assessments…</p>
      ) : activities.length === 0 ? (
        <div className="simple-empty">
          <h3>No assessed activities yet</h3>
          <p>Create an activity, assess the students who participated, and return to it later.</p>
        </div>
      ) : (
        <div className="class-activity-list">
          {activities.map((activity) => {
            const assessedCount = activity.activity_assessment_entries?.length || 0;
            const criterionCount = activity.activity_assessment_criteria?.length || 0;
            const remainingCount = Math.max(studentCount - assessedCount, 0);
            return (
              <article className="class-activity-card" key={activity.id}>
                <div>
                  <div className="class-activity-meta">
                    <span>{activity.subject}</span>
                    <span>{format(parseISO(activity.activity_date), "d MMM yyyy")}</span>
                  </div>
                  <h4 className="class-activity-title">{activity.title || activity.subject}</h4>
                  <p>{activity.description}</p>
                  <small>
                    {criterionCount > 0 ? `${criterionCount} ${criterionCount === 1 ? "criterion" : "criteria"} · ` : ""}
                    {assessedCount} of {studentCount} assessed
                    {remainingCount > 0 ? ` · ${remainingCount} remaining` : " · Complete"}
                  </small>
                </div>
                <NavLink
                  className="button secondary"
                  to={`/classes/${classId}/assess-activity/${activity.id}`}
                >
                  {remainingCount > 0 ? "Continue assessing" : "Review activity"}
                </NavLink>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

export default ActivityAssessmentHistory;
