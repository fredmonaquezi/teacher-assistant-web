import { fireEvent, render, screen, within } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import CalendarDayDetailModal from "./CalendarDayDetailModal";
import i18n from "../../i18n";

test("opens add flows and deletes diary/event entries from day modal", () => {
  const setShowDayDetail = vi.fn();
  const handleDeleteDiaryEntry = vi.fn();
  const setActiveDiaryEntry = vi.fn();
  const handleDeleteEvent = vi.fn();
  const openNewEntryForm = vi.fn();
  const openNewEventForm = vi.fn();

  render(
    <CalendarDayDetailModal
      showDayDetail={true}
      selectedDate="2026-02-17"
      setShowDayDetail={setShowDayDetail}
      dayItems={[
        {
          id: "diary-1",
          class_id: "class-1",
          subject_id: null,
          unit_id: null,
          start_time: null,
          end_time: null,
        },
      ]}
      dayEvents={[
        {
          id: "event-1",
          title: "Exam Day",
          is_all_day: true,
          details: "Bring calculators",
          start_time: null,
          end_time: null,
        },
      ]}
      classes={[{ id: "class-1", name: "Class A" }]}
      subjects={[]}
      units={[]}
      handleDeleteDiaryEntry={handleDeleteDiaryEntry}
      setActiveDiaryEntry={setActiveDiaryEntry}
      handleDeleteEvent={handleDeleteEvent}
      openNewEntryForm={openNewEntryForm}
      openNewEventForm={openNewEventForm}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: i18n.t("calendar.dayDetail.addEntry") }));
  expect(openNewEntryForm).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: i18n.t("calendar.dayDetail.addEvent") }));
  expect(openNewEventForm).toHaveBeenCalledTimes(1);

  fireEvent.click(screen.getByRole("button", { name: i18n.t("calendar.aria.deleteDiaryEntry") }));
  expect(handleDeleteDiaryEntry).toHaveBeenCalledWith("diary-1");

  const eventCard = screen.getByText("Exam Day").closest("article");
  expect(eventCard).not.toBeNull();
  fireEvent.click(within(eventCard).getByRole("button"));
  expect(handleDeleteEvent).toHaveBeenCalledWith("event-1");
});
