import { beforeAll } from "vitest";
import i18n from "../i18n";

beforeAll(async () => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem("teacher-assistant.language", "en");
  }
  await i18n.changeLanguage("en");
});
