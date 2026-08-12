import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";

function ActivityAssessmentHistory({ classId, studentCount, refreshKey = "" }) {
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    const loadActivities = async () => {
      setLoading(true);
      const { data, error: loadError } = await supabase
        .from("activity_assessments")
        .select("id,activity_date,subject,description,created_at,activity_assessment_entries(id,student_id)")
        .eq("class_id", classId)
        .order("activity_date", { ascending: false })
        .order("created_at", { ascending: false });

      if (!active) return;
      if (loadError) {
        setError(loadError.message);
      } else {
        setActivities(data || []);
        setError("");
      }
      setLoading(false);
    };

    loadActivities();
    return () => { active = false; };
  }, [classId, refreshKey]);

  return (
    <section className="class-activity-history">
      <div className="simple-section-heading">
        <div>
          <p className="simple-kicker">Ongoing records</p>
          <h3>Activity assessments</h3>
        </div>
      </div>

      {error && <div className="error">{error}</div>}
      {loading ? (
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
            const remainingCount = Math.max(studentCount - assessedCount, 0);
            return (
              <article className="class-activity-card" key={activity.id}>
                <div>
                  <div className="class-activity-meta">
                    <strong>{activity.subject}</strong>
                    <span>{format(parseISO(activity.activity_date), "d MMM yyyy")}</span>
                  </div>
                  <p>{activity.description}</p>
                  <small>
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
