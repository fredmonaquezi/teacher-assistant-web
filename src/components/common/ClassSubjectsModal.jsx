import { useRef, useState } from "react";
import SubjectPicker from "./SubjectPicker";
import useModalFocus from "../../hooks/useModalFocus";

export default function ClassSubjectsModal({ classItem, subjects, onAdd, onRename, formError, onClose }) {
  const [names, setNames] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [pickerKey, setPickerKey] = useState(0);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const busy = useRef(false);
  const modalProps = useModalFocus(onClose, busy);
  const save = async (operation, success) => {
    if (busy.current) return;
    busy.current = true;
    setSaving(true);
    setMessage("");
    try { if (await operation()) { success(); setMessage("Subjects saved."); } }
    catch { setMessage("Could not save subjects. Please retry."); }
    finally { busy.current = false; setSaving(false); }
  };
  return (
    <div className="modal-overlay">
      <section {...modalProps} className="modal-card class-setup-modal" role="dialog" aria-modal="true" aria-labelledby="class-subjects-title" aria-busy={saving}>
        <h3 id="class-subjects-title">Subjects · {classItem.name}</h3>
        <p className="muted">These subjects appear when assessing this class. Renaming keeps existing records linked; saved activity labels stay unchanged.</p>
        {subjects.length ? <div className="class-subject-edit-list">
          {subjects.map((subject) => (
            <form key={subject.id} className="class-subject-edit-row" onSubmit={(event) => {
              event.preventDefault();
              void save(() => onRename(classItem.id, subject.id, drafts[subject.id] ?? subject.name), () => setDrafts((current) => { const next = { ...current }; delete next[subject.id]; return next; }));
            }}>
              <input aria-label={`Subject name: ${subject.name}`} required maxLength={100} readOnly={saving} value={drafts[subject.id] ?? subject.name} onChange={(event) => setDrafts((current) => ({ ...current, [subject.id]: event.target.value }))} />
              <button type="submit" className="secondary" disabled={saving || drafts[subject.id] === undefined || drafts[subject.id].trim() === subject.name} aria-label={`Save ${subject.name}`}>Save</button>
            </form>
          ))}
        </div> : <p className="muted">No subjects yet. Add the subjects you teach below.</p>}
        <form onSubmit={(event) => { event.preventDefault(); void save(() => onAdd(classItem.id, names), () => { setNames([]); setPickerKey((key) => key + 1); }); }}>
          <SubjectPicker key={pickerKey} onChange={setNames} existing={subjects} disabled={saving} />
          <button className="class-subject-add" type="submit" disabled={saving || !names.length}>{saving ? "Saving…" : "Add subjects"}</button>
        </form>
        {formError && <div className="error" role="alert">{formError}</div>}
        {message && <p role="status">{message}</p>}
        <button type="button" className="secondary" disabled={saving} onClick={onClose}>Done</button>
      </section>
    </div>
  );
}
