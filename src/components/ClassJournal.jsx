import { format, parseISO } from "date-fns";
import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabaseClient";
import {
  createClassNote,
  deleteClassNote,
  fetchClassNotes,
} from "../features/classroom/classJournalRepository";

const today = () => format(new Date(), "yyyy-MM-dd");

function ClassJournal({ classId }) {
  const queryClient = useQueryClient();
  const [entryDate, setEntryDate] = useState(today());
  const [body, setBody] = useState("");
  const [mutationError, setMutationError] = useState("");
  const queryKey = ["class-notes", classId];
  const notesQuery = useQuery({
    queryKey,
    queryFn: () => fetchClassNotes(supabase, classId),
    enabled: Boolean(classId),
  });
  const createMutation = useMutation({
    mutationFn: (input) => createClassNote(supabase, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const deleteMutation = useMutation({
    mutationFn: (id) => deleteClassNote(supabase, id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });
  const entries = notesQuery.data || [];
  const error = mutationError || notesQuery.error?.message || "";
  const saving = createMutation.isPending;

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!body.trim()) return;
    setMutationError("");
    try {
      await createMutation.mutateAsync({
        class_id: classId,
        note_date: entryDate,
        body: body.trim(),
      });
      setBody("");
      setEntryDate(today());
    } catch (saveError) {
      setMutationError(saveError.message);
    }
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this class note?")) return;
    setMutationError("");
    try {
      await deleteMutation.mutateAsync(id);
    } catch (deleteError) {
      setMutationError(deleteError.message);
    }
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
      {notesQuery.isPending ? <p className="muted">Loading class notes…</p> : entries.length === 0 ? <div className="simple-empty"><h3>No class notes yet</h3><p>Daily comments about this class will be saved here.</p></div> : <div className="simple-timeline">
        {entries.map((entry) => <article key={entry.id} className="simple-timeline-entry">
          <div className="simple-entry-meta"><strong>{format(parseISO(entry.note_date), "d MMM yyyy")}</strong><span className="simple-entry-type">Class note</span></div>
          <p>{entry.body}</p><button type="button" className="link simple-entry-delete" onClick={() => deleteEntry(entry.id)}>Delete</button>
        </article>)}
      </div>}
    </section>
  );
}

export default ClassJournal;
