import { enUS, ptBR } from "date-fns/locale";

const capitalizeFirst = (value) => {
  if (typeof value !== "string" || value.length === 0) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
};

const ptBRWithCapitalizedMonths = {
  ...ptBR,
  localize: {
    ...ptBR.localize,
    month: (monthIndex, options) =>
      capitalizeFirst(ptBR.localize.month(monthIndex, options)),
  },
};

export function getDateLocale(language, options = {}) {
  const { capitalizePtBrMonths = false } = options;
  if (language === "pt-BR") {
    return capitalizePtBrMonths ? ptBRWithCapitalizedMonths : ptBR;
  }
  return enUS;
}

