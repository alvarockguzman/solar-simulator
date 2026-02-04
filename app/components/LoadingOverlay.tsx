"use client";

import { useEffect, useRef } from "react";

export interface LoadingOverlayProps {
  /** Si es false, no se renderiza nada */
  visible: boolean;
  /** Texto bajo el spinner (ej. "Abriendo…", "Calculando…") */
  message: string;
  /** Para accesibilidad: anuncio a lectores de pantalla */
  "aria-label"?: string;
}

export function LoadingOverlay({ visible, message, "aria-label": ariaLabel }: LoadingOverlayProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (visible && ref.current) {
      ref.current.focus({ preventScroll: true });
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      ref={ref}
      role="status"
      aria-label={ariaLabel ?? message}
      aria-busy="true"
      tabIndex={-1}
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-4 bg-stone-900/60 backdrop-blur-[2px]"
    >
      <div
        className="h-10 w-10 rounded-full border-2 border-amber-200 border-t-amber-500 renovatio-spinner"
        aria-hidden
      />
      <p className="text-sm font-medium text-white/95">{message}</p>
      <span className="sr-only">{message}</span>
    </div>
  );
}
