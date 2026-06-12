import type {
  Catalog,
  ConsumoInput,
  Panel,
  SizingResult,
  TechoInput,
} from "../types";

/**
 * Dimensionamiento del sistema:
 *   area_util     = Σ áreas_polígonos × packing (fracción del área bruta
 *                   que ocupan los módulos, incluye pasillos/separación)
 *   kwp_max_techo = paneles que entran en el área útil × potencia del panel
 *   kwp_objetivo  = consumo_anual × %autoconsumo_objetivo / yield
 *   kwp_sistema   = min(kwp_max_techo, kwp_objetivo); sin datos de consumo,
 *                   se dimensiona solo por techo.
 */

export function pickPanel(catalog: Catalog, modelo: string | null): Panel {
  const activos = catalog.paneles.filter((p) => p.activo);
  if (activos.length === 0) {
    throw new Error("No hay paneles activos en el catálogo de precios.");
  }
  if (modelo) {
    const found = activos.find((p) => p.modelo === modelo);
    if (found) return found;
  }
  return [...activos].sort((a, b) => {
    const usdWpA = a.precioUsd / a.wp;
    const usdWpB = b.precioUsd / b.wp;
    if (usdWpA !== usdWpB) return usdWpA - usdWpB;
    return b.wp - a.wp;
  })[0];
}

/** Packing default por tipo de techo según Parametros. */
export function packingForTecho(catalog: Catalog, tipoTecho: TechoInput["tipoTecho"]): number {
  const p = catalog.parametros;
  switch (tipoTecho) {
    case "plano":
      return p.packingPlano;
    case "inclinado":
      return p.packingInclinado;
    case "serrucho":
      return p.packingSerrucho;
  }
}

export function consumoAnualKwh(consumo: ConsumoInput): number {
  return consumo.mensualKwh.reduce((acc, v) => acc + v, 0);
}

export function computeSizing(
  techo: TechoInput,
  consumo: ConsumoInput,
  catalog: Catalog,
  yieldKwhPerKwpYear: number,
  panelModelo: string | null
): SizingResult {
  const params = catalog.parametros;
  const panel = pickPanel(catalog, panelModelo);

  const areaBrutaM2 = techo.areasM2.reduce((acc, a) => acc + a, 0);
  // factorAprovechamiento del input = packing (editable en el wizard,
  // precargado con el default por tipo de techo del catálogo).
  const areaUtilM2 = areaBrutaM2 * techo.factorAprovechamiento;

  const areaPorPanelM2 = panel.largoM * panel.anchoM;
  const nPanelesMax = areaUtilM2 > 0 ? Math.floor(areaUtilM2 / areaPorPanelM2) : 0;
  const kwpMaxTecho = (nPanelesMax * panel.wp) / 1000;

  const kwpManual = techo.kwpDeseado ?? 0;
  if (kwpManual > 0) {
    const nPaneles = Math.max(1, Math.round((kwpManual * 1000) / panel.wp));
    const kwpSistema = (nPaneles * panel.wp) / 1000;
    return {
      areaBrutaM2,
      areaUtilM2,
      kwpMaxTecho,
      kwpObjetivo: kwpManual,
      kwpSistema,
      nPaneles,
      panel,
      limitadoPor: "potencia",
    };
  }

  const anual = consumoAnualKwh(consumo);
  // Sin datos de consumo (anual = 0) se dimensiona solo por techo.
  const kwpObjetivo =
    yieldKwhPerKwpYear > 0 && anual > 0
      ? (anual * params.autoconsumoObjetivo) / yieldKwhPerKwpYear
      : Infinity;

  const limitadoPor: SizingResult["limitadoPor"] =
    kwpMaxTecho <= kwpObjetivo ? "techo" : "consumo";

  // Redondeo a paneles enteros (aprox. de "string completo").
  const nPaneles =
    limitadoPor === "techo"
      ? nPanelesMax
      : Math.max(1, Math.floor((kwpObjetivo * 1000) / panel.wp));

  const kwpSistema = (nPaneles * panel.wp) / 1000;

  return {
    areaBrutaM2,
    areaUtilM2,
    kwpMaxTecho,
    // Sin consumo cargado, el objetivo reportado es el máximo del techo.
    kwpObjetivo: Number.isFinite(kwpObjetivo) ? kwpObjetivo : kwpMaxTecho,
    kwpSistema,
    nPaneles,
    panel,
    limitadoPor,
  };
}
