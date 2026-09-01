import { useEffect, useId, useRef, useState } from "react";
import "../../styles/edit-class.css";

function EditClassModal({ classItem, handleUpdateClass, formError, onClose }) {
  const titleId = useId();
  const formRef = useRef(null);
  const savingRef = useRef(false);
  const [form, setForm] = useState(() => ({
    name: classItem.name || "",
    gradeLevel: classItem.grade_level || "",
    schoolYear: classItem.school_year || "",
  }));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saveFailed, setSaveFailed] = useState(false);

  useEffect(() => {
    const previousFocus = document.activeElement;
    formRef.current?.querySelector("input")?.focus();
    return () => previousFocus?.focus();
  }, []);

  const submit = async (event) => {
    event.preventDefault();
    if (savingRef.current) return;
    setError("");
    setSaveFailed(false);
    if (!form.name.trim()) {
      setError("Class name is required.");
      formRef.current?.querySelector("input")?.focus();
      return;
    }
    savingRef.current = true;
    setSaving(true);
    try {
      const didUpdate = await handleUpdateClass(classItem.id, form);
      if (didUpdate) onClose();
      else setSaveFailed(true);
    } catch {
      setError("Failed to update class. Please try again.");
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  };

  const handleKeyDown = (event) => {
    if (event.key === "Escape") {
      event.stopPropagation();
      if (!savingRef.current) onClose();
    }
    if (event.key !== "Tab") return;
    const controls = [...formRef.current.querySelectorAll("input, button")].filter((item) => !item.disabled);
    const first = controls[0];
    const last = controls[controls.length - 1];
    if (!first) {
      event.preventDefault();
    } else if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first.focus();
    }
  };

  const visibleError = error || (saveFailed ? formError || "Failed to update class. Please try again." : "");

  return (
    <div className="modal-overlay">
      <form
        ref={formRef}
        className="modal-card simple-form edit-class-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={saving}
        onSubmit={submit}
        onKeyDown={handleKeyDown}
      >
        <h3 id={titleId}>Edit class</h3>
        <label className="stack">
          <span>Class name</span>
          <input required readOnly={saving} value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} placeholder="e.g. 4A" />
        </label>
        <div className="edit-class-details">
          <label className="stack">
            <span>Grade or group <em>(optional)</em></span>
            <input readOnly={saving} value={form.gradeLevel} onChange={(event) => setForm((current) => ({ ...current, gradeLevel: event.target.value }))} placeholder="e.g. Grade 4" />
          </label>
          <label className="stack">
            <span>School year <em>(optional)</em></span>
            <input readOnly={saving} value={form.schoolYear} onChange={(event) => setForm((current) => ({ ...current, schoolYear: event.target.value }))} placeholder="e.g. 2026–27" />
          </label>
        </div>
        {visibleError && <div className="error" role="alert">{visibleError}</div>}
        <div className="modal-actions">
          <button type="button" className="secondary" disabled={saving} onClick={onClose}>Cancel</button>
          <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save changes"}</button>
        </div>
      </form>
    </div>
  );
}

export default EditClassModal;
