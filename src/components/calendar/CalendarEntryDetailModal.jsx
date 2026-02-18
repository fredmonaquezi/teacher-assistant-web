import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../utils/dateLocale";

function CalendarEntryDetailModal({
  activeDiaryEntry,
  selectedDate,
  classes,
  subjects,
  units,
  splitLines,
  onEdit,
  onClose,
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });
  if (!activeDiaryEntry) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-entry-detail-modal">
        <div className="calendar-day-header">
          <div>
            <h3>
              {units.find((item) => item.id === activeDiaryEntry.unit_id)?.name ||
                subjects.find((item) => item.id === activeDiaryEntry.subject_id)?.name ||
                t("calendar.classEntry")}
            </h3>
            <p className="muted">
              {classes.find((item) => item.id === activeDiaryEntry.class_id)?.name || t("calendar.allClasses")} •{" "}
              {format(parseISO(selectedDate), "PPPP", { locale })}
            </p>
          </div>
          <div className="calendar-detail-actions">
            <button type="button" className="secondary" onClick={onEdit}>
              {t("calendar.actions.edit")}
            </button>
            <button type="button" className="icon-button" onClick={onClose}>
              ×
            </button>
          </div>
        </div>

        <div className="calendar-lesson-sheet">
          <section className="calendar-sheet-block">
            <h4>{t("calendar.entryDetail.goals")}</h4>
            {splitLines(activeDiaryEntry.objectives).length > 0 ? (
              <ol>
                {splitLines(activeDiaryEntry.objectives)
                  .slice(0, 6)
                  .map((goal, idx) => (
                    <li key={`${goal}-${idx}`}>{goal}</li>
                  ))}
              </ol>
            ) : (
              <p className="muted">{t("calendar.entryDetail.noGoals")}</p>
            )}
          </section>

          <section className="calendar-sheet-grid">
            <article className="calendar-sheet-block">
              <h4>{t("calendar.entryDetail.materialsNeeded")}</h4>
              {activeDiaryEntry.materials ? (
                <p>{activeDiaryEntry.materials}</p>
              ) : (
                <p className="muted">{t("calendar.entryDetail.noMaterials")}</p>
              )}
            </article>
            <article className="calendar-sheet-block">
              <h4>{t("calendar.form.notes")}</h4>
              {activeDiaryEntry.notes ? (
                <p>{activeDiaryEntry.notes}</p>
              ) : (
                <p className="muted">{t("calendar.entryDetail.noHomeworkNotes")}</p>
              )}
            </article>
          </section>

          <section className="calendar-sheet-block">
            <h4>{t("calendar.entryDetail.classDevelopment")}</h4>
            {activeDiaryEntry.plan ? (
              <p>{activeDiaryEntry.plan}</p>
            ) : (
              <p className="muted">{t("calendar.entryDetail.noPlan")}</p>
            )}
          </section>

          <section className="calendar-sheet-block">
            <h4>{t("calendar.entryDetail.dayObservations")}</h4>
            {activeDiaryEntry.notes ? (
              <p>{activeDiaryEntry.notes}</p>
            ) : (
              <p className="muted">{t("calendar.entryDetail.noObservations")}</p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}

export default CalendarEntryDetailModal;
