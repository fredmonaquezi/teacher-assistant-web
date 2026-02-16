import { useMemo } from "react";
import {
  addDays,
  endOfDay,
  format,
  isValid,
  parseISO,
  startOfDay,
} from "date-fns";
import { NavLink } from "react-router-dom";
import { formatDisplayName } from "../../utils/formatDisplayName";

function Layout({ user, onSignOut, preferences, calendarEvents = [], children }) {
  const userEmail = user?.email || "";
  const displayName = formatDisplayName(user);
  const sidebarIdentity =
    user?.user_metadata?.display_name ||
    user?.user_metadata?.full_name ||
    userEmail;
  const now = new Date();
  const todayDateLabel = preferences?.dateFormat === "DMY"
    ? format(now, "EEEE, d MMMM yyyy")
    : format(now, "EEEE, MMMM d, yyyy");
  const todayTimeLabel = preferences?.timeFormat === "24h"
    ? format(now, "HH:mm")
    : format(now, "h:mm a");
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
    { label: "Dashboard", path: "/" },
    { label: "Classes", path: "/classes" },
    { label: "Attendance", path: "/attendance" },
    { label: "Gradebook", path: "/assessments" },
    { label: "Groups", path: "/groups" },
    { label: "Calendar", path: "/calendar" },
    { label: "Timer", path: "/timer" },
    { label: "Random Picker", path: "/random" },
    { label: "Running Records", path: "/running-records" },
  ];

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="sidebar-brand">
          <p className="sidebar-kicker">Teacher Assistant</p>
          <h1 className="sidebar-title">Classroom Hub</h1>
          <p className="sidebar-email">Signed in as {sidebarIdentity}</p>
        </div>
        <nav className="nav-links">
          {navLinks.map((link) => (
            <NavLink key={link.path} to={link.path} end={link.path === "/"}>
              {link.label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-account">
          <NavLink to="/profile" className="sidebar-account-link">
            Profile
          </NavLink>
          <button type="button" className="secondary sidebar-signout" onClick={onSignOut}>
            Sign out
          </button>
        </div>
      </aside>
      <div className="workspace">
        <header className="topbar">
          <section className="postit postit-greeting">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <p className="postit-kicker">Teacher Assistant</p>
            <h2 className="postit-title">Hello, {displayName}.</h2>
            <p className="postit-line">Today is {todayDateLabel}</p>
            <p className="postit-line">{todayTimeLabel}</p>
          </section>
          <section className="postit postit-events">
            <span className="postit-tape postit-tape-top-left" aria-hidden="true" />
            <span className="postit-tape postit-tape-top-right" aria-hidden="true" />
            <div className="postit-header">
              <h3>Upcoming Events</h3>
              <NavLink to="/calendar" className="postit-calendar-link">
                Calendar
              </NavLink>
            </div>
            {upcomingStickyEvents.length === 0 ? (
              <p className="postit-empty">No events in the next 15 days.</p>
            ) : (
              <ul className="postit-events-list">
                {upcomingStickyEvents.map((item) => {
                  const parsedEventDate = parseISO(String(item.event_date));
                  const eventDateLabel = isValid(parsedEventDate)
                    ? format(parsedEventDate, "EEE, MMM d")
                    : "Date TBD";
                  const parsedStartTime = item.start_time ? parseISO(String(item.start_time)) : null;
                  const eventTimeLabel = item.is_all_day
                    ? "All day"
                    : parsedStartTime && isValid(parsedStartTime)
                      ? format(parsedStartTime, "p")
                      : "Time TBD";
                  return (
                    <li key={item.id}>
                      <span>{eventDateLabel}</span>
                      <strong>{item.title || "Untitled event"}</strong>
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
