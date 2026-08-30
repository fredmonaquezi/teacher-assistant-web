import { act, cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import AuthForm from "./AuthForm";
import i18n from "../../i18n";

const googleAuthMocks = vi.hoisted(() => ({
  initialize: vi.fn(),
  renderButton: vi.fn(),
  cancel: vi.fn(),
  signInWithIdToken: vi.fn(),
}));

vi.mock("../../config/env", () => ({
  loadAuthEnv: () => ({ enableGoogleAuth: true, googleClientId: "test-client-id" }),
}));

vi.mock("../../supabaseClient", () => ({
  supabase: { auth: { signInWithIdToken: googleAuthMocks.signInWithIdToken } },
}));

beforeEach(async () => {
  vi.clearAllMocks();
  vi.stubGlobal("google", { accounts: { id: googleAuthMocks } });
  vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue({ width: 216 });
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

test("uses the official rectangular button without exceeding a narrow panel", async () => {
  render(<AuthForm onSuccess={vi.fn()} />);

  await waitFor(() => expect(googleAuthMocks.renderButton).toHaveBeenCalled());
  const [container, options] = googleAuthMocks.renderButton.mock.calls.at(-1);
  expect(container.className).toBe("auth-google-button");
  expect(options).toMatchObject({
    theme: "outline", shape: "rectangular", size: "large", width: 216, text: "signin_with",
  });

  fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
  await waitFor(() => {
    expect(googleAuthMocks.renderButton.mock.calls.at(-1)[1]).toMatchObject({
      shape: "rectangular", text: "signup_with",
    });
  });
});

test("preserves the Google ID-token sign-in flow", async () => {
  googleAuthMocks.signInWithIdToken.mockResolvedValue({ error: null });
  render(<AuthForm onSuccess={vi.fn()} />);

  await waitFor(() => expect(googleAuthMocks.initialize).toHaveBeenCalled());
  const config = googleAuthMocks.initialize.mock.calls.at(-1)[0];
  expect(config.ux_mode).toBe("popup");
  await act(async () => config.callback({ credential: "test-credential" }));
  expect(googleAuthMocks.signInWithIdToken).toHaveBeenCalledWith({
    provider: "google", token: "test-credential",
  });
});
