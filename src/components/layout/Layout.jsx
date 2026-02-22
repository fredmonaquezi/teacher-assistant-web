import { useEffect, useMemo, useState } from "react";
import {
  addDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { enUS, ptBR } from "date-fns/locale";
import { useTranslation } from "react-i18next";
import { NavLink } from "react-router-dom";
import "../../i18n";
import { formatDisplayName } from "../../utils/formatDisplayName";

function Layout({ user, onSignOut, preferences, calendarEvents = [], children }) {
  const { t, i18n } = useTranslation();
  const appName = "Teacher Assistant";
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
  const upcomingStickyEvents = useMemo(() => {
    const currentDate = new Date();
    const windowStart = startOfDay(currentDate);
    const windowEnd = endOfDay(addDays(currentDate, 15));
    return calendarEvents
      .filter((item) => {
        if (!item?.event_date) return false;
        const eventDate = parseISO(String(item.event_date));
        if (!isValid(eventDate)) return false;
        return eventDate >= windowStart && eventDate <= windowEnd;
      })
      .sort((a, b) => {
        const firstDate = parseISO(String(a.event_date));
        const secondDate = parseISO(String(b.event_date));
        const dateCompare = firstDate.getTime() - secondDate.getTime();
        if (dateCompare !== 0) return dateCompare;
        if (!!a.is_all_day !== !!b.is_all_day) return a.is_all_day ? -1 : 1;
        return (a.start_time || "").localeCompare(b.start_time || "");
      })
      .slice(0, 4);
  }, [calendarEvents]);
  const navLinks = [
    { label: t("layout.nav.dashboard"), path: "/" },
    { label: t("layout.nav.usefulLinks"), path: "/useful-links" },
    { label: t("layout.nav.classes"), path: "/classes" },
    { label: t("layout.nav.attendance"), path: "/attendance" },
    { label: t("layout.nav.gradebook"), path: "/assessments" },
    { label: t("layout.nav.groups"), path: "/groups" },
    { label: t("layout.nav.calendar"), path: "/calendar" },
    { label: t("layout.nav.timer"), path: "/timer" },
    { label: t("layout.nav.randomPicker"), path: "/random" },
    { label: t("layout.nav.runningRecords"), path: "/running-records" },
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
          <section className="postit postit-events">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <div className="postit-header">
              <h3>{t("layout.events.title")}</h3>
              <NavLink to="/calendar" className="postit-calendar-link">
                {t("layout.events.calendar")}
              </NavLink>
            </div>
            {upcomingStickyEvents.length === 0 ? (
              <p className="postit-empty">{t("layout.events.empty")}</p>
            ) : (
              <ul className="postit-events-list">
                {upcomingStickyEvents.map((item) => {
                  const parsedEventDate = parseISO(String(item.event_date));
                  const eventDateLabel = isValid(parsedEventDate)
                    ? format(parsedEventDate, "EEE, MMM d", { locale })
                    : t("layout.events.dateTbd");
                  const parsedStartTime = item.start_time ? parseISO(String(item.start_time)) : null;
                  const eventTimeLabel = item.is_all_day
                    ? t("layout.events.allDay")
                    : parsedStartTime && isValid(parsedStartTime)
                      ? format(parsedStartTime, "p", { locale })
                      : t("layout.events.timeTbd");
                  return (
                    <li key={item.id}>
                      <span>{eventDateLabel}</span>
                      <strong>{item.title || t("layout.events.untitled")}</strong>
                      <em>{eventTimeLabel}</em>
                    </li>
                  );
                })}
              </ul>
            )}
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
