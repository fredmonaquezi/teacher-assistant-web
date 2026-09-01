import { NavLink } from "react-router-dom";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { STUDENT_GENDER_OPTIONS } from "../../constants/options";
import "../../styles/student-edit.css";

function genderOptionLabelKey(option) {
  if (option === "Male") return "male";
  if (option === "Female") return "female";
  if (option === "Non-binary") return "nonBinary";
  return "preferNotToSay";
}

function EditStudentModal({
  showEditInfo,
  setShowEditInfo,
  student,
  studentId,
  editForm,
  setEditForm,
  handleUpdateStudent,
}) {
  const { t } = useTranslation();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  if (!showEditInfo || !student) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card student-edit-modal">
        <div className="student-edit-header">
          <h3>{t("studentEdit.title")}</h3>
          <p className="muted">
            {t("studentEdit.description", { name: `${student.first_name} ${student.last_name}` })}
          </p>
        </div>
        <form
          className="student-edit-form"
          onSubmit={async (event) => {
            event.preventDefault();
            if (busy.current) return;
            busy.current = true;
            setSaving(true);
            setError("");
            try {
              const didUpdate = await handleUpdateStudent(studentId, editForm);
              if (didUpdate) setShowEditInfo(false);
              else setError(t("studentEdit.saveError"));
            } catch { setError(t("studentEdit.saveError")); }
            finally { busy.current = false; setSaving(false); }
          }}
        >
          <label className="stack">
            <span>{t("studentEdit.firstName")}</span>
            <input
              readOnly={saving}
              value={editForm.firstName}
              onChange={(event) => setEditForm((prev) => ({ ...prev, firstName: event.target.value }))}
              placeholder={t("studentEdit.firstNamePlaceholder")}
              required
            />
          </label>
          <label className="stack">
            <span>{t("studentEdit.lastName")}</span>
            <input
              readOnly={saving}
              value={editForm.lastName}
              onChange={(event) => setEditForm((prev) => ({ ...prev, lastName: event.target.value }))}
              placeholder={t("studentEdit.lastNamePlaceholder")}
              required
            />
          </label>
          <label className="stack">
            <span>{t("studentEdit.gender")}</span>
            <select
              disabled={saving}
              value={editForm.gender}
              onChange={(event) => setEditForm((prev) => ({ ...prev, gender: event.target.value }))}
            >
              {STUDENT_GENDER_OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {t(`common.gender.${genderOptionLabelKey(option)}`)}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>{t("studentEdit.notes")}</span>
            <textarea
              readOnly={saving}
              rows="3"
              value={editForm.notes}
              onChange={(event) => setEditForm((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={t("studentEdit.notesPlaceholder")}
            />
          </label>
          <p className="muted student-edit-help">
            {t("studentEdit.helpPrefix")}{" "}
            <NavLink to={`/groups?classId=${student.class_id || ""}`}>{t("studentEdit.helpLink")}</NavLink>.
          </p>
          <div className="modal-actions student-edit-actions">
            <button type="button" className="secondary" disabled={saving} onClick={() => { setError(""); setShowEditInfo(false); }}>
              {t("common.actions.cancel")}
            </button>
            <button type="submit" disabled={saving}>{t("common.actions.done")}</button>
          </div>
          {error && <div className="error" role="alert">{error}</div>}
        </form>
      </div>
    </div>
  );
}

export default EditStudentModal;
