import i18n from "i18next";
import { initReactI18next } from "react-i18next";

const STORAGE_KEY = "teacher-assistant.language";
const SUPPORTED_LANGUAGES = ["en", "pt-BR"];
const LANGUAGE_LOADERS = {
  en: () => import("./en.json"),
  "pt-BR": () => import("./pt-BR.json"),
};
const CHANGE_LANGUAGE_PATCH_FLAG = "__teacherAssistantLazyLanguagePatched";
const ORIGINAL_CHANGE_LANGUAGE_KEY = "__teacherAssistantOriginalChangeLanguage";
const pendingLanguageLoads = new Map();

export function normalizeLanguage(language) {
  if (SUPPORTED_LANGUAGES.includes(language)) return language;
  if (String(language || "").toLowerCase().startsWith("pt")) return "pt-BR";
  return "en";
}

export function getInitialLanguage() {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;

  const browserLanguage = window.navigator.language || "";
  return normalizeLanguage(browserLanguage);
}

async function loadLanguage(language) {
  const normalizedLanguage = normalizeLanguage(language);
  const canReadBundles =
    typeof i18n.hasResourceBundle === "function" &&
    typeof i18n.getResourceBundle === "function";

  if (canReadBundles && i18n.hasResourceBundle(normalizedLanguage, "translation")) {
    return i18n.getResourceBundle(normalizedLanguage, "translation");
  }

  if (pendingLanguageLoads.has(normalizedLanguage)) {
    return pendingLanguageLoads.get(normalizedLanguage);
  }

  const loader = LANGUAGE_LOADERS[normalizedLanguage] || LANGUAGE_LOADERS.en;
  const pendingLoad = loader()
    .then((module) => {
      const resources = module.default || {};
      const canWriteBundles = typeof i18n.addResourceBundle === "function";
      if (
        i18n.isInitialized &&
        canReadBundles &&
        canWriteBundles &&
        !i18n.hasResourceBundle(normalizedLanguage, "translation")
      ) {
        i18n.addResourceBundle(normalizedLanguage, "translation", resources, true, true);
      }
      return resources;
    })
    .finally(() => {
      pendingLanguageLoads.delete(normalizedLanguage);
    });

  pendingLanguageLoads.set(normalizedLanguage, pendingLoad);
  return pendingLoad;
}

function patchChangeLanguage() {
  if (i18n[CHANGE_LANGUAGE_PATCH_FLAG]) return;

  i18n[ORIGINAL_CHANGE_LANGUAGE_KEY] = i18n.changeLanguage.bind(i18n);
  i18n.changeLanguage = async (language, ...args) => {
    const nextLanguage = normalizeLanguage(language);
    await loadLanguage(nextLanguage);
    return i18n[ORIGINAL_CHANGE_LANGUAGE_KEY](nextLanguage, ...args);
  };
  i18n[CHANGE_LANGUAGE_PATCH_FLAG] = true;
}

const initialLanguage = getInitialLanguage();
const initialTranslation = await loadLanguage(initialLanguage);

if (!i18n.isInitialized) {
  await i18n.use(initReactI18next).init({
    resources: {
      [initialLanguage]: { translation: initialTranslation },
    },
    lng: initialLanguage,
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
    partialBundledLanguages: true,
  });

  if (typeof window !== "undefined") {
    i18n.on("languageChanged", (language) => {
      if (SUPPORTED_LANGUAGES.includes(language)) {
        window.localStorage.setItem(STORAGE_KEY, language);
      }
    });
  }
}

patchChangeLanguage();

export async function ensureLanguageLoaded(language) {
  await loadLanguage(language);
  return normalizeLanguage(language);
}

export default i18n;
