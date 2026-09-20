import { expect, test, vi } from "vitest";
import { fetchAttendance } from "./attendance/attendanceRepository";
import { fetchClassroom } from "./classroom/classroomRepository";

function createQuery(result) {
  const query = {
    select: vi.fn(() => query),
    order: vi.fn(() => query),
    then: (resolve, reject) => Promise.resolve(result).then(resolve, reject),
  };
  return query;
}

test("classroom repository preserves a partial query failure with safe row arrays", async () => {
  const classError = new Error("Classes query failed");
  const classesQuery = createQuery({ data: null, error: classError });
  const studentsQuery = createQuery({ data: [{ id: "student-1" }], error: null });
  const supabaseClient = {
    from: vi.fn((table) => (table === "classes" ? classesQuery : studentsQuery)),
  };

  const result = await fetchClassroom(supabaseClient);

  expect(result.rows.classRows).toEqual([]);
  expect(result.rows.studentRows).toEqual([{ id: "student-1" }]);
  expect(result.errors.classError).toBe(classError);
  expect(result.errors.studentError).toBeNull();
});

test("classroom repository retries the legacy student shape when a rollout column is absent", async () => {
  const missingColumn = { code: "42703", message: "academic_level_override does not exist" };
  const classesQuery = createQuery({ data: [], error: null });
  const currentStudentsQuery = createQuery({ data: null, error: missingColumn });
  const legacyStudentsQuery = createQuery({ data: [{ id: "student-1" }], error: null });
  let studentReadCount = 0;
  const supabaseClient = {
    from: vi.fn((table) => {
      if (table === "classes") return classesQuery;
      studentReadCount += 1;
      return studentReadCount === 1 ? currentStudentsQuery : legacyStudentsQuery;
    }),
  };

  const result = await fetchClassroom(supabaseClient);

  expect(studentReadCount).toBe(2);
  expect(result.rows.studentRows).toEqual([{ id: "student-1" }]);
  expect(result.errors.studentError).toBeNull();
  expect(legacyStudentsQuery.select.mock.calls[0][0]).not.toContain("academic_level_override");
});

test("attendance repository reports each failed read independently", async () => {
  const sessionError = new Error("Sessions unavailable");
  const entryError = new Error("Entries unavailable");
  const supabaseClient = {
    from: vi.fn((table) =>
      createQuery({
        data: null,
        error: table === "attendance_sessions" ? sessionError : entryError,
      })
    ),
  };

  const result = await fetchAttendance(supabaseClient);

  expect(result.rows).toEqual({ sessionRows: [], entryRows: [] });
  expect(result.errors).toEqual({ sessionError, entryError });
});
