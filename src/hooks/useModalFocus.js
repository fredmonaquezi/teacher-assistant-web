import { useEffect, useRef } from "react";

export default function useModalFocus(onClose, busy) {
  const ref = useRef(null);
  useEffect(() => {
    const previous = document.activeElement;
    ref.current?.querySelector("input, button")?.focus();
    return () => previous?.focus();
  }, []);
  const onKeyDown = (event) => {
    if (event.key === "Escape") { event.stopPropagation(); if (!busy.current) onClose(); }
    if (event.key !== "Tab") return;
    const controls = [...ref.current.querySelectorAll("input, button, textarea, select, a[href]")].filter((item) => !item.disabled);
    const first = controls[0];
    const last = controls.at(-1);
    if (!first) event.preventDefault();
    else if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  };
  return { ref, onKeyDown };
}
