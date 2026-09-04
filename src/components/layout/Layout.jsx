import { useEffect, useState } from "react";
import { format } from "date-fns";
import { enUS } from "date-fns/locale/en-US";
import { ptBR } from "date-fns/locale/pt-BR";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import "../../i18n";
import { APP_PATHS } from "../../config/paths";
import { formatDisplayName } from "../../utils/formatDisplayName";
import ClassSwitcher from "./ClassSwitcher";
import { getClassesNavigationPath } from "./layoutNavigation";

function NavIcon({ kind }) {
  if (kind === "links") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M14.8 7.5h2.4a4 4 0 1 1 0 8h-2.4M9.2 16.5H6.8a4 4 0 1 1 0-8h2.4M8.8 12h6.4" /></svg>;
  }
  if (kind === "home") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m4.5 10 7.5-6 7.5 6v9H14v-5h-4v5H4.5v-9Z" /></svg>;
  }
  if (kind === "classes") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="3" /><path d="M8 9h8M8 13h5" /></svg>;
  }
  if (kind === "attendance") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5.5" width="16" height="14" rx="3" /><path d="M8 3.5v4M16 3.5v4M8 12l2.5 2.5L16 9" /></svg>;
  }
  if (kind === "groups") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="9" cy="8" r="2.5" /><circle cx="16.5" cy="9" r="2" /><path d="M4.5 18c.4-3.1 2.2-4.8 4.5-4.8s4.1 1.7 4.5 4.8M13.5 14.5c.8-.8 1.8-1.2 3-1.2 2 0 3.4 1.4 3.8 3.8" /></svg>;
  }
  if (kind === "random") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="5" y="5" width="14" height="14" rx="3" /><circle cx="9" cy="9" r="1" /><circle cx="15" cy="9" r="1" /><circle cx="12" cy="12" r="1" /><circle cx="9" cy="15" r="1" /><circle cx="15" cy="15" r="1" /></svg>;
  }
  if (kind === "landing") {
    return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 5H6.5A2.5 2.5 0 0 0 4 7.5v9A2.5 2.5 0 0 0 6.5 19H10M13 8l4 4-4 4M8 12h9" /></svg>;
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="8" r="3" /><path d="M5.5 19c.5-3.4 3-5 6.5-5s6 1.6 6.5 5" /></svg>;
}

function Layout({
  user,
  onSignOut,
  preferences,
  classes,
  activeClassId,
  setActiveClassId,
  children,
}) {
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
    { label: t("layout.nav.home"), path: "/", icon: "home", end: true },
    {
      label: t("layout.nav.classes"),
      path: getClassesNavigationPath(activeClassId),
      icon: "classes",
    },
    { label: t("layout.nav.attendance"), path: "/attendance", icon: "attendance" },
    { label: t("layout.nav.groups"), path: "/groups", icon: "groups" },
    { label: t("layout.nav.randomPicker"), path: "/random", icon: "random" },
    { label: t("layout.nav.usefulLinks"), path: "/useful-links", icon: "links" },
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
        <span aria-hidden="true">{isMobileSidebarOpen ? "×" : "☰"}</span>
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
        <NavLink
          className="sidebar-brand"
          to="/"
          end
          aria-label={t("layout.sidebar.workspaceHomeAria")}
          onClick={closeMobileSidebar}
        >
          <span className="sidebar-app-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24"><path d="M5 5.5h10.5A3.5 3.5 0 0 1 19 9v9.5H8.5A3.5 3.5 0 0 1 5 15V5.5Z" /><path d="M9 9h6M9 12h4" /></svg>
          </span>
          <div>
            <p className="sidebar-kicker">{appName}</p>
            <h1 className="sidebar-title">{t("layout.sidebar.title")}</h1>
          </div>
        </NavLink>
        <p className="sidebar-email">{t("layout.sidebar.signedInAs", { identity: sidebarIdentity })}</p>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={Boolean(link.end)}
              onClick={closeMobileSidebar}
            >
              <span className="sidebar-nav-icon"><NavIcon kind={link.icon} /></span>
              <span>{link.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <a
            href={APP_PATHS.home}
            className="sidebar-account-link sidebar-landing-link"
            onClick={closeMobileSidebar}
          >
            <span className="sidebar-nav-icon"><NavIcon kind="landing" /></span>
            <span>{t("layout.sidebar.backToLanding")}</span>
          </a>
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
            <span className="sidebar-nav-icon"><NavIcon kind="profile" /></span>
            <span>{t("layout.sidebar.profile")}</span>
          </NavLink>
          <button type="button" className="secondary sidebar-signout" onClick={onSignOut}>
            {t("layout.sidebar.signOut")}
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <div className="topbar-greeting">
            <p className="postit-kicker">{appName}</p>
            <h2 className="postit-title">{t("layout.greeting.hello", { name: displayName })}</h2>
          </div>
          <ClassSwitcher
            classes={classes}
            activeClassId={activeClassId}
            setActiveClassId={setActiveClassId}
          />
          <div className="topbar-date">
            <p className="postit-line">{t("layout.greeting.todayIs", { date: todayDateLabel })}</p>
            <p className="postit-line">{todayTimeLabel}</p>
          </div>
        </header>
        <main className="content notebook-board">
          <div className="notebook-content">{children}</div>
        </main>
      </div>
    </div>
  );
}

export default Layout;
