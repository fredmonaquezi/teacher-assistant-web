import { expect, test, vi } from "vitest";
import {
  applyOptimisticState,
  runMutation,
  runOptimisticMutation,
} from "./mutationHelpers";

test("reports repository failures without refreshing stale query data", async () => {
  const setFormError = vi.fn();
  const refresh = vi.fn();
  const onError = vi.fn();
  const error = new Error("Permission denied");

  const succeeded = await runMutation({
    setFormError,
    execute: vi.fn().mockResolvedValue({ error }),
    refresh,
    onError,
  });

  expect(succeeded).toBe(false);
  expect(setFormError).toHaveBeenNthCalledWith(1, "");
  expect(setFormError).toHaveBeenLastCalledWith("Permission denied");
  expect(onError).toHaveBeenCalledExactlyOnceWith(error);
  expect(refresh).not.toHaveBeenCalled();
});

test("uses the fallback message when a mutation throws a non-Error value", async () => {
  const setFormError = vi.fn();

  const succeeded = await runMutation({
    setFormError,
    execute: vi.fn().mockRejectedValue(null),
    fallbackErrorMessage: "Could not save the record.",
  });

  expect(succeeded).toBe(false);
  expect(setFormError).toHaveBeenLastCalledWith("Could not save the record.");
});

test("treats a refresh failure as a failed mutation", async () => {
  const setFormError = vi.fn();
  const onError = vi.fn();
  const refreshError = new Error("Updated data could not be loaded");

  const succeeded = await runMutation({
    setFormError,
    execute: vi.fn().mockResolvedValue({ error: null }),
    refresh: vi.fn().mockRejectedValue(refreshError),
    onError,
  });

  expect(succeeded).toBe(false);
  expect(onError).toHaveBeenCalledExactlyOnceWith(refreshError);
  expect(setFormError).toHaveBeenLastCalledWith(refreshError.message);
});

test("rolls optimistic state back when persistence fails", async () => {
  let state = [{ id: "entry-1", status: "Present" }];
  const setState = (nextState) => {
    state = typeof nextState === "function" ? nextState(state) : nextState;
  };

  const succeeded = await runOptimisticMutation({
    setFormError: vi.fn(),
    applyOptimistic: () =>
      applyOptimisticState(setState, (current) =>
        current.map((entry) => ({ ...entry, status: "Absent" }))
      ),
    execute: vi.fn().mockResolvedValue({ error: new Error("Write failed") }),
  });

  expect(succeeded).toBe(false);
  expect(state).toEqual([{ id: "entry-1", status: "Present" }]);
});

test("keeps optimistic state after persistence and refresh succeed", async () => {
  let state = [{ id: "entry-1", status: "Present" }];
  const setState = (nextState) => {
    state = typeof nextState === "function" ? nextState(state) : nextState;
  };

  const succeeded = await runOptimisticMutation({
    setFormError: vi.fn(),
    applyOptimistic: () =>
      applyOptimisticState(setState, (current) =>
        current.map((entry) => ({ ...entry, status: "Late" }))
      ),
    execute: vi.fn().mockResolvedValue({ error: null }),
    refresh: vi.fn().mockResolvedValue(true),
  });

  expect(succeeded).toBe(true);
  expect(state).toEqual([{ id: "entry-1", status: "Late" }]);
});
