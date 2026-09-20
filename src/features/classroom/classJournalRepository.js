export async function fetchClassNotes(supabaseClient, classId) {
  const { data, error } = await supabaseClient
    .from("class_notes")
    .select("id,class_id,note_date,body,created_at")
    .eq("class_id", classId)
    .order("note_date", { ascending: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return data || [];
}

export async function createClassNote(supabaseClient, input) {
  const { error } = await supabaseClient.from("class_notes").insert(input);
  if (error) throw error;
}

export async function deleteClassNote(supabaseClient, noteId) {
  const { error } = await supabaseClient.from("class_notes").delete().eq("id", noteId);
  if (error) throw error;
}
