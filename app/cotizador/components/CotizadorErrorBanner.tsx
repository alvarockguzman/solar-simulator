"use client";

import { X } from "lucide-react";
import { useCotizador } from "../context/CotizadorContext";

export function CotizadorErrorBanner() {
  const { state, dispatch } = useCotizador();
  if (!state.error) return null;

  return (
    <div
      role="alert"
      className="flex shrink-0 items-start justify-between gap-3 border-b border-red-200 bg-red-50 px-4 py-2.5 sm:px-6"
    >
      <p className="flex-1 text-center text-sm text-red-800 sm:text-left">{state.error}</p>
      <button
        type="button"
        onClick={() => dispatch({ type: "SET_ERROR", error: null })}
        className="shrink-0 rounded p-1 text-red-600 hover:bg-red-100"
        aria-label="Cerrar mensaje de error"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
