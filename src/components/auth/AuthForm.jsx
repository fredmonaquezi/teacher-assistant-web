import { useState } from "react";
import { loadAuthEnv } from "../../config/env";
import { supabase } from "../../supabaseClient";

const { enableGoogleAuth, googleAuthRedirectTo } = loadAuthEnv();

function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (mode === "signup") {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
        });
        if (signUpError) throw signUpError;
        onSuccess("Check your email to confirm your account, then sign in.");
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError("");
    setLoading(true);

    try {
      const redirectTo = googleAuthRedirectTo || window.location.origin;
      const { error: oauthError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
        },
      });
      if (oauthError) throw oauthError;
    } catch (err) {
      setError(err.message || "Unable to start Google sign-in. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card auth-card">
      <div className="auth-head">
        <div className="auth-badge" aria-hidden="true">🎓</div>
        <h1>Teacher Assistant</h1>
        <p className="muted">Sign in to sync your data across devices.</p>
      </div>

      <form onSubmit={handleSubmit} className="stack auth-form">
        <label className="stack">
          <span>Email</span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="stack">
          <span>Password</span>
          <input
            className="auth-input"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
          />
        </label>

        {error && <div className="error">{error}</div>}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading ? "Working..." : mode === "signup" ? "Create account" : "Sign in"}
        </button>
      </form>

      {enableGoogleAuth && (
        <button type="button" className="auth-switch" onClick={handleGoogleSignIn} disabled={loading}>
          {loading ? "Working..." : "Continue with Google"}
        </button>
      )}

      <button
        type="button"
        className="auth-switch"
        disabled={loading}
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup"
          ? "Already have an account? Sign in"
          : "New here? Create an account"}
      </button>
    </div>
  );
}

export default AuthForm;
