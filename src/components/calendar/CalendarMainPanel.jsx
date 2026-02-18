import { format, isToday } from "date-fns";
import { parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../utils/dateLocale";

function CalendarMainPanel({
  classId,
  activeClassId,
  setActiveClassId,
  classOptions,
  activeClassLabel,
  monthTitle,
  navigatePeriod,
  viewMode,
  setViewMode,
  setAnchorDate,
  setSelectedDate,
  selectedDate,
  intervalDays,
  weekdayLabels,
  diaryForDay,
  eventsForDay,
  anchorDate,
  openDay,
  classes,
  subjects,
  units,
  upcomingEvents,
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });

  return (
    <>
      <section className="panel calendar-page">
        <div className="calendar-header-card">
          <div className="calendar-header">
            <button type="button" className="icon-button calendar-nav-btn" onClick={() => navigatePeriod(-1)}>
              ‹
            </button>
            <h2>{monthTitle}</h2>
            <button type="button" className="icon-button calendar-nav-btn" onClick={() => navigatePeriod(1)}>
              ›
            </button>
          </div>
          <div className="calendar-toolbar">
            <div className="calendar-mode">
              <button
                type="button"
                className={viewMode === "month" ? "active" : ""}
                onClick={() => setViewMode("month")}
              >
                {t("calendar.view.month")}
              </button>
              <button
                type="button"
                className={viewMode === "week" ? "active" : ""}
                onClick={() => setViewMode("week")}
              >
                {t("calendar.view.week")}
              </button>
            </div>
            <div className="calendar-filters">
              {!classId && (
                <select value={activeClassId} onChange={(event) => setActiveClassId(event.target.value)}>
                  <option value="">{t("calendar.allClasses")}</option>
                  {classOptions.map((option) => (
                    <option key={option.id} value={option.id}>
                      {option.label}
                    </option>
                  ))}
                </select>
              )}
              {classId && (
                <span className="badge">
                  {t("calendar.classLabel", { classLabel: activeClassLabel || t("calendar.selectedClass") })}
                </span>
              )}
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  setAnchorDate(new Date());
                  setSelectedDate(format(new Date(), "yyyy-MM-dd"));
                }}
              >
                {t("calendar.today")}
              </button>
            </div>
          </div>
        </div>

        <div className="calendar-weekdays" aria-hidden="true">
          {weekdayLabels.map((label) => (
            <span key={label}>{label}</span>
          ))}
        </div>

        <div className={`calendar-grid ${viewMode}`}>
          {intervalDays.map((dateObj) => {
            const cellLessons = diaryForDay(dateObj);
            const cellEvents = eventsForDay(dateObj);
            const dayLabel = format(dateObj, "d");
            const dayKey = format(dateObj, "yyyy-MM-dd");
            const inMonth = format(dateObj, "M") === format(anchorDate, "M");
            const previewLimit = viewMode === "week" ? 10 : 6;
            const previews = [...cellEvents.slice(0, 5), ...cellLessons.slice(0, 5)].slice(0, previewLimit);
            const remaining = cellEvents.length + cellLessons.length - previews.length;

            return (
              <button
                key={dayKey}
                type="button"
                className={`calendar-day ${selectedDate === dayKey ? "selected" : ""} ${inMonth ? "" : "outside"}`}
                onClick={() => {
                  openDay(dayKey);
                }}
              >
                <div className="calendar-day-top">
                  <span className="calendar-day-number">
                    {viewMode === "week" ? format(dateObj, "EEE d", { locale }) : dayLabel}
                  </span>
                  {isToday(dateObj) && <span className="calendar-dot" />}
                </div>
                <div className="calendar-day-list">
                  {previews.map((item) => {
                    const entryLabel =
                      units.find((unit) => unit.id === item.unit_id)?.name ||
                      subjects.find((subject) => subject.id === item.subject_id)?.name ||
                      classes.find((classItem) => classItem.id === item.class_id)?.name ||
                      t("calendar.diaryEntry");
                    const title = item.title || entryLabel;
                    return (
                      <span key={item.id} className={item.title ? "event" : "entry"} title={title}>
                        {title}
                      </span>
                    );
                  })}
                  {remaining > 0 && <span className="more">+{remaining}</span>}
                </div>
              </button>
            );
          })}
        </div>
      </section>

      <section className="panel calendar-upcoming">
        <h3>{t("calendar.upcomingAlerts")}</h3>
        {upcomingEvents.length === 0 ? (
          <p className="muted">{t("calendar.noUpcomingAlerts")}</p>
        ) : (
          <ul className="list calendar-upcoming-list">
            {upcomingEvents.map((item) => (
              <li key={item.id}>
                <strong>{item.title}</strong>
                <span className="calendar-upcoming-date">
                  {format(parseISO(item.event_date), "EEE, MMM d", { locale })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}

export default CalendarMainPanel;
