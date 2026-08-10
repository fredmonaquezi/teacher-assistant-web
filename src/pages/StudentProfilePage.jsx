import { format, parseISO } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { NavLink, useParams } from "react-router-dom";
import { supabase } from "../supabaseClient";
import { summarizeAttendanceEntries } from "../utils/attendanceMetrics";

const today = () => format(new Date(), "yyyy-MM-dd");

function StudentProfilePage({ students, classes, attendanceSessions, attendanceEntries, handleUpdateStudent }) {
  const { studentId } = useParams();
  const student = students.find((item) => item.id === studentId);
  const classItem = classes.find((item) => item.id === student?.class_id);
  const [notes, setNotes] = useState([]);
  const [loadingNotes, setLoadingNotes] = useState(true);
  const [noteError, setNoteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [entry, setEntry] = useState({ noteDate: today(), entryType: "anecdotal", developmentArea: "", developmentLevel: "on_track", body: "" });
  const [profileNote, setProfileNote] = useState("");
  const [showProfileNote, setShowProfileNote] = useState(false);

  const loadNotes = async () => {
    if (!studentId) return;
    setLoadingNotes(true);
    const { data, error } = await supabase
      .from("student_notes")
      .select("id,note_date,entry_type,development_area,development_level,body,created_at")
      .eq("student_id", studentId)
      .order("note_date", { ascending: false })
      .order("created_at", { ascending: false });
    if (error) setNoteError(error.message);
    else {
      setNotes(data || []);
      setNoteError("");
    }
    setLoadingNotes(false);
  };

  useEffect(() => { loadNotes(); }, [studentId]); // eslint-disable-line react-hooks/exhaustive-deps

  const attendance = useMemo(() => {
    const sessionIds = new Set(attendanceSessions.filter((session) => session.class_id === student?.class_id).map((session) => session.id));
    const entries = attendanceEntries.filter((attendanceEntry) => attendanceEntry.student_id === studentId && sessionIds.has(attendanceEntry.session_id));
    return summarizeAttendanceEntries(entries);
  }, [attendanceEntries, attendanceSessions, student?.class_id, studentId]);
  const attendanceTotal = attendance.present + attendance.absent + attendance.late + attendance.leftEarly;

  if (!student) return <section className="panel"><h2>Student not found</h2><NavLink to="/classes">Back to classes</NavLink></section>;

  const saveEntry = async (event) => {
    event.preventDefault();
    if (!entry.body.trim()) return;
    setSaving(true);
    setNoteError("");
    const { error } = await supabase.from("student_notes").insert({
      student_id: studentId,
      note_date: entry.noteDate,
      entry_type: entry.entryType,
      development_area: entry.entryType === "development" ? entry.developmentArea.trim() || null : null,
      development_level: entry.entryType === "development" ? entry.developmentLevel : null,
      body: entry.body.trim(),
    });
    setSaving(false);
    if (error) { setNoteError(error.message); return; }
    setEntry({ noteDate: today(), entryType: "anecdotal", developmentArea: "", developmentLevel: "on_track", body: "" });
    await loadNotes();
  };

  const deleteEntry = async (id) => {
    if (!window.confirm("Delete this entry?")) return;
    const { error } = await supabase.from("student_notes").delete().eq("id", id);
    if (error) { setNoteError(error.message); return; }
    await loadNotes();
  };

  const saveProfileNote = async () => {
    const didSave = await handleUpdateStudent(studentId, {
      gender: student.gender || "Prefer not to say",
      notes: profileNote,
      isParticipatingWell: !!student.is_participating_well,
      needsHelp: !!student.needs_help,
      missingHomework: !!student.missing_homework,
    });
    if (didSave) setShowProfileNote(false);
  };

  return (
    <>
      {noteError && <div className="error">{noteError}</div>}
      <section className="panel simple-page student-profile-page">
        <NavLink className="simple-back" to={`/classes/${student.class_id}`}>← {classItem?.name || "Class"}</NavLink>
        <header className="student-profile-simple-header">
          <span className="simple-avatar large">{`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}</span>
          <div><p className="simple-kicker">Student</p><h2>{student.first_name} {student.last_name}</h2><p className="muted">{classItem?.name || "No class"}</p></div>
        </header>

        <section className="student-overview-simple">
          <article><strong>{attendanceTotal}</strong><span>attendance records</span></article>
          <article><strong>{attendance.present}</strong><span>present</span></article>
          <article><strong>{attendance.absent}</strong><span>absent</span></article>
          <NavLink to={`/attendance?classId=${student.class_id}`}>Take attendance →</NavLink>
        </section>

        <section className="simple-profile-note">
          <div><h3>Profile note</h3><p>{student.notes || "Add a short, ongoing note about this student."}</p></div>
          <button type="button" className="secondary" onClick={() => { setProfileNote(student.notes || ""); setShowProfileNote(true); }}>Edit</button>
        </section>

        <section className="simple-timeline-section">
          <div className="simple-section-heading"><div><p className="simple-kicker">Private record</p><h3>Notes & development</h3></div></div>
          <form className="simple-entry-form" onSubmit={saveEntry}>
            <div className="simple-entry-controls">
              <label className="stack"><span>Date</span><input type="date" value={entry.noteDate} onChange={(event) => setEntry((current) => ({ ...current, noteDate: event.target.value }))} /></label>
              <label className="stack"><span>Entry type</span><select value={entry.entryType} onChange={(event) => setEntry((current) => ({ ...current, entryType: event.target.value }))}><option value="anecdotal">Anecdotal note</option><option value="development">Development update</option></select></label>
              {entry.entryType === "development" && <><label className="stack"><span>Area</span><input value={entry.developmentArea} onChange={(event) => setEntry((current) => ({ ...current, developmentArea: event.target.value }))} placeholder="e.g. Reading" /></label><label className="stack"><span>Current level</span><select value={entry.developmentLevel} onChange={(event) => setEntry((current) => ({ ...current, developmentLevel: event.target.value }))}><option value="needs_support">Needs support</option><option value="on_track">On track</option><option value="exceeding">Exceeding</option></select></label></>}
            </div>
            <label className="stack"><span>What did you observe?</span><textarea rows="4" value={entry.body} onChange={(event) => setEntry((current) => ({ ...current, body: event.target.value }))} placeholder="Write a short factual observation…" required /></label>
            <button type="submit" disabled={saving}>{saving ? "Saving…" : "Save entry"}</button>
          </form>

          {loadingNotes ? <p className="muted">Loading notes…</p> : notes.length === 0 ? <div className="simple-empty"><h3>No entries yet</h3><p>Your observations and development updates will appear here.</p></div> : <div className="simple-timeline">
            {notes.map((note) => <article key={note.id} className="simple-timeline-entry">
              <div className="simple-entry-meta"><strong>{format(parseISO(note.note_date), "d MMM yyyy")}</strong><span className={`simple-entry-type ${note.entry_type}`}>{note.entry_type === "development" ? "Development" : "Anecdotal note"}</span></div>
              {note.development_area && <p className="simple-development-label">{note.development_area} · {(note.development_level || "on_track").replace("_", " ")}</p>}
              <p>{note.body}</p><button type="button" className="link simple-entry-delete" onClick={() => deleteEntry(note.id)}>Delete</button>
            </article>)}
          </div>}
        </section>
      </section>

      {showProfileNote && <div className="modal-overlay"><div className="modal-card simple-form"><h3>Profile note</h3><label className="stack"><span>Keep this short—a quick reference, not a dated observation.</span><textarea rows="5" value={profileNote} onChange={(event) => setProfileNote(event.target.value)} /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowProfileNote(false)}>Cancel</button><button type="button" onClick={saveProfileNote}>Save</button></div></div></div>}
    </>
  );
}

export default StudentProfilePage;
