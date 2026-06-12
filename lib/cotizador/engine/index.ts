import type {
  Catalog,
  PvgisResult,
  QuoteInput,
  QuoteResult,
  QuoteWarning,
  StringSizingResult,
  SystemLosses,
} from "../types";
import { computeTechoSemaforo } from "../techo-viabilidad";
import { computeBom } from "./bom";
import { computeEconomics } from "./economics";
import { stringSizing } from "./inverterSelect";
import { systemLosses } from "./losses";
import { computeSizing, consumoAnualKwh } from "./sizing";

export { computeSizing, pickPanel, packingForTecho, consumoAnualKwh } from "./sizing";
export { computeBom } from "./bom";
export {
  selectInverter,
  stringSizing,
  vocColdFactor,
  LOAD_RATIO_MIN,
  LOAD_RATIO_MAX,
} from "./inverterSelect";
export { systemLosses, clippingLoss } from "./losses";
export { computeEconomics, tir } from "./economics";
export { deriveProductionReport, pvgisAspectToUiAzimuth } from "./production";

/**
 * Orquestador del motor: dimensionamiento → BOM → economics.
 * Librería pura: sin React, sin Next, sin fetch. Testeable con vitest.
 */
export function quote(
  input: QuoteInput,
  catalog: Catalog,
  pvgis: PvgisResult
): QuoteResult {
  const warnings: QuoteWarning[] = [];

  const sizing = computeSizing(
    input.techo,
    input.consumo,
    catalog,
    pvgis.yieldKwhPerKwpYear,
    input.ajustes.panelModelo
  );

  const { bom, seleccion, warnings: bomWarnings } = computeBom(
    sizing,
    input.techo,
    catalog,
    input.ajustes
  );
  warnings.push(...bomWarnings);

  // Pérdidas parametrizadas del sistema (informativas en el resultado; el %
  // total ya fue aplicado por el caller como parámetro `loss` de PVGIS).
  const losses: SystemLosses = systemLosses(catalog.parametros, {
    eficienciaEuroInversor: seleccion?.combo[0]?.inversor.eficienciaEuro ?? 0.98,
    loadRatio: seleccion?.loadRatio ?? 1.2,
    sombraPctSitio: input.techo.sombraPct,
  });

  // String sizing contra el inversor seleccionado.
  let strings: StringSizingResult | null = null;
  const tmin = catalog.parametros.tminDisenoC;
  if (seleccion) {
    strings = stringSizing(
      sizing.nPaneles,
      sizing.panel,
      seleccion.combo[0].inversor,
      tmin
    );
    if (!strings) {
      warnings.push({
        code: "strings_no_cierran",
        message: `Con ${sizing.panel.modelo} (Voc ${sizing.panel.vocV} V) no entran ni 15 módulos por string en los ${seleccion.combo[0].inversor.vdcMaxV} V del inversor. Revisar panel/inversor.`,
      });
    }
  }

  const economics = computeEconomics(
    sizing.kwpSistema,
    bom.capexUsd,
    input.consumo,
    pvgis,
    catalog.parametros
  );

  if (pvgis.source === "fallback") {
    const msg =
      pvgis.fallbackOrigin === "project_cache"
        ? "PVGIS no respondió: se usó la última producción satelital guardada del proyecto. Validar antes de enviar."
        : "PVGIS no respondió: la producción se estimó con un yield genérico de 1400 kWh/kWp·año. Verificar antes de enviar la cotización.";
    warnings.push({ code: "pvgis_fallback", message: msg });
  }
  if (catalog.stale) {
    warnings.push({
      code: "precios_stale",
      message:
        "No se pudo refrescar el Sheet de precios: se está usando el último catálogo cacheado.",
    });
  }
  if (sizing.limitadoPor === "potencia") {
    warnings.push({
      code: "potencia_manual",
      message: `Sistema dimensionado por potencia indicada: ${sizing.kwpSistema.toFixed(1)} kWp.`,
    });
    const areaBruta = input.techo.areasM2.reduce((a, b) => a + b, 0);
    const panel = sizing.panel;
    const kwpPorM2Util = panel.wp / 1000 / (panel.largoM * panel.anchoM);
    const sem = computeTechoSemaforo(
      sizing.kwpMaxTecho,
      sizing.kwpSistema,
      areaBruta > 0,
      sizing.areaUtilM2,
      kwpPorM2Util
    );
    if (sem.estado === "rojo") {
      warnings.push({
        code: "supera_techo",
        message: `La potencia indicada (${sizing.kwpSistema.toFixed(1)} kWp) supera la capacidad estimada del techo (${sizing.kwpMaxTecho.toFixed(1)} kWp).${sem.faltanteKwp ? ` Faltan ~${sem.faltanteKwp} kWp.` : ""}`,
      });
    } else if (sem.estado === "amarillo") {
      warnings.push({
        code: "techo_justo",
        message: sem.tienePoligonos
          ? `El techo admite ${sizing.kwpMaxTecho.toFixed(1)} kWp — entra justo respecto de los ${sizing.kwpSistema.toFixed(1)} kWp pedidos. Revisar obstáculos y sombras.`
          : "Potencia indicada sin verificar: dibujá el techo en el mapa para validar capacidad.",
      });
    }
  } else if (sizing.limitadoPor === "techo") {
    const sinConsumo = consumoAnualKwh(input.consumo) <= 0;
    warnings.push({
      code: "limitado_por_techo",
      message: sinConsumo
        ? `Sistema dimensionado por techo disponible: ${sizing.kwpSistema.toFixed(1)} kWp (sin datos de consumo).`
        : `El techo limita el sistema a ${sizing.kwpSistema.toFixed(1)} kWp (el consumo justificaría ${sizing.kwpObjetivo.toFixed(1)} kWp).`,
    });
  } else {
    warnings.push({
      code: "limitado_por_consumo",
      message: `El sistema se dimensionó por consumo (${sizing.kwpSistema.toFixed(1)} kWp); el techo admitiría hasta ${sizing.kwpMaxTecho.toFixed(1)} kWp.`,
    });
  }

  if (sizing.panel.specsEstimadas) {
    warnings.push({
      code: "specs_estimadas",
      message: `El panel ${sizing.panel.marca} ${sizing.panel.modelo} usa Voc/Vmp estimados — validar string sizing con datasheet antes de emitir.`,
    });
  }

  return { sizing, bom, economics, pvgis, losses, strings, warnings };
}

/** Perfil mensual de fallback: estacionalizado simple para hemisferio sur. */
export const FALLBACK_MONTHLY_SHAPE = [
  0.105, 0.095, 0.09, 0.075, 0.065, 0.055, 0.06, 0.07, 0.08, 0.095, 0.1, 0.11,
];

export function fallbackPvgis(yieldKwhPerKwpYear = 1400): PvgisResult {
  return {
    yieldKwhPerKwpYear,
    monthlyKwhPerKwp: FALLBACK_MONTHLY_SHAPE.map((f) => f * yieldKwhPerKwpYear),
    irradiationKwhM2Year: null,
    monthlyIrradiationKwhM2: null,
    angleDeg: null,
    aspectDeg: null,
    angleOptimal: false,
    aspectOptimal: false,
    internalLosses: { lAoiPct: null, lSpecPct: null, lTgPct: null, lTotalPct: null },
    radiationDb: null,
    fallbackOrigin: "generic",
    source: "fallback",
  };
}

/** Reutiliza una respuesta PVGIS previa del proyecto cuando la API no responde. */
export function pvgisFromProjectCache(cached: PvgisResult): PvgisResult {
  return {
    ...cached,
    source: "fallback",
    fallbackOrigin: "project_cache",
  };
}
