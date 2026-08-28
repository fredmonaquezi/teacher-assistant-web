import { useState } from "react";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import i18n from "../i18n";
import RunningRecordsPage from "./RunningRecordsPage";

vi.mock("react-day-picker", () => ({
  DayPicker: () => null,
}));

afterEach(() => {
  cleanup();
});

test("keeps create modal open on failed save and deletes selected record", async () => {
  const handleCreateRunningRecord = vi.fn().mockResolvedValue(false);
  const handleUpdateRunningRecord = vi.fn().mockResolvedValue(false);
  const handleDeleteRunningRecord = vi.fn().mockResolvedValue(true);

  render(
    <RunningRecordsPage
      formError=""
      handleCreateRunningRecord={handleCreateRunningRecord}
      handleUpdateRunningRecord={handleUpdateRunningRecord}
      handleDeleteRunningRecord={handleDeleteRunningRecord}
      runningRecordForm={{
        studentId: "",
        recordDate: "",
        textTitle: "",
        bookLevel: "",
        totalWords: "",
        errors: "",
        selfCorrections: "",
        notes: "",
      }}
      setRunningRecordForm={vi.fn()}
      students={[
        {
          id: "student-1",
          first_name: "Ana",
          last_name: "Silva",
          class_id: "class-1",
        },
        {
          id: "student-2",
          first_name: "Orphan",
          last_name: "Student",
          class_id: "deleted-class",
        },
      ]}
      classes={[{ id: "class-1", name: "Class A", grade_level: "Year 5" }]}
      loading={false}
      runningRecords={[
        {
          id: "record-1",
          student_id: "student-1",
          record_date: "2026-02-17",
          text_title: "The River",
          book_level: "M",
          level: "Instructional (90-94%)",
          accuracy_pct: 92,
          total_words: 100,
          errors: 8,
          self_corrections: 2,
          sc_ratio: 5,
          notes: "Good progress",
        },
      ]}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: i18n.t("runningRecords.newRecord") }));
  const saveButton = screen.getByRole("button", { name: i18n.t("common.actions.save") });
  fireEvent.submit(saveButton.closest("form"));

  await waitFor(() => expect(handleCreateRunningRecord).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("heading", { name: i18n.t("runningRecords.modal.newTitle") })).toBeTruthy();
  expect(screen.getByRole("combobox", { name: i18n.t("runningRecords.modal.bookLevel") })).toBeTruthy();
  expect(screen.queryByRole("option", { name: /Orphan Student/i })).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: /Ana Silva/i }));
  fireEvent.click(screen.getByRole("button", { name: i18n.t("common.actions.delete") }));
  const deleteDialog = await screen.findByRole("dialog", { name: i18n.t("common.actions.delete") });
  fireEvent.click(within(deleteDialog).getByRole("button", { name: i18n.t("common.actions.delete") }));

  await waitFor(() => expect(handleDeleteRunningRecord).toHaveBeenCalledWith("record-1"));
});

test("opens an existing running record in edit mode and submits the update", async () => {
  const handleCreateRunningRecord = vi.fn().mockResolvedValue(true);
  const handleUpdateRunningRecord = vi.fn().mockResolvedValue(false);
  const handleDeleteRunningRecord = vi.fn().mockResolvedValue(true);

  function TestWrapper() {
    const [runningRecordForm, setRunningRecordForm] = useState({
      studentId: "",
      recordDate: "",
      textTitle: "",
      bookLevel: "",
      totalWords: "",
      errors: "",
      selfCorrections: "",
      notes: "",
    });

    return (
      <RunningRecordsPage
        formError=""
        handleCreateRunningRecord={handleCreateRunningRecord}
        handleUpdateRunningRecord={handleUpdateRunningRecord}
        handleDeleteRunningRecord={handleDeleteRunningRecord}
        runningRecordForm={runningRecordForm}
        setRunningRecordForm={setRunningRecordForm}
        students={[
          {
            id: "student-1",
            first_name: "Ana",
            last_name: "Silva",
            class_id: "class-1",
          },
        ]}
        classes={[{ id: "class-1", name: "Class A", grade_level: "Year 5" }]}
        loading={false}
        runningRecords={[
          {
            id: "record-1",
            student_id: "student-1",
            record_date: "2026-02-17",
            text_title: "The River",
            book_level: "M",
            level: "Instructional (90-94%)",
            accuracy_pct: 92,
            total_words: 100,
            errors: 8,
            self_corrections: 2,
            sc_ratio: 5,
            notes: "Good progress",
          },
        ]}
      />
    );
  }

  render(<TestWrapper />);

  fireEvent.click(screen.getByRole("button", { name: /Ana Silva/i }));
  fireEvent.click(screen.getByRole("button", { name: i18n.t("common.actions.edit") }));

  expect(await screen.findByRole("heading", { name: i18n.t("runningRecords.modal.editTitle") })).toBeTruthy();
  expect(await screen.findByDisplayValue("The River")).toBeTruthy();
  await waitFor(() =>
    expect(screen.getByRole("combobox", { name: i18n.t("runningRecords.modal.bookLevel") }).value).toBe("M")
  );

  const updateButton = screen.getByRole("button", { name: i18n.t("common.actions.update") });
  fireEvent.submit(updateButton.closest("form"));

  await waitFor(() => expect(handleUpdateRunningRecord).toHaveBeenCalledTimes(1));
  expect(handleUpdateRunningRecord.mock.calls[0][0]).toBe("record-1");
  expect(screen.getByRole("heading", { name: i18n.t("runningRecords.modal.editTitle") })).toBeTruthy();
});
