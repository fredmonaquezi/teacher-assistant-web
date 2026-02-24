import {
  addMonths,
  addWeeks,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isValid,
  parseISO,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { getDateLocale } from "../../utils/dateLocale";

function createEmptyDiaryEntry() {
  return {
    classId: "",
    subjectId: "",
    unitId: "",
    startTime: "",
    endTime: "",
    plan: "",
    objectives: "",
    materials: "",
    notes: "",
  };
}

function createEmptyEvent() {
  return {
    classId: "",
    title: "",
    details: "",
    isAllDay: false,
    startTime: "",
    endTime: "",
  };
}

function useCalendarPageController({
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
}) {
  const { t, i18n } = useTranslation();
  const locale = getDateLocale(i18n.language, { capitalizePtBrMonths: true });
  const [searchParams] = useSearchParams();
  const classId = searchParams.get("classId") || "";
  const [activeClassId, setActiveClassId] = useState("");
  const effectiveClassId = classId || activeClassId;

  const [viewMode, setViewMode] = useState("month");
  const [anchorDate, setAnchorDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(format(new Date(), "yyyy-MM-dd"));

  const [showDayDetail, setShowDayDetail] = useState(false);
  const [activeDiaryEntry, setActiveDiaryEntry] = useState(null);
  const [showEditEntry, setShowEditEntry] = useState(false);
  const [editingEntryId, setEditingEntryId] = useState("");
  const [editEntryForm, setEditEntryForm] = useState(createEmptyDiaryEntry());

  const [showNewEntry, setShowNewEntry] = useState(false);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [newEntry, setNewEntry] = useState(createEmptyDiaryEntry());
  const [newEvent, setNewEvent] = useState(createEmptyEvent());
  const [deleteRequest, setDeleteRequest] = useState(null);

  const activeClassLabel = classOptions.find((option) => option.id === effectiveClassId)?.label || "";

  const filteredDiaryEntries = effectiveClassId
    ? calendarDiaryEntries.filter((entry) => entry.class_id === effectiveClassId)
    : calendarDiaryEntries;

  const filteredEvents = effectiveClassId
    ? calendarEvents.filter((item) => item.class_id === effectiveClassId)
    : calendarEvents;

  const subjectOptionsForEntryClass = subjects.filter(
    (subject) => subject.class_id === (newEntry.classId || effectiveClassId || null)
  );

  const unitOptionsForEntrySubject = units.filter((unit) => unit.subject_id === newEntry.subjectId);

  const subjectOptionsForEditClass = subjects.filter(
    (subject) =>
      subject.class_id === (editEntryForm.classId || activeDiaryEntry?.class_id || effectiveClassId || null)
  );

  const unitOptionsForEditSubject = units.filter((unit) => unit.subject_id === editEntryForm.subjectId);

  const monthTitle = viewMode === "month"
    ? format(anchorDate, "LLLL yyyy", { locale })
    : format(anchorDate, "PPP", { locale });

  const dayItems = filteredDiaryEntries
    .filter((item) => item.entry_date === selectedDate)
    .sort((a, b) => (a.start_time || "").localeCompare(b.start_time || ""));

  const dayEvents = filteredEvents
    .filter((item) => item.event_date === selectedDate)
    .sort((a, b) => {
      if (!!a.is_all_day !== !!b.is_all_day) return a.is_all_day ? -1 : 1;
      return (a.start_time || "").localeCompare(b.start_time || "");
    });

  const upcomingEvents = filteredEvents
    .filter((item) => item.event_date >= format(new Date(), "yyyy-MM-dd"))
    .sort((a, b) => a.event_date.localeCompare(b.event_date))
    .slice(0, 5);

  const intervalDays =
    viewMode === "month"
      ? eachDayOfInterval({
          start: startOfWeek(startOfMonth(anchorDate)),
          end: endOfWeek(endOfMonth(anchorDate)),
        })
      : eachDayOfInterval({
          start: startOfWeek(anchorDate),
          end: endOfWeek(anchorDate),
        });

  const weekdayLabels = eachDayOfInterval({
    start: startOfWeek(new Date()),
    end: endOfWeek(new Date()),
  }).map((day) => format(day, "EEE", { locale }));

  const diaryForDay = (dateObj) =>
    filteredDiaryEntries.filter((item) => item.entry_date === format(dateObj, "yyyy-MM-dd"));

  const eventsForDay = (dateObj) =>
    filteredEvents.filter((item) => item.event_date === format(dateObj, "yyyy-MM-dd"));

  const mergeDateTime = (dateString, timeString) =>
    timeString ? `${dateString}T${timeString}:00` : null;

  const splitLines = (value) =>
    String(value || "")
      .split(/\n|;|,/)
      .map((item) => item.trim())
      .filter(Boolean);

  const navigatePeriod = (delta) => {
    setAnchorDate((prev) => (viewMode === "month" ? addMonths(prev, delta) : addWeeks(prev, delta)));
  };

  const openDay = (dayKey) => {
    setSelectedDate(dayKey);
    setShowDayDetail(true);
  };

  const openNewEntryForm = () => {
    const calendarSetupMessage = t("calendar.setupMessage");
    if (!calendarTablesReady) {
      setFormError(calendarSetupMessage);
      return;
    }
    setShowNewEntry(true);
  };

  const openNewEventForm = () => {
    const calendarSetupMessage = t("calendar.setupMessage");
    if (!calendarTablesReady) {
      setFormError(calendarSetupMessage);
      return;
    }
    setShowNewEvent(true);
  };

  const handleCreateDiaryEntry = async (event) => {
    event.preventDefault();
    setFormError("");
    const calendarSetupMessage = t("calendar.setupMessage");

    if (!calendarTablesReady) {
      setFormError(calendarSetupMessage);
      return;
    }

    const payload = {
      entry_date: selectedDate,
      class_id: newEntry.classId || effectiveClassId || null,
      subject_id: newEntry.subjectId || null,
      unit_id: newEntry.unitId || null,
      start_time: mergeDateTime(selectedDate, newEntry.startTime),
      end_time: mergeDateTime(selectedDate, newEntry.endTime),
      plan: newEntry.plan.trim() || null,
      objectives: newEntry.objectives.trim() || null,
      materials: newEntry.materials.trim() || null,
      notes: newEntry.notes.trim() || null,
    };

    if (!payload.class_id) {
      setFormError(t("calendar.validation.selectClassForEntry"));
      return;
    }

    const created = await handleCreateCalendarDiaryEntry(payload);
    if (!created) return;

    setNewEntry(createEmptyDiaryEntry());
    setShowNewEntry(false);
  };

  const handleDeleteDiaryEntry = async (entryId) => {
    if (!entryId) return;
    setDeleteRequest({ kind: "diary", id: entryId });
  };

  const openEditDiaryEntry = (entry) => {
    if (!entry) return;

    setEditingEntryId(entry.id);
    setEditEntryForm({
      classId: entry.class_id || "",
      subjectId: entry.subject_id || "",
      unitId: entry.unit_id || "",
      startTime: entry.start_time ? format(parseISO(entry.start_time), "HH:mm") : "",
      endTime: entry.end_time ? format(parseISO(entry.end_time), "HH:mm") : "",
      plan: entry.plan || "",
      objectives: entry.objectives || "",
      materials: entry.materials || "",
      notes: entry.notes || "",
    });
    setShowEditEntry(true);
  };

  const closeActiveDiaryEntry = () => {
    setActiveDiaryEntry(null);
    setShowEditEntry(false);
    setEditingEntryId("");
  };

  const closeEditEntry = () => {
    setShowEditEntry(false);
    setEditingEntryId("");
  };

  const handleUpdateDiaryEntry = async (event) => {
    event.preventDefault();
    setFormError("");
    const calendarSetupMessage = t("calendar.setupMessage");

    if (!calendarTablesReady) {
      setFormError(calendarSetupMessage);
      return;
    }
    if (!editingEntryId) return;

    const entryDate = activeDiaryEntry?.entry_date || selectedDate;
    const payload = {
      class_id: editEntryForm.classId || effectiveClassId || null,
      subject_id: editEntryForm.subjectId || null,
      unit_id: editEntryForm.unitId || null,
      start_time: mergeDateTime(entryDate, editEntryForm.startTime),
      end_time: mergeDateTime(entryDate, editEntryForm.endTime),
      plan: editEntryForm.plan.trim() || null,
      objectives: editEntryForm.objectives.trim() || null,
      materials: editEntryForm.materials.trim() || null,
      notes: editEntryForm.notes.trim() || null,
    };

    if (!payload.class_id) {
      setFormError(t("calendar.validation.selectClassForEntry"));
      return;
    }

    const updated = await handleUpdateCalendarDiaryEntry(editingEntryId, payload);
    if (!updated) return;

    setShowEditEntry(false);
    setEditingEntryId("");
    setActiveDiaryEntry(null);
  };

  const handleCreateEvent = async (event) => {
    event.preventDefault();
    setFormError("");
    const calendarSetupMessage = t("calendar.setupMessage");

    if (!calendarTablesReady) {
      setFormError(calendarSetupMessage);
      return;
    }

    const payload = {
      event_date: selectedDate,
      class_id: newEvent.classId || effectiveClassId || null,
      title: newEvent.title.trim(),
      details: newEvent.details.trim() || null,
      is_all_day: !!newEvent.isAllDay,
      start_time: newEvent.isAllDay ? null : mergeDateTime(selectedDate, newEvent.startTime),
      end_time: newEvent.isAllDay ? null : mergeDateTime(selectedDate, newEvent.endTime),
    };

    if (!payload.title) {
      setFormError(t("calendar.validation.eventTitleRequired"));
      return;
    }

    const created = await handleCreateCalendarEvent(payload);
    if (!created) return;

    setNewEvent(createEmptyEvent());
    setShowNewEvent(false);
  };

  const handleDeleteEvent = async (eventId) => {
    if (!eventId) return;
    setDeleteRequest({ kind: "event", id: eventId });
  };

  const closeDeleteRequest = () => {
    setDeleteRequest(null);
  };

  const confirmDeleteRequest = async () => {
    if (!deleteRequest?.id) return;
    if (deleteRequest.kind === "diary") {
      await handleDeleteCalendarDiaryEntry(deleteRequest.id);
    } else if (deleteRequest.kind === "event") {
      await handleDeleteCalendarEvent(deleteRequest.id);
    }
    setDeleteRequest(null);
  };

  const calendarSetupMessage = t("calendar.setupMessage");
  const formatDateLabel = (dateValue, formatToken) => {
    if (!dateValue) return "";
    const parsedDate = typeof dateValue === "string" ? parseISO(dateValue) : dateValue;
    if (!isValid(parsedDate)) return "";
    return format(parsedDate, formatToken, { locale });
  };

  return {
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
    editingEntryId,
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
    formatDateLabel,
    locale,
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
    classes,
    subjects,
    units,
    classOptions,
    calendarTablesReady,
  };
}

export default useCalendarPageController;
