import { afterEach, expect, test } from "vitest";
import i18n, { ensureLanguageLoaded, getInitialLanguage } from "./index";

const STORAGE_KEY = "teacher-assistant.language";
const originalNavigatorLanguage = window.navigator.language;

function setNavigatorLanguage(language) {
  Object.defineProperty(window.navigator, "language", {
    configurable: true,
    value: language,
  });
}

afterEach(async () => {
  window.localStorage.clear();
  setNavigatorLanguage(originalNavigatorLanguage);
  await i18n.changeLanguage("en");
});

test("prefers the saved language for startup selection", () => {
  window.localStorage.setItem(STORAGE_KEY, "pt-BR");
  setNavigatorLanguage("en-US");

  expect(getInitialLanguage()).toBe("pt-BR");
});

test("falls back to the browser language for startup selection", () => {
  window.localStorage.removeItem(STORAGE_KEY);
  setNavigatorLanguage("pt-PT");

  expect(getInitialLanguage()).toBe("pt-BR");
});

test("falls back to english when the browser language is unsupported", () => {
  window.localStorage.removeItem(STORAGE_KEY);
  setNavigatorLanguage("fr-FR");

  expect(getInitialLanguage()).toBe("en");
});

test("loads and persists language changes on demand", async () => {
  await ensureLanguageLoaded("pt-BR");
  await i18n.changeLanguage("pt-BR");

  expect(i18n.language).toBe("pt-BR");
  expect(i18n.t("common.actions.cancel")).toBe("Cancelar");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("pt-BR");

  await ensureLanguageLoaded("en");
  await i18n.changeLanguage("en");

  expect(i18n.language).toBe("en");
  expect(i18n.t("common.actions.cancel")).toBe("Cancel");
  expect(window.localStorage.getItem(STORAGE_KEY)).toBe("en");
});
