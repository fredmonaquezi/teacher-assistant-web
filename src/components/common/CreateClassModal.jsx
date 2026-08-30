import { useRef, useState } from "react";
import SubjectPicker from "./SubjectPicker";
import useModalFocus from "../../hooks/useModalFocus";

export default function CreateClassModal({ classForm, setClassForm, handleCreateClass, handleAddClassSubjects, formError, onClose }) {
  const [names, setNames] = useState([]);
  const [createdId, setCreatedId] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const busy = useRef(false);
  const modalProps = useModalFocus(onClose, busy);
  const submit = async (event) => {
    event.preventDefault();
    if (busy.current) return;
    if (names.some((name) => name.length > 100)) { setError("Subject names can have up to 100 characters."); return; }
    if (!createdId && !classForm.name.trim()) { setError("Class name is required."); return; }
    busy.current = true;
    setSaving(true);
    setError("");
    try {
      const id = createdId || await handleCreateClass(event);
      if (!id) return;
      setCreatedId(id);
      if (names.length && !await handleAddClassSubjects(id, names)) return;
      onClose();
    } catch {
      setError("Could not finish setup. Please retry.");
    } finally { busy.current = false; setSaving(false); }
  };
  return (
    <div className="modal-overlay">
      <form {...modalProps} className="modal-card class-setup-modal" role="dialog" aria-modal="true" aria-labelledby="class-setup-title" aria-busy={saving} onSubmit={submit}>
        <h3 id="class-setup-title">{createdId ? "Finish subject setup" : "Add a class"}</h3>
        {createdId ? <p className="status">Your class has been created. Retry saving its subjects, or close and add them later from the class page.</p> : (
          <>
            <label className="stack"><span>Class name</span><input autoFocus required readOnly={saving} value={classForm.name} onChange={(event) => setClassForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. 4A" /></label>
            <div className="class-setup-details">
              <label className="stack"><span>Grade or group <em>(optional)</em></span><input readOnly={saving} value={classForm.gradeLevel} onChange={(event) => setClassForm((current) => ({ ...current, gradeLevel: event.target.value }))} placeholder="e.g. Grade 4" /></label>
              <label className="stack"><span>School year <em>(optional)</em></span><input readOnly={saving} value={classForm.schoolYear} onChange={(event) => setClassForm((current) => ({ ...current, schoolYear: event.target.value }))} placeholder="e.g. 2026–27" /></label>
            </div>
          </>
        )}
        <SubjectPicker onChange={setNames} disabled={saving} />
        {(error || formError) && <div className="error" role="alert">{error || formError}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary" disabled={saving} onClick={onClose}>{createdId ? "Close" : "Cancel"}</button>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : createdId ? "Save subjects" : "Add class"}</button>
        </div>
      </form>
    </div>
  );
}
