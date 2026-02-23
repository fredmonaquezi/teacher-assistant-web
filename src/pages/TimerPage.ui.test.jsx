import { afterEach, beforeEach, expect, test, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import TimerPage from "./TimerPage";

beforeEach(() => {
  if (typeof window !== "undefined") {
    window.localStorage.clear();
  }
});

afterEach(() => {
  cleanup();
});

test("starts custom timer with parsed to-do checklist", () => {
  const startTimerSeconds = vi.fn();
  render(<TimerPage startTimerSeconds={startTimerSeconds} />);

  fireEvent.change(screen.getByPlaceholderText(/Open your book/i), {
    target: {
      value: "1) Open your book\n2 - Write a story\n- Share with your group",
    },
  });

  fireEvent.click(screen.getByRole("button", { name: /Start Custom Timer/i }));

  expect(startTimerSeconds).toHaveBeenCalledTimes(1);
  expect(startTimerSeconds).toHaveBeenCalledWith(300, {
    checklist: ["Open your book", "Write a story", "Share with your group"],
  });
});

test("keeps quick preset timers on the original API shape", () => {
  const startTimerSeconds = vi.fn();
  render(<TimerPage startTimerSeconds={startTimerSeconds} />);

  fireEvent.click(screen.getAllByRole("button", { name: /15 min/i })[0]);

  expect(startTimerSeconds).toHaveBeenCalledTimes(1);
  expect(startTimerSeconds).toHaveBeenCalledWith(900);
  expect(startTimerSeconds.mock.calls[0]).toHaveLength(1);
});
