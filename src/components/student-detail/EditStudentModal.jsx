import { NavLink } from "react-router-dom";
import { STUDENT_GENDER_OPTIONS } from "../../constants/options";

function EditStudentModal({
  showEditInfo,
  setShowEditInfo,
  student,
  studentId,
  editForm,
  setEditForm,
  handleUpdateStudent,
}) {
  if (!showEditInfo || !student) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card student-edit-modal">
        <div className="student-edit-header">
          <h3>Edit Student</h3>
          <p className="muted">
            Update student info and reminders for {student.first_name} {student.last_name}.
          </p>
        </div>
        <form
          className="student-edit-form"
          onSubmit={async (event) => {
            event.preventDefault();
            await handleUpdateStudent(studentId, editForm);
            setShowEditInfo(false);
          }}
        >
          <label className="stack">
            <span>Gender</span>
            <select
              value={editForm.gender}
              onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))}
            >
              {STUDENT_GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>Notes</span>
            <textarea
              rows="3"
              value={editForm.notes}
              onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder="Optional notes about this student"
            />
          </label>
          <p className="muted student-edit-help">
            To keep students apart during group generation, use{" "}
            <NavLink to={`/groups?classId=${student.class_id || ""}`}>Groups → Separations</NavLink>.
          </p>
          <div className="modal-actions student-edit-actions">
            <button type="button" className="secondary" onClick={() => setShowEditInfo(false)}>
              Cancel
            </button>
            <button type="submit">Done</button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default EditStudentModal;
