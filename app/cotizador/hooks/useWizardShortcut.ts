"use client";

import { useEffect } from "react";

/** Ctrl+Enter / Cmd+Enter para avanzar en el wizard. */
export function useWizardShortcut(onAction: () => void, enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
        e.preventDefault();
        onAction();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onAction, enabled]);
}
