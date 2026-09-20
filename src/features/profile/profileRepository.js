export async function updateProfile(supabaseClient, data) {
  const { error } = await supabaseClient.auth.updateUser({ data });
  if (error) throw error;
}

export async function updatePassword(supabaseClient, password) {
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) throw error;
}
