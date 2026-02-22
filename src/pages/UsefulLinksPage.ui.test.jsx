import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import i18n from "../i18n";
import UsefulLinksPage from "./UsefulLinksPage";

const BASE_LINKS = [
  {
    id: "link-1",
    title: "District Portal",
    url: "https://district.example.com",
    description: "Attendance and reports",
    sort_order: 0,
    created_at: "2026-02-20T08:00:00.000Z",
  },
  {
    id: "link-2",
    title: "Curriculum Hub",
    url: "https://curriculum.example.com",
    description: "Lesson resources",
    sort_order: 1,
    created_at: "2026-02-20T09:00:00.000Z",
  },
];

function setViewport(isMobile) {
  Object.defineProperty(window, "matchMedia", {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: isMobile && query.includes("max-width: 720px"),
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}

afterEach(() => {
  vi.restoreAllMocks();
  cleanup();
});

beforeEach(() => {
  setViewport(false);
});

test("creates a useful link from the add form", async () => {
  const handleCreateUsefulLink = vi.fn().mockResolvedValue(true);

  render(
    <UsefulLinksPage
      formError=""
      usefulLinks={[]}
      handleCreateUsefulLink={handleCreateUsefulLink}
      handleUpdateUsefulLink={vi.fn()}
      handleDeleteUsefulLink={vi.fn()}
      handleSwapUsefulLinkSortOrder={vi.fn()}
    />
  );

  fireEvent.change(screen.getByLabelText(i18n.t("usefulLinks.form.titleLabel")), {
    target: { value: "School Email" },
  });
  fireEvent.change(screen.getByLabelText(i18n.t("usefulLinks.form.urlLabel")), {
    target: { value: "https://mail.school.example.com" },
  });
  fireEvent.change(screen.getByLabelText(i18n.t("usefulLinks.form.descriptionLabel")), {
    target: { value: "Teacher inbox" },
  });
  fireEvent.click(screen.getByRole("button", { name: i18n.t("usefulLinks.form.addButton") }));

  await waitFor(() =>
    expect(handleCreateUsefulLink).toHaveBeenCalledWith({
      title: "School Email",
      url: "https://mail.school.example.com",
      description: "Teacher inbox",
    })
  );
});

test("edits and deletes a useful link", async () => {
  vi.spyOn(window, "confirm").mockReturnValue(true);
  const handleUpdateUsefulLink = vi.fn().mockResolvedValue(true);
  const handleDeleteUsefulLink = vi.fn().mockResolvedValue(true);

  render(
    <UsefulLinksPage
      formError=""
      usefulLinks={BASE_LINKS}
      handleCreateUsefulLink={vi.fn()}
      handleUpdateUsefulLink={handleUpdateUsefulLink}
      handleDeleteUsefulLink={handleDeleteUsefulLink}
      handleSwapUsefulLinkSortOrder={vi.fn()}
    />
  );

  fireEvent.click(screen.getAllByRole("button", { name: i18n.t("usefulLinks.actions.edit") })[0]);

  const modalHeading = await screen.findByRole("heading", { name: i18n.t("usefulLinks.editModal.title") });
  const modalRoot = modalHeading.closest(".modal-card");
  if (!modalRoot) {
    throw new Error("Expected edit modal to be open.");
  }

  fireEvent.change(within(modalRoot).getByLabelText(i18n.t("usefulLinks.form.titleLabel")), {
    target: { value: "District Portal Updated" },
  });
  fireEvent.click(within(modalRoot).getByRole("button", { name: i18n.t("usefulLinks.form.saveButton") }));

  await waitFor(() =>
    expect(handleUpdateUsefulLink).toHaveBeenCalledWith("link-1", {
      title: "District Portal Updated",
      url: "https://district.example.com",
      description: "Attendance and reports",
    })
  );

  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("usefulLinks.aria.delete", { title: "District Portal" }),
    })
  );

  await waitFor(() => expect(handleDeleteUsefulLink).toHaveBeenCalledWith("link-1"));
});

test("reorders links on mobile with reorder mode controls", async () => {
  setViewport(true);
  const handleSwapUsefulLinkSortOrder = vi.fn().mockResolvedValue(true);

  render(
    <UsefulLinksPage
      formError=""
      usefulLinks={BASE_LINKS}
      handleCreateUsefulLink={vi.fn()}
      handleUpdateUsefulLink={vi.fn()}
      handleDeleteUsefulLink={vi.fn()}
      handleSwapUsefulLinkSortOrder={handleSwapUsefulLinkSortOrder}
    />
  );

  fireEvent.click(screen.getByRole("button", { name: i18n.t("common.actions.reorderMode") }));
  fireEvent.click(
    screen.getByRole("button", {
      name: i18n.t("usefulLinks.aria.moveDown", { title: "District Portal" }),
    })
  );

  await waitFor(() =>
    expect(handleSwapUsefulLinkSortOrder).toHaveBeenCalledWith(expect.any(Array), "link-1", "link-2")
  );
});
