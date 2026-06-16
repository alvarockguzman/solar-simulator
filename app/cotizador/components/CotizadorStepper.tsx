"use client";

import { Check } from "lucide-react";
import { useCotizador } from "../context/CotizadorContext";

const PASOS = ["Cliente", "Techo", "Consumo", "Equipos", "Economía", "Reporte"] as const;

export function CotizadorStepper() {
  const { state, dispatch } = useCotizador();
  const pasoActual = PASOS[state.step - 1] ?? PASOS[0];

  return (
    <nav
      aria-label="Pasos del cotizador"
      className="shrink-0 border-b border-slate-200 bg-white px-4 py-4 sm:px-8"
    >
      <p className="mx-auto mb-2 max-w-3xl text-center text-xs font-medium text-amber-700 sm:hidden">
        Paso {state.step}: {pasoActual}
      </p>
      <ol className="mx-auto flex max-w-4xl items-center">
        {PASOS.map((paso, i) => {
          const n = i + 1;
          const activo = state.step === n;
          const completado = state.step > n;
          const habilitado =
            n < state.step ||
            (n === 4 &&
              state.result !== null &&
              state.catalog !== null &&
              !state.needsRecalc) ||
            (n === 5 &&
              state.result !== null &&
              state.catalog !== null &&
              !state.needsRecalc) ||
            (n === 6 && state.report !== null && !state.needsRecalc);
          const ultimo = i === PASOS.length - 1;

          return (
            <li key={paso} className={`flex items-center ${ultimo ? "" : "flex-1"}`}>
              <button
                type="button"
                onClick={() => habilitado && dispatch({ type: "GO_STEP", step: n })}
                disabled={!habilitado && !activo}
                className={`group flex shrink-0 flex-col items-center gap-1.5 disabled:cursor-default ${
                  habilitado || activo ? "cursor-pointer" : "cursor-not-allowed"
                }`}
              >
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 text-sm font-semibold transition ${
                    activo
                      ? "border-amber-600 bg-amber-600 text-white shadow-md shadow-amber-600/25"
                      : completado
                      ? "border-amber-600 bg-amber-50 text-amber-600 group-hover:bg-amber-100"
                      : "border-slate-200 bg-white text-slate-400"
                  }`}
                >
                  {completado ? <Check className="h-4 w-4 stroke-[2.5]" /> : n}
                </span>
                <span
                  className={`hidden text-[11px] font-medium sm:block ${
                    activo
                      ? "text-amber-700"
                      : completado
                      ? "text-slate-600 group-hover:text-amber-700"
                      : "text-slate-400"
                  }`}
                >
                  {paso}
                </span>
              </button>
              {!ultimo && (
                <div
                  className={`mx-1 h-0.5 flex-1 rounded-full transition sm:mx-2 ${
                    completado ? "bg-amber-500" : "bg-slate-200"
                  }`}
                  aria-hidden
                />
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
