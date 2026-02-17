import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import AuthForm from "./AuthForm";

const authMocks = vi.hoisted(() => ({
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  signInWithIdToken: vi.fn(),
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
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
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
