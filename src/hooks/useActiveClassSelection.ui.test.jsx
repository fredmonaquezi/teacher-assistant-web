import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, expect, test } from "vitest";
import useActiveClassSelection, { getActiveClassStorageKey } from "./useActiveClassSelection";

const CLASSES = [
  { id: "class-1", name: "Class 1" },
  { id: "class-2", name: "Class 2" },
];

afterEach(() => {
  window.localStorage.removeItem(getActiveClassStorageKey("teacher-1"));
  window.localStorage.removeItem(getActiveClassStorageKey("teacher-2"));
  window.localStorage.removeItem(getActiveClassStorageKey("teacher-3"));
});

test("restores a valid active class for the signed-in user", () => {
  window.localStorage.setItem(getActiveClassStorageKey("teacher-1"), "class-2");

  const { result } = renderHook(() => useActiveClassSelection("teacher-1", CLASSES));

  expect(result.current.activeClassId).toBe("class-2");
  expect(result.current.activeClass?.name).toBe("Class 2");
});

test("automatically selects the only available class", async () => {
  const { result } = renderHook(() =>
    useActiveClassSelection("teacher-2", [{ id: "class-1", name: "Class 1" }])
  );

  await waitFor(() => expect(result.current.activeClassId).toBe("class-1"));
  expect(window.localStorage.getItem(getActiveClassStorageKey("teacher-2"))).toBe("class-1");
});

test("clears a stored class that is no longer available", async () => {
  window.localStorage.setItem(getActiveClassStorageKey("teacher-3"), "deleted-class");

  const { result } = renderHook(() => useActiveClassSelection("teacher-3", CLASSES));

  await waitFor(() => expect(result.current.activeClassId).toBe(""));
  await waitFor(() =>
    expect(window.localStorage.getItem(getActiveClassStorageKey("teacher-3"))).toBeNull()
  );
});
