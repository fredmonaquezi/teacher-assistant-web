export async function fetchStudentNotes(supabaseClient, studentId) {
  const { data, error } = await supabaseClient
    .from("student_notes")
    .select("id,student_id,note_date,entry_type,development_area,development_level,body,created_at")
    .eq("student_id", studentId)
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createStudentNote(supabaseClient, input) {
  const { error } = await supabaseClient.from("student_notes").insert(input);
  if (error) throw error;
}

export async function deleteStudentNote(supabaseClient, noteId) {
  const { error } = await supabaseClient.from("student_notes").delete().eq("id", noteId);
  if (error) throw error;
}
