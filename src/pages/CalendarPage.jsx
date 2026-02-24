import CalendarDayDetailModal from "../components/calendar/CalendarDayDetailModal";
import CalendarDiaryEntryModal from "../components/calendar/CalendarDiaryEntryModal";
import CalendarEntryDetailModal from "../components/calendar/CalendarEntryDetailModal";
import CalendarEventModal from "../components/calendar/CalendarEventModal";
import CalendarMainPanel from "../components/calendar/CalendarMainPanel";
import ConfirmDialog from "../components/common/ConfirmDialog";
import { useTranslation } from "react-i18next";
import useCalendarPageController from "../hooks/calendar/useCalendarPageController";

const CalendarPage = ({
  formError,
  setFormError,
  classOptions,
  calendarDiaryEntries,
  calendarEvents,
  calendarTablesReady,
  classes,
  subjects,
  units,
  handleCreateCalendarDiaryEntry,
  handleUpdateCalendarDiaryEntry,
  handleDeleteCalendarDiaryEntry,
  handleCreateCalendarEvent,
  handleDeleteCalendarEvent,
}) => {
  const { t } = useTranslation();
  const {
    classId,
    activeClassId,
    setActiveClassId,
    effectiveClassId,
    viewMode,
    setViewMode,
    anchorDate,
    setAnchorDate,
    selectedDate,
    setSelectedDate,
    showDayDetail,
    setShowDayDetail,
    activeDiaryEntry,
    setActiveDiaryEntry,
    showEditEntry,
    editEntryForm,
    setEditEntryForm,
    showNewEntry,
    setShowNewEntry,
    showNewEvent,
    setShowNewEvent,
    newEntry,
    setNewEntry,
    newEvent,
    setNewEvent,
    activeClassLabel,
    subjectOptionsForEntryClass,
    unitOptionsForEntrySubject,
    subjectOptionsForEditClass,
    unitOptionsForEditSubject,
    monthTitle,
    dayItems,
    dayEvents,
    upcomingEvents,
    intervalDays,
    weekdayLabels,
    diaryForDay,
    eventsForDay,
    splitLines,
    calendarSetupMessage,
    navigatePeriod,
    openDay,
    openNewEntryForm,
    openNewEventForm,
    handleCreateDiaryEntry,
    handleDeleteDiaryEntry,
    openEditDiaryEntry,
    closeActiveDiaryEntry,
    closeEditEntry,
    handleUpdateDiaryEntry,
    handleCreateEvent,
    handleDeleteEvent,
    deleteRequest,
    closeDeleteRequest,
    confirmDeleteRequest,
  } = useCalendarPageController({
    setFormError,
    classOptions,
    calendarDiaryEntries,
    calendarEvents,
    calendarTablesReady,
    classes,
    subjects,
    units,
    handleCreateCalendarDiaryEntry,
    handleUpdateCalendarDiaryEntry,
    handleDeleteCalendarDiaryEntry,
    handleCreateCalendarEvent,
    handleDeleteCalendarEvent,
  });

  return (
    <>
      {formError && <div className="error">{formError}</div>}
      {!calendarTablesReady && <div className="error">{calendarSetupMessage}</div>}

      <CalendarMainPanel
        classId={classId}
        activeClassId={activeClassId}
        setActiveClassId={setActiveClassId}
        classOptions={classOptions}
        activeClassLabel={activeClassLabel}
        monthTitle={monthTitle}
        navigatePeriod={navigatePeriod}
        viewMode={viewMode}
        setViewMode={setViewMode}
        setAnchorDate={setAnchorDate}
        setSelectedDate={setSelectedDate}
        selectedDate={selectedDate}
        intervalDays={intervalDays}
        weekdayLabels={weekdayLabels}
        diaryForDay={diaryForDay}
        eventsForDay={eventsForDay}
        anchorDate={anchorDate}
        openDay={openDay}
        classes={classes}
        subjects={subjects}
        units={units}
        upcomingEvents={upcomingEvents}
      />

      <CalendarDayDetailModal
        showDayDetail={showDayDetail}
        selectedDate={selectedDate}
        setShowDayDetail={setShowDayDetail}
        dayItems={dayItems}
        dayEvents={dayEvents}
        classes={classes}
        subjects={subjects}
        units={units}
        handleDeleteDiaryEntry={handleDeleteDiaryEntry}
        setActiveDiaryEntry={setActiveDiaryEntry}
        handleDeleteEvent={handleDeleteEvent}
        openNewEntryForm={openNewEntryForm}
        openNewEventForm={openNewEventForm}
      />

      <CalendarDiaryEntryModal
        show={showNewEntry}
        title={t("calendar.modals.newDiaryEntryTitle")}
        selectedDate={selectedDate}
        onSubmit={handleCreateDiaryEntry}
        onCancel={() => setShowNewEntry(false)}
        formState={newEntry}
        setFormState={setNewEntry}
        effectiveClassId={effectiveClassId}
        classOptions={classOptions}
        subjectOptions={subjectOptionsForEntryClass}
        unitOptions={unitOptionsForEntrySubject}
        submitLabel={t("calendar.actions.save")}
        calendarTablesReady={calendarTablesReady}
        resetSubjectOnClassChange={false}
      />

      <CalendarEventModal
        show={showNewEvent}
        selectedDate={selectedDate}
        onSubmit={handleCreateEvent}
        onCancel={() => setShowNewEvent(false)}
        formState={newEvent}
        setFormState={setNewEvent}
        effectiveClassId={effectiveClassId}
        classOptions={classOptions}
        calendarTablesReady={calendarTablesReady}
      />

      <CalendarEntryDetailModal
        activeDiaryEntry={activeDiaryEntry}
        selectedDate={selectedDate}
        classes={classes}
        subjects={subjects}
        units={units}
        splitLines={splitLines}
        onEdit={() => openEditDiaryEntry(activeDiaryEntry)}
        onClose={closeActiveDiaryEntry}
      />

      <CalendarDiaryEntryModal
        show={showEditEntry}
        title={t("calendar.modals.editDiaryEntryTitle")}
        selectedDate={activeDiaryEntry?.entry_date || selectedDate}
        onSubmit={handleUpdateDiaryEntry}
        onCancel={closeEditEntry}
        formState={editEntryForm}
        setFormState={setEditEntryForm}
        effectiveClassId={effectiveClassId}
        classOptions={classOptions}
        subjectOptions={subjectOptionsForEditClass}
        unitOptions={unitOptionsForEditSubject}
        submitLabel={t("calendar.actions.saveChanges")}
        calendarTablesReady={calendarTablesReady}
        resetSubjectOnClassChange={true}
      />

      <ConfirmDialog
        open={Boolean(deleteRequest)}
        title={t("common.actions.delete")}
        description={
          deleteRequest?.kind === "diary"
            ? t("calendar.confirm.deleteDiaryEntry")
            : t("calendar.confirm.deleteEvent")
        }
        onCancel={closeDeleteRequest}
        onConfirm={confirmDeleteRequest}
      />
    </>
  );
};

export default CalendarPage;
