"use client";

import { AlertTriangle, Info, Loader2 } from "lucide-react";
import type { QuoteWarning } from "@/lib/cotizador/types";
import {
  WARNING_STYLES,
  warningAction,
  warningActionLabel,
  warningSeverity,
  type WarningActionId,
} from "@/lib/cotizador/warnings";
import { useCotizador } from "../context/CotizadorContext";
import { usePvgisRetry } from "../hooks/usePvgisRetry";

export function QuoteWarningList({ warnings }: { warnings: QuoteWarning[] }) {
  const { dispatch } = useCotizador();
  const { retryPvgis, retrying } = usePvgisRetry();

  if (warnings.length === 0) return null;

  function runAction(actionId: WarningActionId) {
    switch (actionId) {
      case "auto_inversor":
        dispatch({
          type: "SET_AJUSTES",
          ajustes: { inversorModelo: null, lineasOverride: {} },
        });
        break;
      case "retry_pvgis":
        void retryPvgis();
        break;
      case "ir_distancia_tablero":
        dispatch({ type: "GO_STEP", step: 2, focusField: "distanciaTablero" });
        break;
    }
  }

  return (
    <div className="space-y-2">
      {warnings.map((w) => {
        const severity = warningSeverity(w.code);
        const styles = WARNING_STYLES[severity];
        const actionId = warningAction(w.code);
        const Icon = styles.Icon === "info" ? Info : AlertTriangle;

        return (
          <div
            key={w.code}
            className={`flex flex-wrap items-start gap-2 rounded-lg border px-3 py-2.5 text-sm ${styles.container}`}
          >
            <Icon className={`mt-0.5 h-4 w-4 shrink-0 ${styles.icon}`} />
            <p className="min-w-0 flex-1">{w.message}</p>
            {actionId && (
              <button
                type="button"
                onClick={() => runAction(actionId)}
                disabled={actionId === "retry_pvgis" && retrying}
                className={`shrink-0 rounded-md border px-2.5 py-1 text-xs font-medium transition hover:bg-white/60 disabled:opacity-60 ${
                  severity === "error"
                    ? "border-red-300 text-red-800"
                    : severity === "warning"
                      ? "border-amber-300 text-amber-900"
                      : "border-sky-200 text-sky-800"
                }`}
              >
                {actionId === "retry_pvgis" && retrying ? (
                  <span className="inline-flex items-center gap-1">
                    <Loader2 className="h-3 w-3 animate-spin" />
                    Reintentando…
                  </span>
                ) : (
                  warningActionLabel(actionId)
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
