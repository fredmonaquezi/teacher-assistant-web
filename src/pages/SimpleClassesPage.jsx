import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";

function SimpleClassesPage({
  classes,
  students,
  classForm,
  setClassForm,
  handleCreateClass,
  handleDeleteClass,
  formError,
  loading,
}) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);

  const submitClass = async (event) => {
    event.preventDefault();
    await handleCreateClass(event);
    setShowForm(false);
  };

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      <section className="panel simple-page">
        <div className="simple-page-header">
          <div>
            <p className="simple-kicker">Your classroom</p>
            <h2>Classes</h2>
            <p className="muted">Choose a class to see its students, notes, development, and attendance.</p>
          </div>
          <button type="button" onClick={() => setShowForm(true)}>Add class</button>
        </div>

        {loading ? (
          <p className="muted">Loading classes…</p>
        ) : classes.length === 0 ? (
          <div className="simple-empty">
            <h3>Start with your first class</h3>
            <p>Add a class, then add the students in it.</p>
          </div>
        ) : (
          <div className="simple-class-grid">
            {classes.map((classItem) => {
              const studentCount = students.filter((student) => student.class_id === classItem.id).length;
              return (
                <article key={classItem.id} className="simple-class-card">
                  <button
                    type="button"
                    className="simple-class-card-main"
                    onClick={() => navigate(`/classes/${classItem.id}`)}
                  >
                    <span className="simple-class-card-label">Class</span>
                    <strong>{classItem.name}</strong>
                    <span>{classItem.grade_level || "Grade not set"}{classItem.school_year ? ` · ${classItem.school_year}` : ""}</span>
                    <small>{studentCount} {studentCount === 1 ? "student" : "students"}</small>
                  </button>
                  <button
                    type="button"
                    className="simple-delete-button"
                    onClick={() => setClassToDelete(classItem)}
                    aria-label={`Delete ${classItem.name}`}
                  >
                    Delete
                  </button>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {showForm && (
        <div className="modal-overlay">
          <form className="modal-card simple-form" onSubmit={submitClass}>
            <h3>Add a class</h3>
            <label className="stack">
              <span>Class name</span>
              <input autoFocus required value={classForm.name} onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. 4A" />
            </label>
            <label className="stack">
              <span>Grade or group <em>(optional)</em></span>
              <input value={classForm.gradeLevel} onChange={(event) => setClassForm((current) => ({ ...current, gradeLevel: event.target.value }))} placeholder="e.g. Grade 4" />
            </label>
            <label className="stack">
              <span>School year <em>(optional)</em></span>
              <input value={classForm.schoolYear} onChange={(event) => setClassForm((current) => ({ ...current, schoolYear: event.target.value }))} placeholder="e.g. 2026–27" />
            </label>
            <div className="modal-actions">
              <button type="button" className="secondary" onClick={() => setShowForm(false)}>Cancel</button>
              <button type="submit">Add class</button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        open={Boolean(classToDelete)}
        title="Delete class?"
        description={classToDelete ? `This will permanently delete ${classToDelete.name} and its students.` : ""}
        onCancel={() => setClassToDelete(null)}
        onConfirm={async () => {
          if (!classToDelete?.id) return;
          await handleDeleteClass(classToDelete.id);
          setClassToDelete(null);
        }}
      />
    </>
  );
}

export default SimpleClassesPage;
