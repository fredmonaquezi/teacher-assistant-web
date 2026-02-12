import { useMemo, useState } from "react";
import { format } from "date-fns";
import { supabase } from "../supabaseClient";

function ProfilePage({ user, preferences, onPreferencesChange }) {
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
      ? format(now, "EEEE, d MMMM yyyy")
      : format(now, "EEEE, MMMM d, yyyy");
  }, [preferences?.dateFormat]);

  const timePreview = useMemo(() => {
    const now = new Date();
    return preferences?.timeFormat === "24h" ? format(now, "HH:mm") : format(now, "h:mm a");
  }, [preferences?.timeFormat]);

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
      setError(updateError.message || "Could not save profile.");
      return;
    }

    setStatus("Profile updated.");
  };

  const savePassword = async (event) => {
    event.preventDefault();
    setError("");
    setStatus("");

    if (passwordForm.password.length < 6) {
      setError("Password should have at least 6 characters.");
      return;
    }
    if (passwordForm.password !== passwordForm.confirmPassword) {
      setError("Password confirmation does not match.");
      return;
    }

    setSavingPassword(true);
    const { error: passwordError } = await supabase.auth.updateUser({
      password: passwordForm.password,
    });
    setSavingPassword(false);
    if (passwordError) {
      setError(passwordError.message || "Could not update password.");
      return;
    }

    setPasswordForm({ password: "", confirmPassword: "" });
    setStatus("Password updated.");
  };

  return (
    <section className="panel profile-page">
      <div className="profile-hero">
        <div className="profile-hero-badge" aria-hidden="true">👤</div>
        <div>
          <h2>Profile & Preferences</h2>
          <p className="muted">Manage your account, security, and app preferences.</p>
        </div>
      </div>

      {status && <div className="profile-status">{status}</div>}
      {error && <div className="error">{error}</div>}

      <section className="profile-section">
        <h3>Basic Info</h3>
        <form className="profile-form" onSubmit={saveProfile}>
          <label className="stack">
            <span>Full name</span>
            <input
              value={profileForm.fullName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, fullName: event.target.value }))}
              placeholder="Your full name"
            />
          </label>
          <label className="stack">
            <span>Display name</span>
            <input
              value={profileForm.displayName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, displayName: event.target.value }))}
              placeholder="How the app should call you"
            />
          </label>
          <label className="stack">
            <span>Email</span>
            <input value={user?.email || ""} disabled />
          </label>
          <label className="stack">
            <span>School</span>
            <input
              value={profileForm.schoolName}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, schoolName: event.target.value }))}
              placeholder="School name"
            />
          </label>
          <label className="stack profile-full">
            <span>Grade levels taught</span>
            <input
              value={profileForm.gradeLevels}
              onChange={(event) => setProfileForm((prev) => ({ ...prev, gradeLevels: event.target.value }))}
              placeholder="e.g., Years 5-6"
            />
          </label>
          <div className="modal-actions profile-actions">
            <button type="submit" disabled={savingProfile}>
              {savingProfile ? "Saving..." : "Save profile"}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-section">
        <h3>Security</h3>
        <form className="profile-form" onSubmit={savePassword}>
          <label className="stack">
            <span>New password</span>
            <input
              type="password"
              value={passwordForm.password}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, password: event.target.value }))}
              placeholder="At least 6 characters"
            />
          </label>
          <label className="stack">
            <span>Confirm new password</span>
            <input
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(event) => setPasswordForm((prev) => ({ ...prev, confirmPassword: event.target.value }))}
              placeholder="Repeat password"
            />
          </label>
          <div className="modal-actions profile-actions">
            <button type="submit" disabled={savingPassword}>
              {savingPassword ? "Updating..." : "Update password"}
            </button>
          </div>
        </form>
      </section>

      <section className="profile-section">
        <h3>Preferences</h3>
        <div className="profile-form">
          <label className="stack">
            <span>Date format</span>
            <select
              value={preferences?.dateFormat || "MDY"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, dateFormat: event.target.value }))
              }
            >
              <option value="MDY">Month / Day / Year</option>
              <option value="DMY">Day / Month / Year</option>
            </select>
          </label>
          <label className="stack">
            <span>Time format</span>
            <select
              value={preferences?.timeFormat || "12h"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, timeFormat: event.target.value }))
              }
            >
              <option value="12h">12-hour</option>
              <option value="24h">24-hour</option>
            </select>
          </label>
          <label className="stack profile-full">
            <span>Default landing page</span>
            <select
              value={preferences?.defaultLandingPath || "/"}
              onChange={(event) =>
                onPreferencesChange((prev) => ({ ...prev, defaultLandingPath: event.target.value }))
              }
            >
              <option value="/">Dashboard</option>
              <option value="/calendar">Calendar</option>
              <option value="/classes">Classes</option>
              <option value="/assessments">Gradebook</option>
            </select>
          </label>
          <div className="profile-preview profile-full">
            <strong>Preview</strong>
            <span>{datePreview} · {timePreview}</span>
          </div>
        </div>
      </section>
    </section>
  );
}

export default ProfilePage;
