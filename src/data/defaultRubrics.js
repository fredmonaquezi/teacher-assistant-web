import { DEFAULT_RUBRICS_EN } from "./defaultRubrics.en";
import { DEFAULT_RUBRICS_PT_BR } from "./defaultRubrics.pt-BR";

const SUPPORTED_DEFAULT_RUBRIC_LOCALES = ["en", "pt-BR"];
const DEFAULT_RUBRICS_BY_LOCALE = {
  en: DEFAULT_RUBRICS_EN,
  "pt-BR": DEFAULT_RUBRICS_PT_BR,
};

function normalizeTitle(value) {
  return String(value || "").trim().toLowerCase();
}

function cloneRubricsWithSafeDescriptions(rubrics) {
  return rubrics.map((rubric) => ({
    ...rubric,
    categories: (rubric.categories || []).map((category) => ({
      ...category,
      criteria: (category.criteria || []).map((criterion) => ({
        ...criterion,
        description: criterion.description ?? "",
      })),
    })),
  }));
}

export function normalizeRubricLocale(locale) {
  const normalized = String(locale || "").trim().toLowerCase();
  if (normalized.startsWith("pt")) return "pt-BR";
  return "en";
}

export function getDefaultRubricsForLocale(locale) {
  const normalizedLocale = normalizeRubricLocale(locale);
  const source = DEFAULT_RUBRICS_BY_LOCALE[normalizedLocale] || DEFAULT_RUBRICS_BY_LOCALE.en;
  return cloneRubricsWithSafeDescriptions(source);
}

const titleLookup = new Map();
for (const locale of SUPPORTED_DEFAULT_RUBRIC_LOCALES) {
  for (const rubric of DEFAULT_RUBRICS_BY_LOCALE[locale]) {
    titleLookup.set(normalizeTitle(rubric.title), {
      templateKey: rubric.templateKey,
      templateLocale: locale,
    });
  }
}

export function findDefaultRubricMetadataByTitle(title) {
  return titleLookup.get(normalizeTitle(title)) ?? null;
}

// Legacy default for any import sites that still consume DEFAULT_RUBRICS directly.
export const DEFAULT_RUBRICS = getDefaultRubricsForLocale("en");
