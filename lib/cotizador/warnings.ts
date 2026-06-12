import type { QuoteWarning } from "./types";

export type WarningSeverity = "error" | "warning" | "info";

const SEVERITY_BY_CODE: Record<QuoteWarning["code"], WarningSeverity> = {
  sin_inversor: "error",
  strings_no_cierran: "error",
  load_ratio_fuera_rango: "warning",
  pvgis_fallback: "warning",
  supera_techo: "warning",
  precios_stale: "warning",
  techo_justo: "warning",
  potencia_manual: "info",
  limitado_por_techo: "info",
  limitado_por_consumo: "info",
  sin_distancia_tablero: "info",
  specs_estimadas: "info",
};

export function warningSeverity(code: QuoteWarning["code"]): WarningSeverity {
  return SEVERITY_BY_CODE[code] ?? "warning";
}

export const WARNING_STYLES: Record<
  WarningSeverity,
  { container: string; icon: string; Icon: "alert" | "info" }
> = {
  error: {
    container: "border-red-200 bg-red-50 text-red-800",
    icon: "text-red-600",
    Icon: "alert",
  },
  warning: {
    container: "border-amber-200 bg-amber-50 text-amber-900",
    icon: "text-amber-600",
    Icon: "alert",
  },
  info: {
    container: "border-slate-200 bg-slate-50 text-slate-700",
    icon: "text-sky-600",
    Icon: "info",
  },
};

export type WarningActionId =
  | "auto_inversor"
  | "retry_pvgis"
  | "ir_distancia_tablero";

export function warningAction(code: QuoteWarning["code"]): WarningActionId | null {
  switch (code) {
    case "load_ratio_fuera_rango":
      return "auto_inversor";
    case "pvgis_fallback":
      return "retry_pvgis";
    case "sin_distancia_tablero":
      return "ir_distancia_tablero";
    default:
      return null;
  }
}

export function warningActionLabel(actionId: WarningActionId): string {
  switch (actionId) {
    case "auto_inversor":
      return "Usar selección automática";
    case "retry_pvgis":
      return "Reintentar PVGIS";
    case "ir_distancia_tablero":
      return "Cargar distancia";
  }
}
