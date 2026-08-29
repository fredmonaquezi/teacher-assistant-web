import { useState } from "react";
import { NavLink, useLocation, useNavigate, useParams } from "react-router-dom";
import ActivityAssessmentHistory from "../components/ActivityAssessmentHistory";
import ClassJournal from "../components/ClassJournal";

function byName(first, second) {
  return `${first.first_name || ""} ${first.last_name || ""}`.localeCompare(`${second.first_name || ""} ${second.last_name || ""}`, undefined, { sensitivity: "base" });
}

function SimpleClassDetailPage({ classes, students, studentForm, setStudentForm, handleCreateStudent, formError }) {
  const { classId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const classItem = classes.find((item) => item.id === classId);
  const [showStudentForm, setShowStudentForm] = useState(false);
  const [rosterView, setRosterView] = useState("list");
  const classStudents = students.filter((student) => student.class_id === classId).sort(byName);

  if (!classItem) {
    return <section className="panel"><h2>Class not found</h2><NavLink to="/classes">Back to classes</NavLink></section>;
  }

  const submitStudent = async (event) => {
    event.preventDefault();
    setStudentForm((current) => ({ ...current, classId }));
    const didCreate = await handleCreateStudent(event, { classId });
    if (didCreate) setShowStudentForm(false);
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      {location.state?.activityAssessmentSaved && (
        <div className="status">Activity assessment saved to the student profiles.</div>
      )}
      <section className="panel simple-page">
        <NavLink className="simple-back" to="/classes">← Manage classes</NavLink>
        <div className="simple-page-header simple-class-header">
          <div>
            <p className="simple-kicker">Class</p>
            <h2>{classItem.name}</h2>
            <p className="muted">{classItem.grade_level || "Grade not set"}{classItem.school_year ? ` · ${classItem.school_year}` : ""}</p>
          </div>
          <div className="simple-header-actions">
            <button type="button" onClick={() => navigate(`/classes/${classId}/assess-activity`)}>Assess an activity</button>
            <button type="button" onClick={() => setShowStudentForm(true)}>Add student</button>
          </div>
        </div>

        <div className="simple-roster-heading">
          <h3>Students</h3>
          <div className="simple-roster-heading-tools">
            <span className="simple-roster-count">{classStudents.length}</span>
            <div className="simple-view-toggle" role="group" aria-label="Student view">
              <button
                type="button"
                className={rosterView === "list" ? "active" : ""}
                aria-pressed={rosterView === "list"}
                onClick={() => setRosterView("list")}
              >
                List
              </button>
              <button
                type="button"
                className={rosterView === "grid" ? "active" : ""}
                aria-pressed={rosterView === "grid"}
                onClick={() => setRosterView("grid")}
              >
                Grid
              </button>
            </div>
          </div>
        </div>
        {classStudents.length === 0 ? (
          <div className="simple-empty"><h3>No students yet</h3><p>Add students to begin keeping their notes and development records.</p></div>
        ) : (
          <div className={`simple-roster simple-roster-${rosterView}`}>
            {classStudents.map((student) => (
              <NavLink key={student.id} className="simple-student-row" to={`/students/${student.id}`}>
                <span className="simple-avatar">{`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}</span>
                <span><strong>{student.first_name} {student.last_name}</strong><small>{student.notes ? "Profile note saved" : "No profile note"}</small></span>
                <span aria-hidden="true">›</span>
              </NavLink>
            ))}
          </div>
        )}

        <ActivityAssessmentHistory
          classId={classId}
          studentCount={classStudents.length}
          refreshKey={location.key}
        />

        <ClassJournal classId={classId} />
      </section>

      {showStudentForm && (
        <div className="modal-overlay">
          <form className="modal-card simple-form" onSubmit={submitStudent}>
            <h3>Add a student</h3>
            <label className="stack"><span>First name</span><input autoFocus required value={studentForm.firstName} onChange={(event) => setStudentForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
            <label className="stack"><span>Last name</span><input required value={studentForm.lastName} onChange={(event) => setStudentForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
            <div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowStudentForm(false)}>Cancel</button><button type="submit">Add student</button></div>
          </form>
        </div>
      )}
    </>
  );
}

export default SimpleClassDetailPage;
