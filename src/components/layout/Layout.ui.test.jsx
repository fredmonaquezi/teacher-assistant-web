import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, expect, test, vi } from "vitest";
import Layout from "./Layout";

function mockViewport(matches) {
  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      addListener: vi.fn(),
      removeListener: vi.fn(),
    })),
  });
}

beforeEach(() => {
  mockViewport(true);
});

afterEach(cleanup);

test("keeps the mobile navigation trigger in the app bar and closes from the drawer", () => {
  const { container } = render(
    <MemoryRouter>
      <Layout
        user={{ email: "teacher@example.com", user_metadata: { display_name: "Teacher" } }}
        onSignOut={vi.fn()}
        preferences={{ dateFormat: "MDY", timeFormat: "12h" }}
        classes={[{ id: "class-1", name: "Class 1" }]}
        activeClassId="class-1"
        setActiveClassId={vi.fn()}
      >
        <p>Page content</p>
      </Layout>
    </MemoryRouter>
  );

  const openButton = screen.getByRole("button", { name: "Open navigation menu" });
  expect(openButton.closest(".mobile-app-bar")).toBeTruthy();

  fireEvent.click(openButton);
  expect(container.querySelector(".app-shell")?.classList.contains("mobile-sidebar-open")).toBe(true);
  expect(openButton.getAttribute("aria-expanded")).toBe("true");

  const drawerCloseButton = container.querySelector(".sidebar-mobile-close");
  expect(drawerCloseButton?.getAttribute("aria-label")).toBe("Close navigation menu");
  fireEvent.click(drawerCloseButton);
  expect(container.querySelector(".app-shell")?.classList.contains("mobile-sidebar-open")).toBe(false);
});

test("does not enable drawer navigation on desktop", () => {
  mockViewport(false);
  const { container } = render(
    <MemoryRouter>
      <Layout
        user={{ email: "teacher@example.com", user_metadata: { display_name: "Teacher" } }}
        onSignOut={vi.fn()}
        preferences={{ dateFormat: "MDY", timeFormat: "12h" }}
        classes={[{ id: "class-1", name: "Class 1" }]}
        activeClassId="class-1"
        setActiveClassId={vi.fn()}
      >
        <p>Page content</p>
      </Layout>
    </MemoryRouter>
  );

  fireEvent.click(screen.getByRole("button", { name: "Open navigation menu" }));

  expect(container.querySelector(".app-shell")?.classList.contains("mobile-sidebar-open")).toBe(false);
});
