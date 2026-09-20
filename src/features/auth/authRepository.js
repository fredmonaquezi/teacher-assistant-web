export async function getCurrentUser(supabaseClient) {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session?.user ?? null;
}

export function subscribeToAuthChanges(supabaseClient, callback) {
  const { data } = supabaseClient.auth.onAuthStateChange(callback);
  return () => data.subscription.unsubscribe();
}

export async function signOut(supabaseClient) {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;
}

export async function signUp(supabaseClient, { email, password, emailRedirectTo }) {
  const { error } = await supabaseClient.auth.signUp({
    email,
    password,
    ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
  });
  if (error) throw error;
}

export async function signInWithPassword(supabaseClient, credentials) {
  const { error } = await supabaseClient.auth.signInWithPassword(credentials);
  if (error) throw error;
}

export async function sendPasswordReset(supabaseClient, { email, redirectTo }) {
  const { error } = await supabaseClient.auth.resetPasswordForEmail(email, {
    ...(redirectTo ? { redirectTo } : {}),
  });
  if (error) throw error;
}

export async function setPassword(supabaseClient, password) {
  const { error } = await supabaseClient.auth.updateUser({ password });
  if (error) throw error;
}

export async function signInWithGoogleToken(supabaseClient, token) {
  const { error } = await supabaseClient.auth.signInWithIdToken({
    provider: "google",
    token,
  });
  if (error) throw error;
}
