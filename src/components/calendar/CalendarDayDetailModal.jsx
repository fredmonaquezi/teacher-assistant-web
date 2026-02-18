import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../utils/dateLocale";

function CalendarDayDetailModal({
  showDayDetail,
  selectedDate,
  setShowDayDetail,
  dayItems,
  dayEvents,
  classes,
  subjects,
  units,
  handleDeleteDiaryEntry,
  setActiveDiaryEntry,
  handleDeleteEvent,
  openNewEntryForm,
  openNewEventForm,
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });
  if (!showDayDetail) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-day-modal">
        <div className="calendar-day-header">
          <div>
            <h3>{format(parseISO(selectedDate), "EEE", { locale })}</h3>
            <p className="muted">{format(parseISO(selectedDate), "PPPP", { locale })}</p>
          </div>
          <button type="button" className="icon-button" onClick={() => setShowDayDetail(false)}>
            ×
          </button>
        </div>

        <div className="calendar-day-section">
          <div className="calendar-day-section-title">
            <h4>{t("calendar.dayDetail.classDiary")}</h4>
            <button type="button" onClick={openNewEntryForm}>
              {t("calendar.dayDetail.addEntry")}
            </button>
          </div>
          {dayItems.length === 0 ? (
            <p className="muted">{t("calendar.dayDetail.noDiaryEntries")}</p>
          ) : (
            <div className="calendar-diary-list">
              {dayItems.map((entry) => {
                const className = classes.find((item) => item.id === entry.class_id)?.name || t("calendar.allClasses");
                return (
                  <article key={entry.id} className="calendar-diary-item">
                    <div className="calendar-entry-top">
                      <button
                        type="button"
                        className="calendar-entry-summary-btn"
                        onClick={() => setActiveDiaryEntry(entry)}
                      >
                        <strong>
                          {units.find((item) => item.id === entry.unit_id)?.name ||
                            subjects.find((item) => item.id === entry.subject_id)?.name ||
                            t("calendar.classEntry")}
                        </strong>
                        <p className="muted">{className}</p>
                        <p className="calendar-entry-basic">
                          {format(parseISO(selectedDate), "EEE, MMM d", { locale })} •{" "}
                          {entry.start_time || entry.end_time
                            ? [
                                entry.start_time && format(parseISO(entry.start_time), "p", { locale }),
                                entry.end_time && format(parseISO(entry.end_time), "p", { locale }),
                              ]
                                .filter(Boolean)
                                .join(t("calendar.timeRangeSeparator"))
                            : t("calendar.dayDetail.timeNotSet")}
                        </p>
                      </button>
                      <button
                        type="button"
                        className="icon-button"
                        onClick={() => handleDeleteDiaryEntry(entry.id)}
                        aria-label={t("calendar.aria.deleteDiaryEntry")}
                      >
                        🗑
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        <div className="calendar-day-section">
          <div className="calendar-day-section-title">
            <h4>{t("calendar.dayDetail.eventsAndAlerts")}</h4>
            <button type="button" onClick={openNewEventForm}>
              {t("calendar.dayDetail.addEvent")}
            </button>
          </div>
          {dayEvents.length === 0 ? (
            <p className="muted">{t("calendar.dayDetail.noEvents")}</p>
          ) : (
            <div className="calendar-day-cards">
              {dayEvents.map((item) => (
                <article key={item.id} className="calendar-event-card">
                  <div className="calendar-entry-top">
                    <strong>{item.title}</strong>
                    <button type="button" className="icon-button" onClick={() => handleDeleteEvent(item.id)}>
                      🗑
                    </button>
                  </div>
                  <p className="muted">
                    {item.is_all_day
                      ? t("calendar.allDay")
                      : [
                          item.start_time && format(parseISO(item.start_time), "p", { locale }),
                          item.end_time && format(parseISO(item.end_time), "p", { locale }),
                        ]
                          .filter(Boolean)
                          .join(t("calendar.timeRangeSeparator"))}
                  </p>
                  {item.details && <p>{item.details}</p>}
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CalendarDayDetailModal;
