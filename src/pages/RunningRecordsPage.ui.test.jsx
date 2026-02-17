import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { expect, test, vi } from "vitest";
import RunningRecordsPage from "./RunningRecordsPage";

test("keeps create modal open on failed save and deletes selected record", async () => {
  const handleCreateRunningRecord = vi.fn().mockResolvedValue(false);
  const handleDeleteRunningRecord = vi.fn().mockResolvedValue(true);

  render(
    <RunningRecordsPage
      formError=""
      handleCreateRunningRecord={handleCreateRunningRecord}
      handleDeleteRunningRecord={handleDeleteRunningRecord}
      runningRecordForm={{
        studentId: "",
        recordDate: "",
        textTitle: "",
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
      ]}
      classes={[{ id: "class-1", name: "Class A", grade_level: "Year 5" }]}
      loading={false}
      runningRecords={[
        {
          id: "record-1",
          student_id: "student-1",
          record_date: "2026-02-17",
          text_title: "The River",
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

  fireEvent.click(screen.getByRole("button", { name: "+ New Record" }));
  const saveButton = screen.getByRole("button", { name: "Save" });
  fireEvent.submit(saveButton.closest("form"));

  await waitFor(() => expect(handleCreateRunningRecord).toHaveBeenCalledTimes(1));
  expect(screen.getByRole("heading", { name: "New Running Record" })).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: /Ana Silva/i }));
  fireEvent.click(screen.getByRole("button", { name: "Delete" }));

  await waitFor(() => expect(handleDeleteRunningRecord).toHaveBeenCalledWith("record-1"));
});
