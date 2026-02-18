import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../utils/dateLocale";

function CalendarEventModal({
  show,
  selectedDate,
  onSubmit,
  onCancel,
  formState,
  setFormState,
  effectiveClassId,
  classOptions,
  calendarTablesReady,
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-event-modal">
        <div className="calendar-entry-modal-header">
          <h3>{t("calendar.modals.newEventTitle")}</h3>
          <p className="calendar-entry-date-chip">{format(parseISO(selectedDate), "PPPP", { locale })}</p>
        </div>
        <form onSubmit={onSubmit} className="calendar-event-form">
          <label className="stack">
            <span>{t("calendar.form.class")}</span>
            <select
              value={formState.classId || effectiveClassId}
              onChange={(event) => setFormState((prev) => ({ ...prev, classId: event.target.value }))}
            >
              <option value="">{t("calendar.allClasses")}</option>
              {classOptions.map((option) => (
                <option key={option.id} value={option.id}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>{t("calendar.form.title")}</span>
            <input
              value={formState.title}
              onChange={(event) => setFormState((prev) => ({ ...prev, title: event.target.value }))}
              placeholder={t("calendar.form.eventTitlePlaceholder")}
              required
            />
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={formState.isAllDay}
              onChange={(event) => setFormState((prev) => ({ ...prev, isAllDay: event.target.checked }))}
            />
            {t("calendar.allDay")}
          </label>
          {!formState.isAllDay && (
            <div className="calendar-time-grid calendar-event-time-grid">
              <label className="stack">
                <span>{t("calendar.form.startTime")}</span>
                <input
                  type="time"
                  value={formState.startTime}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, startTime: event.target.value }))
                  }
                />
              </label>
              <label className="stack">
                <span>{t("calendar.form.endTime")}</span>
                <input
                  type="time"
                  value={formState.endTime}
                  onChange={(event) =>
                    setFormState((prev) => ({ ...prev, endTime: event.target.value }))
                  }
                />
              </label>
            </div>
          )}
          <label className="stack calendar-entry-field-full">
            <span>{t("calendar.form.details")}</span>
            <textarea
              rows="3"
              value={formState.details}
              onChange={(event) => setFormState((prev) => ({ ...prev, details: event.target.value }))}
              placeholder={t("calendar.form.detailsPlaceholder")}
            />
          </label>
          <div className="modal-actions calendar-entry-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              {t("common.actions.cancel")}
            </button>
            <button type="submit" disabled={!calendarTablesReady}>
              {t("calendar.actions.saveEvent")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarEventModal;
