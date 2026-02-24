import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

const TIMER_PREFS_KEY = "ta_timer_custom_duration";
const TIMER_PRESETS = [
  { minutes: 1, color: "#2563eb", icon: "🐇" },
  { minutes: 5, color: "#16a34a", icon: "⚡" },
  { minutes: 10, color: "#f97316", icon: "🔥" },
  { minutes: 15, color: "#7c3aed", icon: "⭐" },
  { minutes: 30, color: "#ec4899", icon: "💗" },
  { minutes: 45, color: "#4f46e5", icon: "✨" },
  { minutes: 60, color: "#dc2626", icon: "⏲️" },
];

function readStoredMinutes() {
  try {
    const raw = localStorage.getItem(TIMER_PREFS_KEY);
    if (!raw) return 5;
    const parsed = JSON.parse(raw);
    const minutes = Number(parsed?.minutes);
    if (!Number.isInteger(minutes)) return 5;
    return Math.max(0, Math.min(180, minutes));
  } catch {
    return 5;
  }
}

function readStoredSeconds() {
  try {
    const raw = localStorage.getItem(TIMER_PREFS_KEY);
    if (!raw) return 0;
    const parsed = JSON.parse(raw);
    const seconds = Number(parsed?.seconds);
    if (!Number.isInteger(seconds)) return 0;
    return Math.max(0, Math.min(59, seconds));
  } catch {
    return 0;
  }
}

function readStoredChecklistText() {
  try {
    const raw = localStorage.getItem(TIMER_PREFS_KEY);
    if (!raw) return "";
    const parsed = JSON.parse(raw);
    return typeof parsed?.checklistText === "string" ? parsed.checklistText : "";
  } catch {
    return "";
  }
}

function parseChecklist(rawChecklist) {
  if (typeof rawChecklist !== "string" || rawChecklist.trim().length === 0) {
    return [];
  }

  return rawChecklist
    .split("\n")
    .map((line) => line.replace(/^\s*(?:[-*]\s*|\d+\s*[-.):]\s*)/, "").trim())
    .filter(Boolean)
    .slice(0, 15);
}

function TimerPage({ startTimerSeconds }) {
  const { t } = useTranslation();
  const [customMinutes, setCustomMinutes] = useState(readStoredMinutes);
  const [customSeconds, setCustomSeconds] = useState(readStoredSeconds);
  const [customChecklistText, setCustomChecklistText] = useState(readStoredChecklistText);

  useEffect(() => {
    localStorage.setItem(
      TIMER_PREFS_KEY,
      JSON.stringify({
        minutes: customMinutes,
        seconds: customSeconds,
        checklistText: customChecklistText,
      })
    );
  }, [customMinutes, customSeconds, customChecklistText]);

  const totalCustomSeconds = customMinutes * 60 + customSeconds;

  return (
    <section className="panel timer-page">
      <div className="timer-header-card">
        <div className="timer-header-copy">
          <span className="timer-kicker">{t("timer.kicker")}</span>
          <h2>{t("timer.title")}</h2>
          <p className="muted">{t("timer.subtitle")}</p>
        </div>
        <div className="timer-icon" aria-hidden="true">⏱️</div>
      </div>

      <div className="timer-section">
        <h3>{t("timer.quickTimers")}</h3>
        <div className="timer-presets">
          {TIMER_PRESETS.map((preset) => (
            <button
              key={preset.minutes}
              type="button"
              className="timer-preset"
              style={{ borderColor: preset.color, background: `${preset.color}22` }}
              onClick={() => startTimerSeconds(preset.minutes * 60)}
            >
              <div className="timer-preset-icon" style={{ color: preset.color }}>
                {preset.icon}
              </div>
              <div className="timer-preset-label">{t("timer.presetLabel", { count: preset.minutes })}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="timer-section">
        <h3>{t("timer.custom.title")}</h3>
        <div className="timer-custom-card">
          <div className="timer-display">
            <span>{String(customMinutes).padStart(2, "0")}</span>
            <span>:</span>
            <span>{String(customSeconds).padStart(2, "0")}</span>
          </div>
          <p className="timer-custom-hint">{t("timer.custom.hint")}</p>

          <div className="timer-picker-row">
            <label className="stack">
              <span>{t("timer.custom.minutes")}</span>
              <select
                value={customMinutes}
                onChange={(event) => setCustomMinutes(Number(event.target.value))}
              >
                {Array.from({ length: 181 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx}
                  </option>
                ))}
              </select>
            </label>
            <label className="stack">
              <span>{t("timer.custom.seconds")}</span>
              <select
                value={customSeconds}
                onChange={(event) => setCustomSeconds(Number(event.target.value))}
              >
                {Array.from({ length: 60 }).map((_, idx) => (
                  <option key={idx} value={idx}>
                    {idx}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <label className="stack timer-checklist-input">
            <span>{t("timer.custom.todoLabel")}</span>
            <textarea
              value={customChecklistText}
              onChange={(event) => setCustomChecklistText(event.target.value)}
              placeholder={t("timer.custom.todoPlaceholder")}
              rows={5}
            />
            <small className="muted">{t("timer.custom.todoHint")}</small>
          </label>

          <button
            type="button"
            className="timer-start-btn"
            disabled={totalCustomSeconds === 0}
            onClick={() =>
              startTimerSeconds(totalCustomSeconds, {
                checklist: parseChecklist(customChecklistText),
              })
            }
          >
            {t("timer.custom.start")}
          </button>
        </div>
      </div>
    </section>
  );
}

export default TimerPage;
