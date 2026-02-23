import { useTranslation } from "react-i18next";

function TimerOverlay({
  timerProgress,
  timerRemainingSeconds,
  formatTimer,
  timerTimeRemaining,
  stopTimer,
  setTimerIsExpanded,
  timerChecklist,
}) {
  const { t } = useTranslation();
  const clampedProgress = Math.max(0, Math.min(1, timerProgress));
  const topSandHeight = 108 * clampedProgress;
  const topSandY = 150 - topSandHeight;
  const bottomSandHeight = 108 * (1 - clampedProgress);
  const bottomSandY = 258 - bottomSandHeight;
  const streamOpacity = timerRemainingSeconds > 0 ? 1 : 0;

  return (
    <div className="timer-overlay">
      <div className={`timer-overlay-card${timerChecklist.length > 0 ? " has-checklist" : ""}`}>
        <div className="timer-visual">
          <div className="timer-hourglass-wrap">
            <svg className="timer-hourglass" viewBox="0 0 220 300" aria-hidden="true">
              <defs>
                <linearGradient id="woodGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#8a5a2b" />
                  <stop offset="100%" stopColor="#5b3717" />
                </linearGradient>
                <linearGradient id="glassGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="rgba(219, 234, 254, 0.55)" />
                  <stop offset="100%" stopColor="rgba(125, 211, 252, 0.2)" />
                </linearGradient>
                <linearGradient id="sandGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#fef08a" />
                  <stop offset="100%" stopColor="#f59e0b" />
                </linearGradient>
                <clipPath id="topBulbClip">
                  <path d="M110 42 C78 42 58 64 58 94 C58 116 78 136 100 146 L110 150 L120 146 C142 136 162 116 162 94 C162 64 142 42 110 42 Z" />
                </clipPath>
                <clipPath id="bottomBulbClip">
                  <path d="M110 258 C78 258 58 236 58 206 C58 184 78 164 100 154 L110 150 L120 154 C142 164 162 184 162 206 C162 236 142 258 110 258 Z" />
                </clipPath>
              </defs>

              <ellipse cx="110" cy="22" rx="74" ry="16" className="hourglass-frame" />
              <ellipse cx="110" cy="278" rx="74" ry="16" className="hourglass-frame" />
              <rect x="30" y="28" width="14" height="244" rx="7" className="hourglass-post" />
              <rect x="176" y="28" width="14" height="244" rx="7" className="hourglass-post" />
              <circle cx="37" cy="24" r="6" className="hourglass-cap" />
              <circle cx="183" cy="24" r="6" className="hourglass-cap" />
              <circle cx="37" cy="276" r="6" className="hourglass-cap" />
              <circle cx="183" cy="276" r="6" className="hourglass-cap" />

              <path className="hourglass-glass" d="M110 42 C78 42 58 64 58 94 C58 116 78 136 100 146 L110 150 L120 146 C142 136 162 116 162 94 C162 64 142 42 110 42 Z" />
              <path className="hourglass-glass" d="M110 258 C78 258 58 236 58 206 C58 184 78 164 100 154 L110 150 L120 154 C142 164 162 184 162 206 C162 236 142 258 110 258 Z" />
              <circle className="hourglass-neck" cx="110" cy="150" r="4.5" />

              <rect
                x="56"
                y={topSandY}
                width="108"
                height={topSandHeight}
                fill="url(#sandGradient)"
                clipPath="url(#topBulbClip)"
              />
              <rect
                x="56"
                y={bottomSandY}
                width="108"
                height={bottomSandHeight}
                fill="url(#sandGradient)"
                clipPath="url(#bottomBulbClip)"
              />
              <rect
                className="hourglass-stream"
                x="108"
                y="132"
                width="4"
                height="36"
                rx="2"
                fill="url(#sandGradient)"
                style={{ opacity: streamOpacity }}
              />

              <path
                d="M61 99 C82 126 97 139 110 150 C123 139 138 126 159 99"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />
              <path
                d="M61 201 C82 174 97 161 110 150 C123 161 138 174 159 201"
                fill="none"
                stroke="rgba(255,255,255,0.32)"
                strokeWidth="2"
              />
            </svg>
          </div>

          <div className={`timer-readout${timerChecklist.length > 0 ? " has-checklist" : ""}`}>
            <div className="timer-readout-main">
              <div className="timer-big">{formatTimer(timerRemainingSeconds)}</div>
              <div className="muted">{timerTimeRemaining()}</div>
              <div className="timer-progress-label">
                {Math.round(clampedProgress * 100)}% remaining
              </div>
              <div className="timer-progress-strip" aria-hidden="true">
                <span style={{ width: `${clampedProgress * 100}%` }} />
              </div>
              <div className="timer-controls">
                <button type="button" className="timer-stop" onClick={stopTimer}>
                  Stop
                </button>
                <button type="button" className="timer-minimize" onClick={() => setTimerIsExpanded(false)}>
                  Minimize
                </button>
              </div>
            </div>
            {timerChecklist.length > 0 && (
              <div className="timer-checklist">
                <h4>{t("timer.runtime.todoTitle")}</h4>
                <ol>
                  {timerChecklist.map((item, index) => (
                    <li key={`${index}-${item}`}>{item}</li>
                  ))}
                </ol>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function MiniTimer({
  timerProgress,
  timerProgressColor,
  timerRemainingSeconds,
  formatTimer,
  setTimerIsExpanded,
  stopTimer,
  timerChecklist,
}) {
  const { t } = useTranslation();
  return (
    <div className="mini-timer">
      <div className="mini-timer-ring">
        <svg viewBox="0 0 60 60">
          <circle className="timer-ring-bg" cx="30" cy="30" r="24" />
          <circle
            className="timer-ring-progress"
            cx="30"
            cy="30"
            r="24"
            strokeDasharray={`${2 * Math.PI * 24}`}
            strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerProgress)}`}
            style={{ stroke: timerProgressColor }}
          />
        </svg>
        <span>{formatTimer(timerRemainingSeconds)}</span>
      </div>
      <div className="mini-timer-info">
        <span className="muted">Timer Running</span>
        <strong>{formatTimer(timerRemainingSeconds)}</strong>
        {timerChecklist.length > 0 && (
          <span className="mini-timer-checklist-summary">
            {t("timer.runtime.todoSummary", { count: timerChecklist.length })}
          </span>
        )}
      </div>
      <div className="mini-timer-actions">
        <button type="button" onClick={() => setTimerIsExpanded(true)}>
          Expand
        </button>
        <button type="button" onClick={stopTimer}>
          Stop
        </button>
      </div>
    </div>
  );
}

function TimesUpOverlay({ dismissTimesUpAndReset }) {
  return (
    <div className="times-up-overlay">
      <div className="times-up-card">
        <div className="times-up-icon">⏰</div>
        <h2>TIME'S UP!</h2>
        <p>Timer has finished</p>
        <button type="button" onClick={dismissTimesUpAndReset}>
          Dismiss
        </button>
      </div>
    </div>
  );
}

function TimerRuntimeOverlays({ timer }) {
  const {
    timerIsRunning,
    timerIsExpanded,
    timerShowTimesUp,
    timerProgress,
    timerProgressColor,
    timerRemainingSeconds,
    timerChecklist,
    formatTimer,
    timerTimeRemaining,
    stopTimer,
    setTimerIsExpanded,
    dismissTimesUpAndReset,
  } = timer;

  return (
    <>
      {timerIsRunning && timerIsExpanded && (
        <TimerOverlay
          timerProgress={timerProgress}
          timerRemainingSeconds={timerRemainingSeconds}
          formatTimer={formatTimer}
          timerTimeRemaining={timerTimeRemaining}
          stopTimer={stopTimer}
          setTimerIsExpanded={setTimerIsExpanded}
          timerChecklist={timerChecklist}
        />
      )}
      {timerIsRunning && !timerIsExpanded && (
        <MiniTimer
          timerProgress={timerProgress}
          timerProgressColor={timerProgressColor}
          timerRemainingSeconds={timerRemainingSeconds}
          formatTimer={formatTimer}
          setTimerIsExpanded={setTimerIsExpanded}
          stopTimer={stopTimer}
          timerChecklist={timerChecklist}
        />
      )}
      {timerShowTimesUp && (
        <TimesUpOverlay dismissTimesUpAndReset={dismissTimesUpAndReset} />
      )}
    </>
  );
}

export default TimerRuntimeOverlays;
