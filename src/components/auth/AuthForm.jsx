import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { loadAuthEnv } from "../../config/env";
import "../../i18n";
import { supabase } from "../../supabaseClient";

const { enableGoogleAuth, googleClientId, publicAppUrl } = loadAuthEnv();
const GOOGLE_IDENTITY_SCRIPT_SRC = "https://accounts.google.com/gsi/client";
const AUTH_MODES = {
  SIGN_IN: "signin",
  SIGN_UP: "signup",
  FORGOT_PASSWORD: "forgot",
  RESET_PASSWORD: "reset",
};
const MIN_PASSWORD_LENGTH = 6;

const getGoogleIdentityApi = () => globalThis.google?.accounts?.id;
const getRedirectBaseUrl = () => {
  if (publicAppUrl) return publicAppUrl;
  if (typeof window === "undefined") return undefined;
  return window.location.origin;
};

const getAuthRedirectUrl = (pathname = "/") => {
  const baseUrl = getRedirectBaseUrl();
  if (!baseUrl) return undefined;
  return new URL(pathname, baseUrl).toString();
};

const getSignUpEmailRedirect = () => getAuthRedirectUrl("/");
const getPasswordResetRedirect = () => {
  return getAuthRedirectUrl("/reset-password");
};

function AuthForm({ onSuccess, forcedMode, onPasswordResetComplete }) {
  const { t, i18n } = useTranslation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [mode, setMode] = useState(AUTH_MODES.SIGN_IN);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoaded, setGoogleLoaded] = useState(false);
  const googleButtonRef = useRef(null);
  const isSignIn = mode === AUTH_MODES.SIGN_IN;
  const isSignUp = mode === AUTH_MODES.SIGN_UP;
  const isForgotPassword = mode === AUTH_MODES.FORGOT_PASSWORD;
  const isResetPassword = mode === AUTH_MODES.RESET_PASSWORD;

  useEffect(() => {
    if (forcedMode) {
      setMode(forcedMode);
      return;
    }

    if (mode === AUTH_MODES.RESET_PASSWORD) {
      setMode(AUTH_MODES.SIGN_IN);
    }
  }, [forcedMode, mode]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (isSignUp) {
        const emailRedirectTo = getSignUpEmailRedirect();
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          ...(emailRedirectTo ? { options: { emailRedirectTo } } : {}),
        });
        if (signUpError) throw signUpError;
        onSuccess(t("auth.success.checkEmail"));
      } else if (isSignIn) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (signInError) throw signInError;
      } else if (isForgotPassword) {
        const redirectTo = getPasswordResetRedirect();
        const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
          ...(redirectTo ? { redirectTo } : {}),
        });
        if (resetError) throw resetError;
        onSuccess(t("auth.success.resetEmailSent"));
        setMode(AUTH_MODES.SIGN_IN);
      } else if (isResetPassword) {
        if (newPassword.length < MIN_PASSWORD_LENGTH) {
          throw new Error(t("auth.errors.passwordLength", { count: MIN_PASSWORD_LENGTH }));
        }
        if (newPassword !== confirmPassword) {
          throw new Error(t("auth.errors.passwordMismatch"));
        }
        const { error: updateError } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (updateError) throw updateError;
        setNewPassword("");
        setConfirmPassword("");
        onSuccess(t("auth.success.passwordUpdated"));
        if (onPasswordResetComplete) {
          await onPasswordResetComplete();
        } else {
          setMode(AUTH_MODES.SIGN_IN);
        }
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
    if (
      !enableGoogleAuth ||
      !googleLoaded ||
      !googleClientId ||
      !googleButtonRef.current ||
      (!isSignIn && !isSignUp)
    ) {
      return undefined;
    }

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
      text: isSignUp ? "signup_with" : "signin_with",
      logo_alignment: "left",
      width: buttonWidth,
    });

    return () => {
      googleButtonElement.replaceChildren();
      googleIdentity.cancel();
    };
  }, [googleLoaded, isSignIn, isSignUp, t]);

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
        {(isSignIn || isSignUp || isForgotPassword) && (
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
        )}

        {(isSignIn || isSignUp) && (
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
        )}

        {isForgotPassword && <p className="auth-hint">{t("auth.forgotPasswordHelp")}</p>}

        {isResetPassword && (
          <>
            <p className="auth-hint">{t("auth.resetPasswordHelp")}</p>
            <label className="stack">
              <span>{t("auth.newPassword")}</span>
              <input
                className="auth-input"
                type="password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                required
              />
            </label>
            <label className="stack">
              <span>{t("auth.confirmPassword")}</span>
              <input
                className="auth-input"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                required
              />
            </label>
          </>
        )}

        {error && <div className="error">{error}</div>}

        {isSignIn && (
          <button
            type="button"
            className="auth-link"
            disabled={loading}
            onClick={() => {
              setError("");
              setMode(AUTH_MODES.FORGOT_PASSWORD);
            }}
          >
            {t("auth.forgotPassword")}
          </button>
        )}

        <button type="submit" className="auth-submit" disabled={loading}>
          {loading
            ? t("auth.working")
            : isSignUp
              ? t("auth.createAccount")
              : isForgotPassword
                ? t("auth.sendResetLink")
                : isResetPassword
                  ? t("auth.resetPassword")
                  : t("auth.signIn")}
        </button>

        {isForgotPassword && (
          <button
            type="button"
            className="auth-link"
            disabled={loading}
            onClick={() => {
              setError("");
              setMode(AUTH_MODES.SIGN_IN);
            }}
          >
            {t("auth.backToSignIn")}
          </button>
        )}
      </form>

      {enableGoogleAuth && (isSignIn || isSignUp) && (
        <div className="auth-google-wrap" aria-live="polite">
          <div className="auth-divider" aria-hidden="true">
            <span>{t("auth.or")}</span>
          </div>
          <div className="auth-google-panel">
            <p className="auth-google-label">
              {isSignUp ? t("auth.createWithGoogle") : t("auth.signInWithGoogle")}
            </p>
            <div ref={googleButtonRef} className="auth-google-button" />
          </div>
          {loading && <p className="muted auth-google-status">{t("auth.completingGoogleSignIn")}</p>}
        </div>
      )}

      {(isSignIn || isSignUp) && (
        <button
          type="button"
          className="auth-switch"
          disabled={loading}
          onClick={() => setMode(isSignUp ? AUTH_MODES.SIGN_IN : AUTH_MODES.SIGN_UP)}
        >
          {isSignUp
            ? t("auth.alreadyHaveAccount")
            : t("auth.newHere")}
        </button>
      )}
    </div>
  );
}

export default AuthForm;
