import { format, parseISO } from "date-fns";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const today = () => format(new Date(), "yyyy-MM-dd");

function ClassJournal({ classId }) {
  const [entries, setEntries] = useState([]);
  const [entryDate, setEntryDate] = useState(today());
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const loadEntries = async () => {
    if (!classId) return;
    setLoading(true);
    const { data, error: loadError } = await supabase
      .from("class_notes")
      .select("id,note_date,body,created_at")
      .eq("class_id", classId)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (loadError) setError(loadError.message);
    else {
      setEntries(data || []);
      setError("");
    }
    setLoading(false);
  };

  useEffect(() => { loadEntries(); }, [classId]); // eslint-disable-line react-hooks/exhaustive-deps

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setSaving(true);
    setError("");
    const { error: saveError } = await supabase.from("class_notes").insert({
      class_id: classId,
      note_date: entryDate,
      body: body.trim(),
    });
    setSaving(false);
    if (saveError) { setError(saveError.message); return; }
    setBody("");
    setEntryDate(today());
    await loadEntries();
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this class note?")) return;
    const { error: deleteError } = await supabase.from("class_notes").delete().eq("id", id);
    if (deleteError) { setError(deleteError.message); return; }
    await loadEntries();
  };

  return (
    <section className="simple-timeline-section class-journal">
      <div className="simple-section-heading"><div><p className="simple-kicker">Private class record</p><h3>Daily class notes</h3></div></div>
      {error && <div className="error">{error}</div>}
      <form className="simple-entry-form" onSubmit={saveEntry}>
        <label className="stack class-journal-date"><span>Date</span><input type="date" value={entryDate} onChange={(event) => setEntryDate(event.target.value)} /></label>
        <label className="stack"><span>What happened with the class today?</span><textarea rows="4" value={body} onChange={(event) => setBody(event.target.value)} placeholder="A short class-wide observation, reminder, or follow-up…" required /></label>
        <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save class note"}</button>
      </form>
      {loading ? <p className="muted">Loading class notes…</p> : entries.length === 0 ? <div className="simple-empty"><h3>No class notes yet</h3><p>Daily comments about this class will be saved here.</p></div> : <div className="simple-timeline">
        {entries.map((entry) => <article key={entry.id} className="simple-timeline-entry">
          <div className="simple-entry-meta"><strong>{format(parseISO(entry.note_date), "d MMM yyyy")}</strong><span className="simple-entry-type">Class note</span></div>
          <p>{entry.body}</p><button type="button" className="link simple-entry-delete" onClick={() => deleteEntry(entry.id)}>Delete</button>
        </article>)}
      </div>}
    </section>
  );
}

export default ClassJournal;
