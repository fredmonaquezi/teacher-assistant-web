import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import AuthForm from "./AuthForm";
import i18n from "../../i18n";

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithIdToken: vi.fn(),
  resetPasswordForEmail: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("../../config/env", () => ({
  loadAuthEnv: () => ({
    enableGoogleAuth: false,
    googleClientId: "",
  }),
}));

vi.mock("../../supabaseClient", () => ({
  supabase: {
    auth: {
      signInWithPassword: authMocks.signInWithPassword,
      signUp: authMocks.signUp,
      signInWithIdToken: authMocks.signInWithIdToken,
      resetPasswordForEmail: authMocks.resetPasswordForEmail,
      updateUser: authMocks.updateUser,
    },
  },
}));

beforeEach(async () => {
  vi.clearAllMocks();
  if (typeof window !== "undefined") {
    window.localStorage.setItem("teacher-assistant.language", "en");
  }
  await i18n.changeLanguage("en");
});

afterEach(() => {
  cleanup();
});

test("shows error when sign in fails", async () => {
  authMocks.signInWithPassword.mockResolvedValue({
    error: { message: "Invalid login credentials." },
  });
  const onSuccess = vi.fn();

  render(<AuthForm onSuccess={onSuccess} />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "teacher@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "secret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

  expect(await screen.findByText("Invalid login credentials.")).toBeTruthy();
  expect(onSuccess).not.toHaveBeenCalled();
});

test("shows error when sign up fails", async () => {
  authMocks.signUp.mockResolvedValue({
    error: { message: "Password should be at least 8 characters." },
  });

  render(<AuthForm onSuccess={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "New here? Create an account" }));
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "teacher@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Password"), {
    target: { value: "short" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Create account" }));

  await waitFor(() =>
    expect(screen.getByText("Password should be at least 8 characters.")).toBeTruthy()
  );
});

test("allows changing language on login screen", async () => {
  render(<AuthForm onSuccess={vi.fn()} />);

  fireEvent.click(screen.getByRole("button", { name: "PT-BR" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Entrar" })).toBeTruthy();
  });
  expect(screen.getByLabelText("E-mail")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "EN" }));

  await waitFor(() => {
    expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  });
  expect(screen.getByLabelText("Email")).toBeTruthy();
});

test("sends password reset email from forgot password flow", async () => {
  authMocks.resetPasswordForEmail.mockResolvedValue({ error: null });
  const onSuccess = vi.fn();

  render(<AuthForm onSuccess={onSuccess} />);

  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "teacher@example.com" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Forgot password?" }));
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));

  await waitFor(() =>
    expect(authMocks.resetPasswordForEmail).toHaveBeenCalledWith("teacher@example.com", {
      redirectTo: `${window.location.origin}/reset-password`,
    })
  );
  expect(onSuccess).toHaveBeenCalledWith("Check your email for a password reset link.");
});

test("updates password in forced recovery mode", async () => {
  authMocks.updateUser.mockResolvedValue({ error: null });
  const onSuccess = vi.fn();
  const onPasswordResetComplete = vi.fn();

  render(
    <AuthForm
      onSuccess={onSuccess}
      forcedMode="reset"
      onPasswordResetComplete={onPasswordResetComplete}
    />
  );

  fireEvent.change(screen.getByLabelText("New password"), {
    target: { value: "betterSecret123" },
  });
  fireEvent.change(screen.getByLabelText("Confirm new password"), {
    target: { value: "betterSecret123" },
  });
  fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

  await waitFor(() => expect(authMocks.updateUser).toHaveBeenCalledWith({ password: "betterSecret123" }));
  expect(onSuccess).toHaveBeenCalledWith("Password updated. Sign in with your new password.");
  expect(onPasswordResetComplete).toHaveBeenCalled();
});
