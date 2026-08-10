import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ptBR } from "date-fns/locale/pt-BR";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import "../../i18n";
import { formatDisplayName } from "../../utils/formatDisplayName";

function Layout({ user, onSignOut, preferences, children }) {
  const { t, i18n } = useTranslation();
  const appName = "Class Notes";
  const userEmail = user?.email || "";
  const displayName = formatDisplayName(user);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [isMobileViewport, setIsMobileViewport] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.matchMedia("(max-width: 720px)").matches;
  });
  const sidebarIdentity =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    userEmail;
  const now = new Date();
  const locale = i18n.language === "pt-BR" ? ptBR : enUS;
  const todayDateLabel = preferences?.dateFormat === "DMY"
    ? format(now, "EEEE, d MMMM yyyy", { locale })
    : format(now, "EEEE, MMMM d, yyyy", { locale });
  const todayTimeLabel = preferences?.timeFormat === "24h"
    ? format(now, "HH:mm", { locale })
    : format(now, "p", { locale });
  const navLinks = [
    { label: t("layout.nav.classes"), path: "/classes" },
    { label: t("layout.nav.attendance"), path: "/attendance" },
  ];
  const closeMobileSidebar = () => setIsMobileSidebarOpen(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const handleViewportChange = (event) => {
      setIsMobileViewport(event.matches);
      if (!event.matches) setIsMobileSidebarOpen(false);
    };

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleViewportChange);
      return () => mediaQuery.removeEventListener("change", handleViewportChange);
    }

    mediaQuery.addListener(handleViewportChange);
    return () => mediaQuery.removeListener(handleViewportChange);
  }, []);

  useEffect(() => {
    if (!isMobileViewport || !isMobileSidebarOpen) return undefined;

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsMobileSidebarOpen(false);
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isMobileViewport, isMobileSidebarOpen]);

  useEffect(() => {
    if (!isMobileViewport) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = isMobileSidebarOpen ? "hidden" : "";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isMobileViewport, isMobileSidebarOpen]);

  return (
    <div className={`app-shell${isMobileSidebarOpen ? " mobile-sidebar-open" : ""}`}>
      <button
        type="button"
        className="mobile-nav-toggle"
        aria-controls="app-sidebar"
        aria-expanded={isMobileSidebarOpen}
        aria-label={
          isMobileSidebarOpen
            ? t("layout.mobileNav.closeAria")
            : t("layout.mobileNav.openAria")
        }
        onClick={() => setIsMobileSidebarOpen((open) => !open)}
      >
        {isMobileSidebarOpen ? t("layout.mobileNav.close") : t("layout.mobileNav.open")}
      </button>
      <button
        type="button"
        className="mobile-nav-backdrop"
        aria-label={t("layout.mobileNav.closeAria")}
        aria-hidden={!isMobileSidebarOpen}
        tabIndex={isMobileSidebarOpen ? 0 : -1}
        onClick={closeMobileSidebar}
      />
      <aside id="app-sidebar" className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-kicker">{appName}</p>
          <h1 className="sidebar-title">{t("layout.sidebar.title")}</h1>
          <p className="sidebar-email">{t("layout.sidebar.signedInAs", { identity: sidebarIdentity })}</p>
        </div>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.path === "/"}
              onClick={closeMobileSidebar}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <div className="language-toggle" aria-label={t("common.language.label")}>
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
          <NavLink to="/profile" className="sidebar-account-link" onClick={closeMobileSidebar}>
            {t("layout.sidebar.profile")}
          </NavLink>
          <button type="button" className="secondary sidebar-signout" onClick={onSignOut}>
            {t("layout.sidebar.signOut")}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <section className="postit postit-greeting">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <p className="postit-kicker">{appName}</p>
            <h2 className="postit-title">{t("layout.greeting.hello", { name: displayName })}</h2>
            <p className="postit-line">{t("layout.greeting.todayIs", { date: todayDateLabel })}</p>
            <p className="postit-line">{todayTimeLabel}</p>
          </section>
        </header>
        <main className="content notebook-board">
          <div className="notebook-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
