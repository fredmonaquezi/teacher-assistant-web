import { useEffect, useState } from "react";
import { DEFAULT_PROFILE_PREFERENCES } from "../../constants/options";

const STORAGE_KEY = "ta_profile_preferences";

export default function useProfilePreferences() {
  const [preferences, setPreferences] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored
        ? { ...DEFAULT_PROFILE_PREFERENCES, ...JSON.parse(stored) }
        : DEFAULT_PROFILE_PREFERENCES;
    } catch {
      return DEFAULT_PROFILE_PREFERENCES;
    }
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
  }, [preferences]);

  return [preferences, setPreferences];
}
