import { useTranslation } from "react-i18next";
import "../i18n";
import "../styles/landing.css";

function LanguageToggle() {
  const { t, i18n } = useTranslation();

  return (
    <div className="language-toggle landing-language-toggle" aria-label={t("common.language.label")}>
      <button
        type="button"
        className={i18n.language === "en" ? "active" : ""}
        onClick={() => i18n.changeLanguage("en")}
      >
        {t("common.language.en")}
      </button>
      <button
        type="button"
        className={i18n.language === "pt-BR" ? "active" : ""}
        onClick={() => i18n.changeLanguage("pt-BR")}
      >
        {t("common.language.ptBR")}
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

function LandingPage({ user }) {
  const { t } = useTranslation();

  return (
    <main className="landing-page">
      <nav className="landing-nav" aria-label={t("landing.navigationLabel")}>
        <a className="landing-brand" href="/" aria-label={t("landing.homeLabel")}>
          <span className="landing-brand-mark" aria-hidden="true">TC</span>
          <span>Teacher Codex</span>
        </a>
        <div className="landing-nav-actions">
          {user?.email && (
            <span className="landing-session-pill">
              <span aria-hidden="true" />
              {t("landing.signedIn")}
            </span>
          )}
          <LanguageToggle />
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
