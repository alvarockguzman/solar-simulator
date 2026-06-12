/** Margen de capacidad sobre potencia objetivo para semáforo verde. */
export const TECHO_MARGEN_KWP = 1.15;

export type TechoSemaforoEstado = "verde" | "amarillo" | "rojo";

export interface TechoSemaforoResult {
  estado: TechoSemaforoEstado;
  kwpMaxTecho: number;
  kwpObjetivo: number;
  tienePoligonos: boolean;
  /** kWp que faltan cuando estado === rojo. */
  faltanteKwp: number | null;
  /** m² útiles adicionales estimados cuando estado === rojo. */
  faltanteM2Util: number | null;
  label: string;
}

/**
 * Semáforo de viabilidad del techo vs potencia manual del proyecto.
 * No dimensiona: solo valida si el polígono admite la potencia pedida.
 */
export function computeTechoSemaforo(
  kwpMaxTecho: number,
  kwpObjetivo: number,
  tienePoligonos: boolean,
  /** m² útiles del polígono (para estimar faltante en m²). */
  areaUtilM2 = 0,
  /** kWp por m² útil aproximado (panel wp / área panel). */
  kwpPorM2Util = 615 / 1000 / 2.7035
): TechoSemaforoResult {
  if (kwpObjetivo <= 0) {
    return {
      estado: "amarillo",
      kwpMaxTecho,
      kwpObjetivo,
      tienePoligonos,
      faltanteKwp: null,
      faltanteM2Util: null,
      label: "Indicá la potencia del proyecto",
    };
  }

  if (!tienePoligonos || kwpMaxTecho <= 0) {
    return {
      estado: "amarillo",
      kwpMaxTecho,
      kwpObjetivo,
      tienePoligonos,
      faltanteKwp: null,
      faltanteM2Util: null,
      label: "Sin verificar — dibujá el techo en el mapa",
    };
  }

  const umbralVerde = kwpObjetivo * TECHO_MARGEN_KWP;

  if (kwpMaxTecho >= umbralVerde) {
    return {
      estado: "verde",
      kwpMaxTecho,
      kwpObjetivo,
      tienePoligonos,
      faltanteKwp: null,
      faltanteM2Util: null,
      label: "Espacio suficiente (margen ≥ 15%)",
    };
  }

  if (kwpMaxTecho >= kwpObjetivo) {
    return {
      estado: "amarillo",
      kwpMaxTecho,
      kwpObjetivo,
      tienePoligonos,
      faltanteKwp: null,
      faltanteM2Util: null,
      label: "Entra justo — revisar obstáculos, sombras y pasillos",
    };
  }

  const faltanteKwp = Math.round((kwpObjetivo - kwpMaxTecho) * 10) / 10;
  const faltanteM2Util =
    kwpPorM2Util > 0
      ? Math.round((faltanteKwp / kwpPorM2Util) * 10) / 10
      : null;

  return {
    estado: "rojo",
    kwpMaxTecho,
    kwpObjetivo,
    tienePoligonos,
    faltanteKwp,
    faltanteM2Util,
    label: `No entra — faltan ~${faltanteKwp} kWp${faltanteM2Util ? ` (~${faltanteM2Util.toLocaleString("es-AR")} m² útiles)` : ""}`,
  };
}

/** Azimut UI desfavorable en hemisferio sur (cuadrante sur: 90°–270°). */
export function orientacionDesfavorableSur(azimutDeg: number | null | undefined): boolean {
  if (azimutDeg == null) return false;
  const a = ((azimutDeg % 360) + 360) % 360;
  return a > 90 && a < 270;
}
