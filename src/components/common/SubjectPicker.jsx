import { useState } from "react";
import { normalizeSubjectNames, subjectKey, SUGGESTED_SUBJECTS } from "../../utils/classSubjects";
import "../../styles/class-subjects.css";

export default function SubjectPicker({ onChange, existing = [], disabled = false }) {
  const [selected, setSelected] = useState([]);
  const [custom, setCustom] = useState("");
  const existingKeys = new Set(existing.map((item) => subjectKey(item.name)));
  const change = (nextSelected, nextCustom) => {
    setSelected(nextSelected);
    setCustom(nextCustom);
    onChange(normalizeSubjectNames([...nextSelected, ...nextCustom.split(",")])
      .filter((name) => !existingKeys.has(subjectKey(name))));
  };
  return (
    <fieldset className="class-subject-picker" disabled={disabled}>
      <legend>Subjects you teach <span>(optional)</span></legend>
      <p>Choose suggestions or add your own. You can change these later.</p>
      <div className="class-subject-options">
        {SUGGESTED_SUBJECTS.map((name) => (
          <label key={name}>
            <input type="checkbox" checked={existingKeys.has(subjectKey(name)) || selected.includes(name)} disabled={disabled || existingKeys.has(subjectKey(name))}
              onChange={(event) => change(event.target.checked ? [...selected, name] : selected.filter((item) => item !== name), custom)} />
            <span>{name}</span>
          </label>
        ))}
      </div>
      <label className="stack">
        <span>Other subjects (separate with commas)</span>
        <input value={custom} onChange={(event) => change(selected, event.target.value)} placeholder="e.g. Drama, Portuguese" />
      </label>
    </fieldset>
  );
}
