import { format, parseISO } from "date-fns";
import { NavLink, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  formatActivityAssessment,
  isActivityGrade,
} from "../utils/activityAssessmentScale";
import useStudentProfileController from "../features/students/useStudentProfileController";
import {
  activityDetailsForEntry,
  criterionEvidenceForEntry,
} from "../features/students/studentProfileModel";
import EditStudentModal from "../components/student-detail/EditStudentModal";
import "../styles/student-profile.css";

function StudentProfilePage({ students, classes, subjects = [], attendanceSessions, attendanceEntries, handleUpdateStudent, loading = false }) {
  const { t } = useTranslation();
  const { studentId } = useParams();
  const student = students.find((item) => item.id === studentId);
  const classItem = classes.find((item) => item.id === student?.class_id);
  const {
    notes, activityAssessments, loadingNotes, loadingActivityAssessments,
    noteError, activityAssessmentError, saving, entry, setEntry,
    profileNote, setProfileNote, showProfileNote, setShowProfileNote,
    showEditInfo, setShowEditInfo, editForm, setEditForm,
    activitySubjectFilter, setActivitySubjectSelection, activitySubjectOptions,
    visibleActivityAssessments, activityPerformance, subjectNameById,
    attendance, attendanceTotal, saveEntry, deleteEntry, saveProfileNote,
  } = useStudentProfileController({
    studentId, student, subjects, attendanceSessions, attendanceEntries, handleUpdateStudent,
  });

  if (loading) return <section className="panel"><p className="muted">Loading student…</p></section>;
  if (!student) return <section className="panel"><h2>Student not found</h2><NavLink to="/classes">Back to classes</NavLink></section>;

  return (
    <>
      {noteError && <div className="error">{noteError}</div>}
      {activityAssessmentError && <div className="error">{activityAssessmentError}</div>}
      <section className="panel simple-page student-profile-page">
        <NavLink className="simple-back" to={`/classes/${student.class_id}`}>← {classItem?.name || "Class"}</NavLink>
        <header className="student-profile-simple-header">
          <span className="simple-avatar large">{`${student.first_name?.[0] || ""}${student.last_name?.[0] || ""}`}</span>
          <div className="student-profile-identity"><p className="simple-kicker">Student</p><h2>{student.first_name} {student.last_name}</h2><p className="muted">{classItem?.name || "No class"}</p></div>
          <div className="student-profile-actions">
          <button type="button" className="secondary" onClick={() => {
            setEditForm({ firstName: student.first_name || "", lastName: student.last_name || "", gender: student.gender || "Prefer not to say", notes: student.notes || "",
              isParticipatingWell: !!student.is_participating_well, needsHelp: !!student.needs_help, missingHomework: !!student.missing_homework });
            setShowEditInfo(true);
          }}>{t("studentEdit.title")}</button>
          <NavLink className="button" to={`/attendance?classId=${student.class_id}`}>Take attendance</NavLink>
          </div>
        </header>

        <section className="student-overview-simple">
          <article><strong>{attendanceTotal}</strong><span>attendance records</span></article>
          <article><strong>{attendance.present}</strong><span>present</span></article>
          <article><strong>{attendance.absent}</strong><span>absent</span></article>
        </section>

        <section className="simple-profile-note">
          <div><h3>Profile note</h3><p>{student.notes || "Add a short, ongoing note about this student."}</p></div>
          <button type="button" className="secondary" aria-label="Edit profile note" onClick={() => { setProfileNote(student.notes || ""); setShowProfileNote(true); }}>Edit note</button>
        </section>

        <div className="student-profile-columns">
        <section className="simple-timeline-section activity-profile-section">
          <div className="simple-section-heading">
            <div><p className="simple-kicker">Class activities</p><h3>Activity assessments</h3></div>
            {activitySubjectOptions.length > 0 && (
              <label className="activity-subject-filter">
                <span>Subject</span>
                <select
                  aria-label="Filter activity assessments by subject"
                  value={activitySubjectFilter}
                  onChange={(event) => setActivitySubjectSelection({ studentId, value: event.target.value })}
                >
                  <option value="all">All subjects</option>
                  {activitySubjectOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            )}
          </div>
          {loadingActivityAssessments ? (
            <p className="muted">Loading activity assessments…</p>
          ) : activityAssessments.length === 0 ? (
            <div className="simple-empty"><h3>No activity assessments yet</h3><p>Assessments recorded from the class page will appear here.</p></div>
          ) : visibleActivityAssessments.length === 0 ? (
            <div className="simple-empty"><h3>No assessments for this subject</h3><p>Choose another subject to review this student's performance.</p></div>
          ) : (
            <>
              <div className="activity-performance-summary" aria-label="Activity performance summary">
                <article><strong>{visibleActivityAssessments.length}</strong><span>assessed activities</span></article>
                <article>
                  <strong>{Number.isFinite(activityPerformance.averageGrade) ? activityPerformance.averageGrade.toFixed(1) : "—"} / 10</strong>
                  <span>average grade</span>
                </article>
                <article>
                  <strong>{activityPerformance.levelLabel}</strong>
                  <span>written average</span>
                </article>
              </div>
              <p className="activity-performance-explanation">
                {activityPerformance.meetingExpectations} of {activityPerformance.sampleCount} {activityPerformance.sampleCount === 1 ? "assessment is" : "assessments are"} at or above expectations. Qualitative results are converted to numerical equivalents only for this average; original records stay unchanged.
              </p>
              <div className="simple-timeline">
                {visibleActivityAssessments.map((assessmentEntry) => {
                  const assessment = activityDetailsForEntry(assessmentEntry);
                  const criterionEvidence = criterionEvidenceForEntry(assessmentEntry, studentId);
                  return (
                    <article key={assessmentEntry.id} className="simple-timeline-entry activity-profile-entry">
                      <div className="simple-entry-meta">
                        <strong>{assessmentEntry.created_at ? `Assessed ${format(parseISO(assessmentEntry.created_at), "d MMM yyyy")}` : "Assessment date not set"}</strong>
                        <span className={`activity-outcome ${isActivityGrade(assessmentEntry.outcome) ? "grade" : assessmentEntry.outcome}`}>
                          {formatActivityAssessment(assessmentEntry.outcome)}
                        </span>
                      </div>
                      <p className="activity-profile-subject">{subjectNameById.get(assessment?.subject_id) || assessment?.subject || "Activity"}</p>
                      <h4 className="activity-profile-title">{assessment?.title || assessment?.subject || "Activity"}</h4>
                      {assessment?.activity_date && <p className="activity-profile-date">Activity started {format(parseISO(assessment.activity_date), "d MMM yyyy")}</p>}
                      <p>{assessment?.description}</p>
                      {criterionEvidence.length > 0 && (
                        <div className="activity-profile-criteria">
                          <strong className="activity-profile-criteria-title">Criteria evidence</strong>
                          <div className="activity-profile-criteria-list">
                            {criterionEvidence.map((evidence) => (
                              <div className="activity-profile-criterion" key={evidence.id}>
                                <span>{evidence.criterionTitle}</span>
                                <span className={`activity-outcome ${isActivityGrade(evidence.outcome) ? "grade" : evidence.outcome}`}>
                                  {formatActivityAssessment(evidence.outcome)}
                                </span>
                                {evidence.notes && <small>{evidence.notes}</small>}
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      {assessmentEntry.notes && <p className="activity-profile-observation"><strong>Observation:</strong> {assessmentEntry.notes}</p>}
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </section>

        <section className="simple-timeline-section student-journal-section">
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
        </div>
      </section>

      <EditStudentModal showEditInfo={showEditInfo} setShowEditInfo={setShowEditInfo} student={student} studentId={studentId} editForm={editForm} setEditForm={setEditForm} handleUpdateStudent={handleUpdateStudent} />
      {showProfileNote && <div className="modal-overlay"><div className="modal-card simple-form student-profile-note-modal" role="dialog" aria-modal="true" aria-labelledby="profile-note-title"><h3 id="profile-note-title">Profile note</h3><label className="stack"><span>Keep this short—a quick reference, not a dated observation.</span><textarea rows="4" value={profileNote} onChange={(event) => setProfileNote(event.target.value)} /></label><div className="modal-actions"><button type="button" className="secondary" onClick={() => setShowProfileNote(false)}>Cancel</button><button type="button" onClick={saveProfileNote}>Save</button></div></div></div>}
    </>
  );
}

export default StudentProfilePage;
