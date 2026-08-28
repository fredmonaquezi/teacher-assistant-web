import { expect, test } from "vitest";
import { getClassesNavigationPath } from "./layoutNavigation";

test("opens the active class from the Classes navigation item", () => {
  expect(getClassesNavigationPath("class-1")).toBe("/classes/class-1");
  expect(getClassesNavigationPath("")).toBe("/classes");
});
