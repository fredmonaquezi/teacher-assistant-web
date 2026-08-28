import { useState } from "react";
import { useTranslation } from "react-i18next";
import "../i18n";
import "../styles/landing.css";

function LanguageToggle() {
  const { t, i18n } = useTranslation();

  return (
    <div className="landing-language-control">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="12" cy="12" r="8.5" />
        <path d="M3.8 12h16.4M12 3.5c2.1 2.3 3.2 5.1 3.2 8.5S14.1 18.2 12 20.5M12 3.5C9.9 5.8 8.8 8.6 8.8 12s1.1 6.2 3.2 8.5" />
      </svg>
      <div className="language-toggle landing-language-toggle" aria-label={t("common.language.label")}>
        <button
          type="button"
          className={i18n.language === "en" ? "active" : ""}
          aria-pressed={i18n.language === "en"}
          onClick={() => i18n.changeLanguage("en")}
        >
          {t("common.language.en")}
        </button>
        <button
          type="button"
          className={i18n.language === "pt-BR" ? "active" : ""}
          aria-pressed={i18n.language === "pt-BR"}
          onClick={() => i18n.changeLanguage("pt-BR")}
        >
          {t("common.language.ptBR")}
        </button>
      </div>
    </div>
  );
}

function AccountControls({ user, onSignOut }) {
  const { t } = useTranslation();
  const [isSigningOut, setIsSigningOut] = useState(false);

  if (!user) {
    return (
      <a className="landing-sign-in" href="/teacherassistant/">
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M14 5h3.5A1.5 1.5 0 0 1 19 6.5v11a1.5 1.5 0 0 1-1.5 1.5H14M10 8l4 4-4 4M14 12H4" />
        </svg>
        {t("landing.account.signIn")}
      </a>
    );
  }

  const metadata = user.user_metadata || {};
  const accountName =
    metadata.display_name || metadata.full_name || metadata.name || user.email || "Teacher";
  const accountEmail = user.email || "";
  const initials = accountName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");

  const handleSignOut = async () => {
    if (!onSignOut || isSigningOut) return;
    setIsSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="landing-account-controls">
      <a
        className="landing-account-link"
        href="/teacherassistant/profile"
        aria-label={t("landing.account.openProfile", { identity: accountEmail || accountName })}
      >
        <span className="landing-account-avatar" aria-hidden="true">{initials}</span>
        <span className="landing-account-copy">
          <strong>{accountName}</strong>
          {accountEmail && accountEmail !== accountName && <small>{accountEmail}</small>}
        </span>
        <svg className="landing-account-chevron" viewBox="0 0 24 24" aria-hidden="true">
          <path d="m9 5 7 7-7 7" />
        </svg>
      </a>
      <button
        type="button"
        className="landing-sign-out"
        onClick={handleSignOut}
        disabled={isSigningOut}
        aria-label={isSigningOut ? t("landing.account.signingOut") : t("landing.account.signOut")}
        title={isSigningOut ? t("landing.account.signingOut") : t("landing.account.signOut")}
      >
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path d="M10 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H10M14 8l4 4-4 4M18 12H9" />
        </svg>
      </button>
    </div>
  );
}

function AssistantPreview() {
  return (
    <div className="landing-product-preview assistant-preview" aria-hidden="true">
      <div className="preview-sidebar">
        <span className="preview-sidebar-brand" />
        <span className="preview-sidebar-line is-active" />
        <span className="preview-sidebar-line" />
        <span className="preview-sidebar-line is-short" />
      </div>
      <div className="preview-workspace">
        <span className="preview-heading" />
        <div className="preview-stat-row">
          <span />
          <span />
          <span />
        </div>
        <div className="preview-list">
          <span />
          <span />
          <span />
        </div>
      </div>
    </div>
  );
}

