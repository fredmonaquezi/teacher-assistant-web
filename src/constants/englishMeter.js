export const DEFAULT_ENGLISH_METER_VALUE = 50;

export function clampEnglishMeterPercentage(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_ENGLISH_METER_VALUE;
  return Math.min(100, Math.max(0, Math.round(numericValue)));
}
