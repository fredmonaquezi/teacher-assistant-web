import { useEffect, useRef, useState } from "react";
import { loadAuthEnv } from "../../config/env";
import { supabase } from "../../supabaseClient";

const { enableGoogleAuth, googleClientId } = loadAuthEnv();
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const getGoogleIdentityApi = () => globalThis.google?.accounts?.id;

function AuthForm({ onSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState("signin");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);

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

  useEffect(() => {
    if (!enableGoogleAuth) return undefined;
    if (!googleClientId) {
      setError("Google auth is enabled, but VITE_GOOGLE_CLIENT_ID is missing.");
      return undefined;
    }

    let disposed = false;
    const markLoaded = () => {
      if (!disposed) setGoogleLoaded(true);
    };
    const markFailed = () => {
      if (!disposed) setError("Failed to load Google sign-in. Refresh and try again.");
    };

    if (getGoogleIdentityApi()) {
      markLoaded();
      return () => {
        disposed = true;
      };
    }

    const existingScript = document.querySelector(`script[src="${GOOGLE_IDENTITY_SCRIPT_SRC}"]`);
    const script = existingScript || document.createElement("script");

    if (!existingScript) {
      script.src = GOOGLE_IDENTITY_SCRIPT_SRC;
      script.async = true;
      script.defer = true;
      document.head.appendChild(script);
    }

    script.addEventListener("load", markLoaded);
    script.addEventListener("error", markFailed);

    return () => {
      disposed = true;
      script.removeEventListener("load", markLoaded);
      script.removeEventListener("error", markFailed);
    };
  }, []);

  useEffect(() => {
    if (!enableGoogleAuth || !googleLoaded || !googleClientId || !googleButtonRef.current) return undefined;

    const googleIdentity = getGoogleIdentityApi();
    if (!googleIdentity) return undefined;
    const googleButtonElement = googleButtonRef.current;

    const handleCredential = async (response) => {
      setError("");
      setLoading(true);
      try {
        const token = response?.credential;
        if (!token) throw new Error("Google did not return a login credential.");
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token,
        });
        if (signInError) throw signInError;
      } catch (err) {
        setError(err.message || "Google sign-in failed. Try again.");
      } finally {
        setLoading(false);
      }
    };

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      ux_mode: "popup",
    });
    googleIdentity.renderButton(googleButtonElement, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "rectangular",
      text: "signin_with",
      logo_alignment: "left",
      width: 360,
    });

    return () => {
      googleButtonElement.replaceChildren();
      googleIdentity.cancel();
    };
  }, [googleLoaded]);

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
        <div className="auth-google-wrap" aria-live="polite">
          <div ref={googleButtonRef} className="auth-google-button" />
          {loading && <p className="muted auth-google-status">Completing Google sign-in...</p>}
        </div>
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
