import { useCallback, useEffect, useMemo, useState } from "react";

const ACTIVE_CLASS_STORAGE_PREFIX = "ta_active_class";

export function getActiveClassStorageKey(userId) {
  return `${ACTIVE_CLASS_STORAGE_PREFIX}:${userId || "anonymous"}`;
}

function readStoredClassId(userId) {
  if (typeof window === "undefined") return "";

  try {
    return window.localStorage.getItem(getActiveClassStorageKey(userId)) || "";
  } catch {
    return "";
  }
}

function useActiveClassSelection(userId, classes) {
  const [selectedClassId, setSelectedClassId] = useState(() => readStoredClassId(userId));

  const activeClass = useMemo(
    () =>
      classes.find((classItem) => classItem.id === selectedClassId) ||
      (classes.length === 1 ? classes[0] : null),
    [classes, selectedClassId]
  );
  const activeClassId = activeClass?.id || "";

  const setActiveClassId = useCallback((nextClassId) => {
    setSelectedClassId(String(nextClassId || ""));
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const storageKey = getActiveClassStorageKey(userId);
    try {
      if (activeClassId) {
        window.localStorage.setItem(storageKey, activeClassId);
      } else if (classes.length > 0) {
        window.localStorage.removeItem(storageKey);
      }
    } catch {
      // Selection persistence is a convenience; the in-memory selection still works.
    }
  }, [activeClassId, classes.length, userId]);

  return {
    activeClass,
    activeClassId,
    setActiveClassId,
  };
}

export default useActiveClassSelection;
