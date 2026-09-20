import { expect, test } from "vitest";
import { getFeatureDomainsForPath } from "./queryKeys";

test("loads core class data for Home and Profile so the global selector works", () => {
  expect(getFeatureDomainsForPath("/").classroom).toBe(true);
  expect(getFeatureDomainsForPath("/profile").classroom).toBe(true);
});

test("keeps feature-specific lazy loading for class tools", () => {
  const randomDomains = getFeatureDomainsForPath("/random");
  expect(randomDomains.classroom).toBe(true);
  expect(randomDomains.randomPicker).toBe(true);
  expect(randomDomains.attendance).toBe(false);
});

test("loads only retained domains for class, student, and group routes", () => {
  expect(getFeatureDomainsForPath("/classes/class-1")).toMatchObject({
    classroom: true,
    subjects: true,
    attendance: false,
    groups: false,
  });
  expect(getFeatureDomainsForPath("/students/student-1")).toMatchObject({
    subjects: true,
    attendance: true,
  });
  expect(getFeatureDomainsForPath("/groups")).toMatchObject({
    subjects: true,
    groups: true,
    randomPicker: false,
  });
});
