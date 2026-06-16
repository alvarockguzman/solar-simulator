import type { Parametros, QuoteResult, ConsumoInput, PvgisResult } from "./types";
import { computeEconomics } from "./engine/economics";

/** Parámetros financieros editables en el paso Economía (además de consumo y ajustes). */
export interface EconomicsOverrides {
  tasaDescuento?: number | null;
  degradacionAnual?: number | null;
  escalacionTarifaReal?: number | null;
  opexUsdKwp?: number | null;
  co2KgKwh?: number | null;
}

export const ECONOMICS_HORIZONTE_ANOS = 25;

export function mergeEconomicsParams(
  base: Parametros,
  overrides?: EconomicsOverrides | null
): Parametros {
  if (!overrides) return base;
  return {
    ...base,
    ...(overrides.tasaDescuento != null ? { tasaDescuento: overrides.tasaDescuento } : {}),
    ...(overrides.degradacionAnual != null
      ? { degradacionAnual: overrides.degradacionAnual }
      : {}),
    ...(overrides.escalacionTarifaReal != null
      ? { escalacionTarifaReal: overrides.escalacionTarifaReal }
      : {}),
    ...(overrides.opexUsdKwp != null ? { opexUsdKwp: overrides.opexUsdKwp } : {}),
    ...(overrides.co2KgKwh != null ? { co2KgKwh: overrides.co2KgKwh } : {}),
  };
}

/** Recalcula solo economics sobre un quote ya dimensionado (BOM/CAPEX intactos). */
export function applyEconomicsToResult(
  result: QuoteResult,
  consumo: ConsumoInput,
  pvgis: PvgisResult,
  baseParams: Parametros,
  overrides?: EconomicsOverrides | null
): QuoteResult {
  const params = mergeEconomicsParams(baseParams, overrides);
  const economics = computeEconomics(
    result.sizing.kwpSistema,
    result.bom.capexUsd,
    consumo,
    pvgis,
    params
  );
  return { ...result, economics };
}
