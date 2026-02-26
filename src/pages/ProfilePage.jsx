import { useMemo, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ptBR } from "date-fns/locale/pt-BR";
import { useTranslation } from "react-i18next";
import { supabase } from "../supabaseClient";

function ProfilePage({ user, preferences, onPreferencesChange }) {
  const { t, i18n } = useTranslation();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
  const metadata = user?.user_metadata || {};
  const [profileForm, setProfileForm] = useState({
    fullName: metadata.full_name || metadata.name || "",
    displayName: metadata.display_name || "",
    schoolName: metadata.school_name || "",
    gradeLevels: metadata.grade_levels || "",
  });
  const [passwordForm, setPasswordForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");

  const datePreview = useMemo(() => {
    const now = new Date();
    return preferences?.dateFormat === "DMY"
      ? format(now, "EEEE, d MMMM yyyy", { locale })
      : format(now, "EEEE, MMMM d, yyyy", { locale });
  }, [locale, preferences?.dateFormat]);

  const timePreview = useMemo(() => {
    const now = new Date();
    return preferences?.timeFormat === "24h" ? format(now, "HH:mm", { locale }) : format(now, "p", { locale });
  }, [locale, preferences?.timeFormat]);

  const saveProfile = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");
    setSavingProfile(true);

    const payload = {
      data: {
        ...metadata,
        full_name: profileForm.fullName.trim() || null,
        display_name: profileForm.displayName.trim() || null,
        school_name: profileForm.schoolName.trim() || null,
        grade_levels: profileForm.gradeLevels.trim() || null,
      },
    };

    const { error: updateError } = await supabase.auth.updateUser(payload);
    setSavingProfile(false);
    if (updateError) {
      setError(updateError.message || t("profile.messages.couldNotSaveProfile"));
      return;
    }

    setStatus(t("profile.messages.profileUpdated"));
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (passwordForm.password.length < 6) {
      setError(t("profile.messages.passwordLength"));
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError(t("profile.messages.passwordMismatch"));
      return;
    }

    setSavingPassword(true);
    const { error: passwordError } = await supabase.auth.updateUser({
      password: passwordForm.password,
    });
    setSavingPassword(false);
    if (passwordError) {
      setError(passwordError.message || t("profile.messages.couldNotUpdatePassword"));
      return;
    }

    setPasswordForm({ password: "", confirmPassword: "" });
    setStatus(t("profile.messages.passwordUpdated"));
  };

  return (
    <section className="panel profile-page">
      <div className="profile-hero">
        <div className="profile-hero-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="profile-line-icon">
            <circle cx="12" cy="8" r="3.2" />
            <path d="M5.5 18c0-2.7 2.9-4.6 6.5-4.6s6.5 1.9 6.5 4.6" />
          </svg>
        </div>
        <div>
          <h2>{t("profile.title")}</h2>
          <p className="muted">{t("profile.subtitle")}</p>
        </div>
      </div>

      {status && <div className="profile-status">{status}</div>}
      {error && <div className="error">{error}</div>}

      <section className="profile-section">
        <h3>{t("profile.basicInfo.title")}</h3>
        <form className="profile-form" onSubmit={saveProfile}>
          <label className="stack">
            <span>{t("profile.basicInfo.fullName")}</span>
            <input
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder={t("profile.basicInfo.fullNamePlaceholder")}
            />
          </label>
          <label className="stack">
            <span>{t("profile.basicInfo.displayName")}</span>
            <input
              value={profileForm.displayName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder={t("profile.basicInfo.displayNamePlaceholder")}
            />
          </label>
          <label className="stack">
            <span>{t("profile.basicInfo.email")}</span>
            <input value={user?.email || ""} disabled />
          </label>
          <label className="stack">
            <span>{t("profile.basicInfo.school")}</span>
            <input
              value={profileForm.schoolName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, schoolName: event.target.value }))}
              placeholder={t("profile.basicInfo.schoolPlaceholder")}
            />
          </label>
          <label className="stack profile-full">
            <span>{t("profile.basicInfo.gradeLevels")}</span>
            <input
              value={profileForm.gradeLevels}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, gradeLevels: event.target.value }))}
              placeholder={t("profile.basicInfo.gradeLevelsPlaceholder")}
            />
          </label>
          <div className="modal-actions profile-actions">
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? t("profile.basicInfo.saving") : t("profile.basicInfo.save")}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-section">
        <h3>{t("profile.security.title")}</h3>
        <form className="profile-form" onSubmit={savePassword}>
          <label className="stack">
            <span>{t("profile.security.newPassword")}</span>
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder={t("profile.security.newPasswordPlaceholder")}
            />
          </label>
          <label className="stack">
            <span>{t("profile.security.confirmPassword")}</span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              placeholder={t("profile.security.confirmPasswordPlaceholder")}
            />
          </label>
          <div className="modal-actions profile-actions">
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? t("profile.security.updating") : t("profile.security.updatePassword")}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-section">
        <h3>{t("profile.preferences.title")}</h3>
        <div className="profile-form">
          <label className="stack">
            <span>{t("profile.preferences.dateFormat")}</span>
            <select
              value={preferences?.dateFormat || "MDY"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, dateFormat: event.target.value }))
              }
            >
              <option value="MDY">{t("profile.preferences.dateFormatMdy")}</option>
              <option value="DMY">{t("profile.preferences.dateFormatDmy")}</option>
            </select>
          </label>
          <label className="stack">
            <span>{t("profile.preferences.timeFormat")}</span>
            <select
              value={preferences?.timeFormat || "12h"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, timeFormat: event.target.value }))
              }
            >
              <option value="12h">{t("profile.preferences.timeFormat12h")}</option>
              <option value="24h">{t("profile.preferences.timeFormat24h")}</option>
            </select>
          </label>
          <label className="stack profile-full">
            <span>{t("profile.preferences.defaultLandingPage")}</span>
            <select
              value={preferences?.defaultLandingPath || "/"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, defaultLandingPath: event.target.value }))
              }
            >
              <option value="/">{t("profile.preferences.landing.dashboard")}</option>
              <option value="/calendar">{t("profile.preferences.landing.calendar")}</option>
              <option value="/classes">{t("profile.preferences.landing.classes")}</option>
              <option value="/assessments">{t("profile.preferences.landing.gradebook")}</option>
            </select>
          </label>
          <div className="profile-preview profile-full">
            <strong>{t("profile.preferences.preview")}</strong>
            <span>{datePreview} · {timePreview}</span>
          </div>
        </div>
      </section>
    </section>
  );
}

export default ProfilePage;
