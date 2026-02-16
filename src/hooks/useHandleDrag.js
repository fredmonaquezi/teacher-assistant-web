import { useCallback, useEffect, useRef } from "react";

export function useHandleDrag(isEnabled) {
  const readyDragIdRef = useRef(null);
  const pendingPressRef = useRef(null);
  const holdTimerRef = useRef(null);

  const clearHoldTimer = useCallback(() => {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }, []);

  const resetHandleDrag = useCallback(() => {
    clearHoldTimer();
    readyDragIdRef.current = null;
    pendingPressRef.current = null;
  }, [clearHoldTimer]);

  const armDragByMovement = useCallback((event) => {
    if (!pendingPressRef.current) return;
    if (pendingPressRef.current.pointerId !== event.pointerId) return;
    const distanceX = event.clientX - pendingPressRef.current.startX;
    const distanceY = event.clientY - pendingPressRef.current.startY;
    const moved = Math.hypot(distanceX, distanceY);
    if (moved < 6) return;
    readyDragIdRef.current = pendingPressRef.current.id;
    clearHoldTimer();
  }, [clearHoldTimer]);

  const onHandlePointerDown = useCallback((id, event) => {
    if (!isEnabled) return;
    if (event.button !== 0 && event.pointerType !== "touch") return;
    if (typeof event.currentTarget?.setPointerCapture === "function") {
      try {
        event.currentTarget.setPointerCapture(event.pointerId);
      } catch {
        // Ignore unsupported pointer capture edge cases.
      }
    }
    pendingPressRef.current = {
      id,
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
    };
    readyDragIdRef.current = null;
    clearHoldTimer();
    holdTimerRef.current = window.setTimeout(() => {
      readyDragIdRef.current = id;
    }, 150);
  }, [clearHoldTimer, isEnabled]);

  const onHandlePointerMove = useCallback((event) => {
    if (!isEnabled) return;
    armDragByMovement(event);
  }, [armDragByMovement, isEnabled]);

  const onHandlePointerUp = useCallback((event) => {
    if (!pendingPressRef.current) return;
    if (pendingPressRef.current.pointerId !== event.pointerId) return;
    if (typeof event.currentTarget?.releasePointerCapture === "function") {
      try {
        event.currentTarget.releasePointerCapture(event.pointerId);
      } catch {
        // Ignore if pointer capture was not active.
      }
    }
    resetHandleDrag();
  }, [resetHandleDrag]);

  const isDragAllowed = useCallback(
    (id) => isEnabled && readyDragIdRef.current === id,
    [isEnabled]
  );

  useEffect(
    () => () => {
      clearHoldTimer();
    },
    [clearHoldTimer]
  );

  return {
    onHandlePointerDown,
    onHandlePointerMove,
    onHandlePointerUp,
    isDragAllowed,
    resetHandleDrag,
  };
}
