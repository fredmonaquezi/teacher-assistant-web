import { expect, test } from "vitest";
import { getWorkspaceDomainsForPath } from "./useWorkspaceReads";

test("loads core class data for Home and Profile so the global selector works", () => {
  expect(getWorkspaceDomainsForPath("/").core).toBe(true);
  expect(getWorkspaceDomainsForPath("/profile").core).toBe(true);
});

test("keeps feature-specific lazy loading for class tools", () => {
  const randomDomains = getWorkspaceDomainsForPath("/random");
  expect(randomDomains.core).toBe(true);
  expect(randomDomains.randomPicker).toBe(true);
  expect(randomDomains.attendance).toBe(false);
});
