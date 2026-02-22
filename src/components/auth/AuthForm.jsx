import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadAuthEnv } from "../../config/env";
import "../../i18n";
import { supabase } from "../../supabaseClient";

const { enableGoogleAuth, googleClientId } = loadAuthEnv();
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

const getGoogleIdentityApi = () => globalThis.google?.accounts?.id;

function AuthForm({ onSuccess }) {
  const { t, i18n } = useTranslation();
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
        onSuccess(t("auth.success.checkEmail"));
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || t("auth.errors.generic"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!enableGoogleAuth) return undefined;
    if (!googleClientId) {
      setError(t("auth.errors.googleMissingClientId"));
      return undefined;
    }

    let disposed = false;
    const markLoaded = () => {
      if (!disposed) setGoogleLoaded(true);
    };
    const markFailed = () => {
      if (!disposed) setError(t("auth.errors.googleLoadFailed"));
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
  }, [t]);

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
        if (!token) throw new Error(t("auth.errors.googleMissingCredential"));
        const { error: signInError } = await supabase.auth.signInWithIdToken({
          provider: "google",
          token,
        });
        if (signInError) throw signInError;
      } catch (err) {
        setError(err.message || t("auth.errors.googleSignInFailed"));
      } finally {
        setLoading(false);
      }
    };

    googleIdentity.initialize({
      client_id: googleClientId,
      callback: handleCredential,
      ux_mode: "popup",
    });

    const buttonWidth = Math.max(
      260,
      Math.min(380, Math.floor(googleButtonElement.getBoundingClientRect().width || 360))
    );

    googleIdentity.renderButton(googleButtonElement, {
      type: "standard",
      theme: "outline",
      size: "large",
      shape: "pill",
      text: mode === "signup" ? "signup_with" : "signin_with",
      logo_alignment: "left",
      width: buttonWidth,
    });

    return () => {
      googleButtonElement.replaceChildren();
      googleIdentity.cancel();
    };
  }, [googleLoaded, mode, t]);

  return (
    <div className="card auth-card">
      <div className="auth-head">
        <div className="auth-badge" aria-hidden="true">🎓</div>
        <h1>{t("auth.title")}</h1>
        <p className="muted">{t("auth.subtitle")}</p>
        <div className="language-toggle auth-language-toggle" aria-label={t("common.language.label")}>
          <button
            type="button"
            className={i18n.language === "en" ? "active" : ""}
            onClick={() => i18n.changeLanguage("en")}
            disabled={loading}
          >
            {t("common.language.en")}
          </button>
          <button
            type="button"
            className={i18n.language === "pt-BR" ? "active" : ""}
            onClick={() => i18n.changeLanguage("pt-BR")}
            disabled={loading}
          >
            {t("common.language.ptBR")}
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="stack auth-form">
        <label className="stack">
          <span>{t("auth.email")}</span>
          <input
            className="auth-input"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
        </label>

        <label className="stack">
          <span>{t("auth.password")}</span>
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
          {loading ? t("auth.working") : mode === "signup" ? t("auth.createAccount") : t("auth.signIn")}
        </button>
      </form>

      {enableGoogleAuth && (
        <div className="auth-google-wrap" aria-live="polite">
          <div className="auth-divider" aria-hidden="true">
            <span>{t("auth.or")}</span>
          </div>
          <div className="auth-google-panel">
            <p className="auth-google-label">
              {mode === "signup" ? t("auth.createWithGoogle") : t("auth.signInWithGoogle")}
            </p>
            <div ref={googleButtonRef} className="auth-google-button" />
          </div>
          {loading && <p className="muted auth-google-status">{t("auth.completingGoogleSignIn")}</p>}
        </div>
      )}

      <button
        type="button"
        className="auth-switch"
        disabled={loading}
        onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
      >
        {mode === "signup"
          ? t("auth.alreadyHaveAccount")
          : t("auth.newHere")}
      </button>
    </div>
  );
}

export default AuthForm;
