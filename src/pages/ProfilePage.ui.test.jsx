import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, expect, test, vi } from "vitest";
import ProfilePage from "./ProfilePage";

afterEach(cleanup);

test("toggles the optional English Meter preference", async () => {
  const user = userEvent.setup();
  const onPreferencesChange = vi.fn();

  render(
    <ProfilePage
      user={{ email: "teacher@example.com", user_metadata: {} }}
      preferences={{ dateFormat: "MDY", timeFormat: "12h", englishMeterEnabled: false }}
      onPreferencesChange={onPreferencesChange}
    />
  );

  const toggle = screen.getByRole("switch", { name: "Show the English Meter" });
  expect(toggle.getAttribute("aria-checked")).toBe("false");
  await user.click(toggle);

  const preferenceUpdater = onPreferencesChange.mock.calls[0][0];
  expect(preferenceUpdater({ englishMeterEnabled: false }).englishMeterEnabled).toBe(true);
});