function ToolboxPreview() {
  return (
    <div className="landing-product-preview toolbox-preview" aria-hidden="true">
      <span className="toolbox-orbit orbit-one" />
      <span className="toolbox-orbit orbit-two" />
      <div className="toolbox-mini-card is-blue"><strong>?</strong><span /></div>
      <div className="toolbox-mini-card is-gold"><strong>12</strong><span /></div>
      <div className="toolbox-mini-card is-coral"><strong>A</strong><span /></div>
    </div>
  );
}

function LandingPage({ user, onSignOut }) {
  const { t } = useTranslation();

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label={t("landing.navigationLabel")}>
        <a className="landing-brand" href="/" aria-label={t("landing.homeLabel")}>
          <span className="landing-brand-mark" aria-hidden="true">TC</span>
          <span>Teacher Codex</span>
        </a>
        <div className="landing-nav-actions">
          <LanguageToggle />
          <span className="landing-nav-divider" aria-hidden="true" />
          <AccountControls user={user} onSignOut={onSignOut} />
        </div>
      </nav>

      <section className="landing-hero">
        <p className="landing-eyebrow">{t("landing.eyebrow")}</p>
        <h1>{t("landing.title")}</h1>
        <p className="landing-intro">{t("landing.intro")}</p>
      </section>

      <section className="landing-products" aria-label={t("landing.productsLabel")}>
        <article className="landing-product-card assistant-card">
          <AssistantPreview />
          <div className="landing-product-copy">
            <div className="landing-product-heading">
              <span className="landing-product-mark assistant-mark" aria-hidden="true">TA</span>
              <div>
                <p>{t("landing.assistant.kicker")}</p>
                <h2>{t("landing.assistant.title")}</h2>
              </div>
            </div>
            <p className="landing-product-description">{t("landing.assistant.description")}</p>
            <ul className="landing-feature-list">
              <li>{t("landing.assistant.featureOne")}</li>
              <li>{t("landing.assistant.featureTwo")}</li>
              <li>{t("landing.assistant.featureThree")}</li>
            </ul>
            <div className="landing-card-footer">
              <div className="landing-access-note">
                <span className="access-dot is-protected" aria-hidden="true" />
                <span>
                  <strong>{t("landing.assistant.accessTitle")}</strong>
                  <small>{t("landing.assistant.accessDescription")}</small>
                </span>
              </div>
              <a className="landing-card-action assistant-action" href="/teacherassistant/">
                {user ? t("landing.assistant.openAction") : t("landing.assistant.signInAction")}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>

        <article className="landing-product-card toolbox-card">
          <ToolboxPreview />
          <div className="landing-product-copy">
            <div className="landing-product-heading">
              <span className="landing-product-mark toolbox-mark" aria-hidden="true">TT</span>
              <div>
                <p>{t("landing.toolbox.kicker")}</p>
                <h2>{t("landing.toolbox.title")}</h2>
              </div>
            </div>
            <p className="landing-product-description">{t("landing.toolbox.description")}</p>
            <ul className="landing-feature-list">
              <li>{t("landing.toolbox.featureOne")}</li>
              <li>{t("landing.toolbox.featureTwo")}</li>
              <li>{t("landing.toolbox.featureThree")}</li>
            </ul>
            <div className="landing-card-footer">
              <div className="landing-access-note">
                <span className="access-dot is-open" aria-hidden="true" />
                <span>
                  <strong>{t("landing.toolbox.accessTitle")}</strong>
                  <small>{t("landing.toolbox.accessDescription")}</small>
                </span>
              </div>
              <a className="landing-card-action toolbox-action" href="/toolbox/">
                {t("landing.toolbox.openAction")}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </div>
        </article>
      </section>

      <footer className="landing-footer">
        <span>{t("landing.footer")}</span>
        <span aria-hidden="true">•</span>
        <a href="mailto:hello@teachercodex.com">hello@teachercodex.com</a>
      </footer>
    </main>
  );
}

export default LandingPage;
