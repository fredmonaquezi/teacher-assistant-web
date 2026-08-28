import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import App from "./App";

const authMocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  onAuthStateChange: vi.fn(),
  signOut: vi.fn(),
}));

vi.mock("./supabaseClient", () => ({
  supabase: {
    auth: authMocks,
  },
}));

beforeEach(() => {
  authMocks.getSession.mockResolvedValue({ data: { session: null } });
  authMocks.onAuthStateChange.mockReturnValue({
    data: { subscription: { unsubscribe: vi.fn() } },
  });
  authMocks.signOut.mockResolvedValue({ error: null });
  window.history.replaceState({}, "", "/");
});

afterEach(() => {
  cleanup();
});

test("shows the public product chooser at the domain root", async () => {
  render(<App />);

  expect(
    screen.getByRole("heading", { name: "A calmer way to run your classroom." })
  ).toBeTruthy();
  expect(screen.getByRole("link", { name: /Sign in to continue/ }).getAttribute("href"))
    .toBe("/teacherassistant/");
  expect(screen.getByRole("link", { name: /Explore the games/ }).getAttribute("href"))
    .toBe("/toolbox/");
  await waitFor(() => expect(authMocks.getSession).toHaveBeenCalled());
});

test("shows authentication inside the teacher assistant path", async () => {
  window.history.replaceState({}, "", "/teacherassistant/");

  render(<App />);

  expect(await screen.findByRole("heading", { name: "Class Notes" })).toBeTruthy();
  expect(screen.getByRole("button", { name: "Sign in" })).toBeTruthy();
  expect(screen.getByRole("link", { name: /Teacher Codex/ }).getAttribute("href")).toBe("/");
});

test("shows the connected account with profile and sign-out actions on the landing page", async () => {
  authMocks.getSession.mockResolvedValue({
    data: {
      session: {
        user: {
          email: "ana@example.com",
          user_metadata: { full_name: "Ana Martins" },
        },
      },
    },
  });

  render(<App />);

  const profileLink = await screen.findByRole("link", {
    name: "Open the profile for ana@example.com",
  });
  expect(profileLink.getAttribute("href")).toBe("/teacherassistant/profile");
  expect(screen.getByText("Ana Martins")).toBeTruthy();
  expect(screen.getByText("ana@example.com")).toBeTruthy();

  fireEvent.click(screen.getByRole("button", { name: "Sign out" }));
  await waitFor(() => expect(authMocks.signOut).toHaveBeenCalledTimes(1));
});
