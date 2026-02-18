import { useEffect, useState } from "react";

export function useReorderMode() {
  const [isMobileLayout, setIsMobileLayout] = useState(() =>
    typeof window !== "undefined" ? window.matchMedia("(max-width: 720px)").matches : false
  );
  const [isReorderMode, setIsReorderMode] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const mediaQuery = window.matchMedia("(max-width: 720px)");
    const handleChange = (event) => setIsMobileLayout(event.matches);

    if (typeof mediaQuery.addEventListener === "function") {
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }

    mediaQuery.addListener(handleChange);
    return () => mediaQuery.removeListener(handleChange);
  }, []);

  const effectiveReorderMode = isMobileLayout ? isReorderMode : false;

  return {
    isMobileLayout,
    isReorderMode: effectiveReorderMode,
    setIsReorderMode,
    isReorderEnabled: !isMobileLayout || effectiveReorderMode,
  };
}
