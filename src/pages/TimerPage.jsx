import { useEffect, useState } from "react";

const TIMER_PREFS_KEY = "ta_timer_custom_duration";
const TIMER_PRESETS = [
  { minutes: 1, label: "1 min", color: "#2563eb", icon: "🐇" },
  { minutes: 5, label: "5 min", color: "#16a34a", icon: "⚡" },
  { minutes: 10, label: "10 min", color: "#f97316", icon: "🔥" },
  { minutes: 15, label: "15 min", color: "#7c3aed", icon: "⭐" },
  { minutes: 30, label: "30 min", color: "#ec4899", icon: "💗" },
  { minutes: 45, label: "45 min", color: "#4f46e5", icon: "✨" },
  { minutes: 60, label: "1 hour", color: "#dc2626", icon: "⏲️" },
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

function TimerPage({ startTimerSeconds }) {
  const [customMinutes, setCustomMinutes] = useState(readStoredMinutes);
  const [customSeconds, setCustomSeconds] = useState(readStoredSeconds);

  useEffect(() => {
    localStorage.setItem(
      TIMER_PREFS_KEY,
      JSON.stringify({ minutes: customMinutes, seconds: customSeconds })
    );
  }, [customMinutes, customSeconds]);

  const totalCustomSeconds = customMinutes * 60 + customSeconds;

  return (
    <section className="panel timer-page">
      <div className="timer-header-card">
        <div className="timer-header-copy">
          <span className="timer-kicker">Focus Tool</span>
          <h2>Classroom Timer</h2>
          <p className="muted">Choose a duration and keep every activity on track.</p>
        </div>
        <div className="timer-icon" aria-hidden="true">⏱️</div>
      </div>

      <div className="timer-section">
        <h3>Quick Timers</h3>
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
              <div className="timer-preset-label">{preset.label}</div>
              <div className="timer-preset-sub">{preset.minutes} min</div>
            </button>
          ))}
        </div>
      </div>

      <div className="timer-section">
        <h3>Custom Timer</h3>
        <div className="timer-custom-card">
          <div className="timer-display">
            <span>{String(customMinutes).padStart(2, "0")}</span>
            <span>:</span>
            <span>{String(customSeconds).padStart(2, "0")}</span>
          </div>
          <p className="timer-custom-hint">Set your exact countdown length</p>

          <div className="timer-picker-row">
            <label className="stack">
              <span>Minutes</span>
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
              <span>Seconds</span>
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

          <button
            type="button"
            className="timer-start-btn"
            disabled={totalCustomSeconds === 0}
            onClick={() => startTimerSeconds(totalCustomSeconds)}
          >
            ▶ Start Custom Timer
          </button>
        </div>
      </div>
    </section>
  );
}

export default TimerPage;
