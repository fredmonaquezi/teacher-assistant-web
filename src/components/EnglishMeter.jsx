import { useTranslation } from "react-i18next";

const DEFAULT_VALUE = 50;
const STEP = 5;

function clampPercentage(value) {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) return DEFAULT_VALUE;
  return Math.min(100, Math.max(0, Math.round(numericValue)));
}

function getLevelKey(value) {
  if (value >= 90) return "immersed";
  if (value >= 75) return "soaring";
  if (value >= 50) return "flowing";
  if (value >= 25) return "building";
  return "starting";
}

function EnglishMeter({ className, value = DEFAULT_VALUE, onChange }) {
  const { t } = useTranslation();
  const percentage = clampPercentage(value);
  const levelKey = getLevelKey(percentage);
  const updateValue = (nextValue) => onChange?.(clampPercentage(nextValue));

  return (
    <section
      className="english-meter"
      style={{ "--english-meter-value": `${percentage}%` }}
      aria-labelledby="english-meter-title"
    >
      <div className="english-meter-glow english-meter-glow-one" aria-hidden="true" />
      <div className="english-meter-glow english-meter-glow-two" aria-hidden="true" />

      <header className="english-meter-header">
        <div className="english-meter-heading">
          <span className="english-meter-icon" aria-hidden="true">
            <svg viewBox="0 0 32 32">
              <path d="M6.5 7.5h19v13h-9l-5.8 4v-4H6.5z" />
              <path d="M11 12h10M11 16h7" />
            </svg>
          </span>
          <div>
            <p className="english-meter-kicker">{t("home.englishMeter.kicker")}</p>
            <h3 id="english-meter-title">{t("home.englishMeter.title")}</h3>
          </div>
        </div>
        <span className="english-meter-class-pill">{className}</span>
      </header>

      <div className="english-meter-body">
        <div className="english-meter-score" aria-live="polite">
          <strong>{percentage}<span>%</span></strong>
          <div>
            <span>{t(`home.englishMeter.levels.${levelKey}.title`)}</span>
            <p>{t(`home.englishMeter.levels.${levelKey}.description`)}</p>
          </div>
        </div>

        <div className="english-meter-control">
          <div className="english-meter-track" aria-hidden="true">
            <span className="english-meter-track-fill" />
            <span className="english-meter-marker">★</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            step={STEP}
            value={percentage}
            aria-label={t("home.englishMeter.sliderLabel", { className })}
            onChange={(event) => updateValue(event.target.value)}
          />
          <div className="english-meter-scale" aria-hidden="true">
            <span>{t("home.englishMeter.nativeLanguage")}</span>
            <span>{t("home.englishMeter.english")}</span>
          </div>
        </div>

        <div className="english-meter-actions">
          <button
            type="button"
            className="english-meter-adjust english-meter-adjust-down"
            onClick={() => updateValue(percentage - STEP)}
            disabled={percentage === 0}
            aria-label={t("home.englishMeter.decreaseLabel")}
          >
            <span aria-hidden="true">−</span>
            {t("home.englishMeter.moreNative")}
          </button>
          <p>{t("home.englishMeter.hint")}</p>
          <button
            type="button"
            className="english-meter-adjust english-meter-adjust-up"
            onClick={() => updateValue(percentage + STEP)}
            disabled={percentage === 100}
            aria-label={t("home.englishMeter.increaseLabel")}
          >
            {t("home.englishMeter.moreEnglish")}
            <span aria-hidden="true">+</span>
          </button>
        </div>
      </div>
    </section>
  );
}

export { DEFAULT_VALUE as DEFAULT_ENGLISH_METER_VALUE, clampPercentage };
export default EnglishMeter;
