import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./en.json";
import ptBR from "./pt-BR.json";

const STORAGE_KEY = "teacher-assistant.language";
const SUPPORTED_LANGUAGES = ["en", "pt-BR"];

function getInitialLanguage() {
  if (typeof window === "undefined") return "en";

  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored && SUPPORTED_LANGUAGES.includes(stored)) return stored;

  const browserLanguage = window.navigator.language || "";
  if (browserLanguage.toLowerCase().startsWith("pt")) return "pt-BR";
  return "en";
}

if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      en: { translation: en },
      "pt-BR": { translation: ptBR },
    },
    lng: getInitialLanguage(),
    fallbackLng: "en",
    supportedLngs: SUPPORTED_LANGUAGES,
    interpolation: {
      escapeValue: false,
    },
  });

  if (typeof window !== "undefined") {
    i18n.on("languageChanged", (language) => {
      if (SUPPORTED_LANGUAGES.includes(language)) {
        window.localStorage.setItem(STORAGE_KEY, language);
      }
    });
  }
}

export default i18n;
