import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import TeacherWorkspaceApp from "./TeacherWorkspaceApp";

const { workspace } = vi.hoisted(() => ({
  workspace: {
    classes: [],
    students: [],
    attendanceSessions: [],
    activeClassId: "",
    setActiveClassId: vi.fn(),
    ensureDataForPath: vi.fn(),
    usefulLinks: [{
      id: "link-1",
      title: "Teaching resources",
      url: "https://resources.example.com",
      description: "Lesson ideas",
      sort_order: 0,
    }],
    handleCreateUsefulLink: vi.fn().mockResolvedValue(true),
    handleUpdateUsefulLink: vi.fn(),
    handleDeleteUsefulLink: vi.fn(),
    handleSwapUsefulLinkSortOrder: vi.fn(),
  },
}));

vi.mock("./hooks/useTeacherWorkspaceData", () => ({ default: () => workspace }));

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState({}, "", "/teacherassistant/useful-links");
});

afterEach(() => {
  cleanup();
  window.history.replaceState({}, "", "/");
});

test("restores the direct Useful Links route and connects saved links and create actions", async () => {
  render(<TeacherWorkspaceApp user={{ id: "teacher-1" }} onSignOut={vi.fn()} />);

  expect(await screen.findByRole("heading", { name: "Useful Links" })).toBeTruthy();
  expect(screen.getByRole("link", { name: "Open: Teaching resources" })).toBeTruthy();
  expect(workspace.ensureDataForPath).toHaveBeenCalledWith("/useful-links");
  const navigation = screen.getByRole("navigation");
  expect(within(navigation).getByRole("link", { name: "Useful Links" }).getAttribute("aria-current"))
    .toBe("page");

  fireEvent.change(screen.getByLabelText("Link title"), { target: { value: "School portal" } });
  fireEvent.change(screen.getByLabelText("Secure URL"), { target: { value: "https://school.example.com" } });
  fireEvent.click(screen.getByRole("button", { name: "Add Link" }));
  await waitFor(() => expect(workspace.handleCreateUsefulLink).toHaveBeenCalledWith({
    title: "School portal", url: "https://school.example.com", description: "",
  }));
});

test("opens Useful Links from the sidebar without an active class", async () => {
  window.history.replaceState({}, "", "/teacherassistant/");
  render(<TeacherWorkspaceApp user={{ id: "teacher-1" }} onSignOut={vi.fn()} />);

  const navigation = screen.getByRole("navigation");
  fireEvent.click(within(navigation).getByRole("link", { name: "Useful Links" }));

  expect(await screen.findByRole("heading", { name: "Useful Links" })).toBeTruthy();
  expect(window.location.pathname).toBe("/teacherassistant/useful-links");
});
