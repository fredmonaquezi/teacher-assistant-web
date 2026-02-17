import { useCallback, useEffect, useRef, useState } from "react";

function useClassroomTimer() {
  const timerIntervalRef = useRef(null);
  const timerAudioRef = useRef(null);
  const [timerIsRunning, setTimerIsRunning] = useState(false);
  const [timerIsExpanded, setTimerIsExpanded] = useState(false);
  const [timerTotalSeconds, setTimerTotalSeconds] = useState(0);
  const [timerRemainingSeconds, setTimerRemainingSeconds] = useState(0);
  const [timerShowTimesUp, setTimerShowTimesUp] = useState(false);

  const stopTimerInterval = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const stopTimerSound = useCallback(() => {
    if (timerAudioRef.current) {
      timerAudioRef.current.pause();
      timerAudioRef.current.currentTime = 0;
      timerAudioRef.current.onended = null;
      timerAudioRef.current = null;
    }
  }, []);

  const playTimerSound = useCallback(() => {
    try {
      stopTimerSound();
      const audio = new Audio("/timer_end.wav");
      audio.loop = false;
      audio.onended = () => {
        if (timerAudioRef.current === audio) {
          timerAudioRef.current = null;
        }
      };
      audio.play().catch(() => {});
      timerAudioRef.current = audio;
    } catch {
      console.warn("Timer sound failed to play.");
    }
  }, [stopTimerSound]);

  const resetTimer = useCallback(() => {
    stopTimerSound();
    stopTimerInterval();
    setTimerShowTimesUp(false);
    setTimerIsRunning(false);
    setTimerIsExpanded(false);
    setTimerTotalSeconds(0);
    setTimerRemainingSeconds(0);
  }, [stopTimerInterval, stopTimerSound]);

  const dismissTimesUpAndReset = () => {
    resetTimer();
  };

  const startTimerSeconds = (seconds) => {
    resetTimer();
    if (!Number.isFinite(seconds) || seconds <= 0) return;
    setTimerShowTimesUp(false);
    setTimerTotalSeconds(seconds);
    setTimerRemainingSeconds(seconds);
    setTimerIsRunning(true);
    setTimerIsExpanded(true);
  };

  const stopTimer = () => {
    resetTimer();
  };

  useEffect(() => {
    if (!timerIsRunning) {
      stopTimerInterval();
      return;
    }
    timerIntervalRef.current = setInterval(() => {
      setTimerRemainingSeconds((prev) => {
        if (prev <= 1) {
          stopTimerInterval();
          setTimerIsRunning(false);
          setTimerShowTimesUp(true);
          playTimerSound();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => stopTimerInterval();
  }, [timerIsRunning, playTimerSound, stopTimerInterval]);

  useEffect(() => {
    return () => {
      stopTimerInterval();
      stopTimerSound();
    };
  }, [stopTimerInterval, stopTimerSound]);

  const formatTimer = (totalSeconds) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  };

  const timerProgress =
    timerTotalSeconds > 0 ? timerRemainingSeconds / timerTotalSeconds : 0;
  const timerProgressColor =
    timerProgress > 0.5 ? "#22c55e" : timerProgress > 0.2 ? "#f59e0b" : "#ef4444";

  const timerTimeRemaining = () => {
    const minutes = Math.floor(timerRemainingSeconds / 60);
    const seconds = timerRemainingSeconds % 60;
    if (minutes > 0) {
      return `${minutes} minute${minutes === 1 ? "" : "s"} remaining`;
    }
    return `${seconds} second${seconds === 1 ? "" : "s"} remaining`;
  };

  return {
    timerIsRunning,
    timerIsExpanded,
    timerRemainingSeconds,
    timerShowTimesUp,
    timerProgress,
    timerProgressColor,
    setTimerIsExpanded,
    startTimerSeconds,
    stopTimer,
    dismissTimesUpAndReset,
    formatTimer,
    timerTimeRemaining,
  };
}

export default useClassroomTimer;
