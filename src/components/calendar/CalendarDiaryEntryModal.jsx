import { format, parseISO } from "date-fns";
import { useTranslation } from "react-i18next";
import { getDateLocale } from "../../utils/dateLocale";

function CalendarDiaryEntryModal({
  show,
  title,
  selectedDate,
  onSubmit,
  onCancel,
  formState,
  setFormState,
  effectiveClassId,
  classOptions,
  subjectOptions,
  unitOptions,
  submitLabel,
  calendarTablesReady,
  resetSubjectOnClassChange,
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });
  if (!show) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card calendar-entry-modal">
        <div className="calendar-entry-modal-header">
          <h3>{title}</h3>
          <p className="calendar-entry-date-chip">{format(parseISO(selectedDate), "PPPP", { locale })}</p>
        </div>
        <form onSubmit={onSubmit} className="calendar-entry-form">
          <label className="stack">
            <span>{t("calendar.form.class")}</span>
            <select
              value={formState.classId || effectiveClassId}
              onChange={(event) =>
                setFormState((prev) => ({
                  ...prev,
                  classId: event.target.value,
                  ...(resetSubjectOnClassChange ? { subjectId: "", unitId: "" } : {}),
                }))
              }
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
            <span>{t("calendar.form.subject")}</span>
            <select
              value={formState.subjectId}
              onChange={(event) =>
                setFormState((prev) => ({ ...prev, subjectId: event.target.value, unitId: "" }))
              }
            >
              <option value="">{t("calendar.none")}</option>
              {subjectOptions.map((subject) => (
                <option key={subject.id} value={subject.id}>
                  {subject.name}
                </option>
              ))}
            </select>
          </label>
          <label className="stack">
            <span>{t("calendar.form.unit")}</span>
            <select
              value={formState.unitId}
              onChange={(event) => setFormState((prev) => ({ ...prev, unitId: event.target.value }))}
            >
              <option value="">{t("calendar.none")}</option>
              {unitOptions.map((unit) => (
                <option key={unit.id} value={unit.id}>
                  {unit.name}
                </option>
              ))}
            </select>
          </label>
          <div className="calendar-time-grid">
            <label className="stack">
              <span>{t("calendar.form.startTime")}</span>
              <input
                type="time"
                value={formState.startTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, startTime: event.target.value }))}
              />
            </label>
            <label className="stack">
              <span>{t("calendar.form.endTime")}</span>
              <input
                type="time"
                value={formState.endTime}
                onChange={(event) => setFormState((prev) => ({ ...prev, endTime: event.target.value }))}
              />
            </label>
          </div>
          <label className="stack">
            <span>{t("calendar.form.plan")}</span>
            <input
              value={formState.plan}
              onChange={(event) => setFormState((prev) => ({ ...prev, plan: event.target.value }))}
              placeholder={t("calendar.form.planPlaceholder")}
            />
          </label>
          <label className="stack">
            <span>{t("calendar.form.objectives")}</span>
            <textarea
              rows="2"
              value={formState.objectives}
              onChange={(event) => setFormState((prev) => ({ ...prev, objectives: event.target.value }))}
              placeholder={t("calendar.form.objectivesPlaceholder")}
            />
          </label>
          <label className="stack calendar-entry-field-full">
            <span>{t("calendar.form.materials")}</span>
            <textarea
              rows="2"
              value={formState.materials}
              onChange={(event) => setFormState((prev) => ({ ...prev, materials: event.target.value }))}
              placeholder={t("calendar.form.materialsPlaceholder")}
            />
          </label>
          <label className="stack calendar-entry-field-full">
            <span>{t("calendar.form.notes")}</span>
            <textarea
              rows="2"
              value={formState.notes}
              onChange={(event) => setFormState((prev) => ({ ...prev, notes: event.target.value }))}
              placeholder={t("calendar.form.notesPlaceholder")}
            />
          </label>
          <div className="modal-actions calendar-entry-actions">
            <button type="button" className="secondary" onClick={onCancel}>
              {t("common.actions.cancel")}
            </button>
            <button type="submit" disabled={!calendarTablesReady}>
              {submitLabel}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CalendarDiaryEntryModal;
