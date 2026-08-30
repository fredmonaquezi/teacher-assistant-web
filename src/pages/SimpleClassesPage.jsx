import { useState } from "react";
import { useNavigate } from "react-router-dom";
import ConfirmDialog from "../components/common/ConfirmDialog";
import EditClassModal from "../components/common/EditClassModal";
import CreateClassModal from "../components/common/CreateClassModal";

function SimpleClassesPage({
  classes,
  students,
  classForm,
  setClassForm,
  handleCreateClass,
  handleAddClassSubjects,
  handleUpdateClass,
  handleDeleteClass,
  formError,
  setFormError,
  loading,
  activeClassId,
  setActiveClassId = () => {},
}) {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [classToDelete, setClassToDelete] = useState(null);
  const [classToEdit, setClassToEdit] = useState(null);

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
          <button type="button" onClick={() => { setFormError(""); setShowForm(true); }}>Add class</button>
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
                <article
                  key={classItem.id}
                  className={`simple-class-card${activeClassId === classItem.id ? " active" : ""}`}
                >
                  <button
                    type="button"
                    className="simple-class-card-main"
                    aria-current={activeClassId === classItem.id ? "true" : undefined}
                    onClick={() => {
                      setActiveClassId(classItem.id);
                      navigate(`/classes/${classItem.id}`);
                    }}
                  >
                    <span className="simple-class-card-label">
                      {activeClassId === classItem.id ? "Active class" : "Class"}
                    </span>
                    <strong>{classItem.name}</strong>
                    <span>{classItem.grade_level || "Grade not set"}{classItem.school_year ? ` · ${classItem.school_year}` : ""}</span>
                    <small>{studentCount} {studentCount === 1 ? "student" : "students"}</small>
                  </button>
                  <div className="simple-class-card-actions">
                    <button
                      type="button"
                      className="secondary"
                      aria-label={`Edit ${classItem.name}`}
                      onClick={() => {
                        setFormError("");
                        setClassToEdit(classItem);
                      }}
                    >
                      Edit class
                    </button>
                    <button
                      type="button"
                      className="simple-delete-button"
                      onClick={() => setClassToDelete(classItem)}
                      aria-label={`Delete ${classItem.name}`}
                    >
                      Delete
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {classToEdit && (
        <EditClassModal
          key={classToEdit.id}
          classItem={classToEdit}
          handleUpdateClass={handleUpdateClass}
          formError={formError}
          onClose={() => setClassToEdit(null)}
        />
      )}

      {showForm && (
        <CreateClassModal classForm={classForm} setClassForm={setClassForm} handleCreateClass={handleCreateClass}
          handleAddClassSubjects={handleAddClassSubjects} formError={formError} onClose={() => setShowForm(false)} />
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
