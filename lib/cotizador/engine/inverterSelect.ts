import type { Inversor, Panel, StringSizingResult } from "../types";

/**
 * Selección de inversor por load ratio DC/AC (reemplaza a la búsqueda por
 * pares de bom.ts): N unidades IGUALES del mismo modelo (instalable y simple
 * de mantener), load ratio = kWp DC / kW AC total dentro de [1.10, 1.30],
 * minimizando costo. Si ningún modelo entra en rango, se devuelve el más
 * cercano al rango con `enRango: false` para que el motor genere un warning.
 */

export const LOAD_RATIO_MIN = 1.1;
export const LOAD_RATIO_MAX = 1.3;

export const MODULES_PER_STRING_MIN = 15;
export const MODULES_PER_STRING_MAX = 22;

/** factor = 1 + |betaVoc|/100 × (25 - tminDisenoC) */
export function vocColdFactor(panel: Panel, tminDisenoC: number): number {
  const beta = Math.abs(panel.betaVocPctC);
  return 1 + (beta / 100) * (25 - tminDisenoC);
}

export interface InverterSelection {
  combo: { inversor: Inversor; cantidad: number }[];
  kwAcTotal: number;
  costoUsd: number;
  loadRatio: number;
  /** false si se eligió por cercanía porque nada entraba en [1.10, 1.30]. */
  enRango: boolean;
}

export function selectInverter(
  kwpDc: number,
  inversores: Inversor[],
  forzadoModelo: string | null = null
): InverterSelection | null {
  const activos = inversores.filter((i) => i.activo);
  const candidatos = forzadoModelo
    ? activos.filter((i) => i.modelo === forzadoModelo)
    : activos;
  if (candidatos.length === 0 || kwpDc <= 0) return null;

  let bestEnRango: InverterSelection | null = null;
  let bestCercano: InverterSelection | null = null;

  for (const inv of candidatos) {
    const nMin = Math.max(1, Math.floor(kwpDc / LOAD_RATIO_MAX / inv.kwAc));
    const nMax = Math.max(1, Math.ceil(kwpDc / LOAD_RATIO_MIN / inv.kwAc));
    for (let n = nMin; n <= nMax; n++) {
      const kwAc = inv.kwAc * n;
      const loadRatio = kwpDc / kwAc;
      const sel: InverterSelection = {
        combo: [{ inversor: inv, cantidad: n }],
        kwAcTotal: kwAc,
        costoUsd: inv.precioUsd * n,
        loadRatio,
        enRango: loadRatio >= LOAD_RATIO_MIN && loadRatio <= LOAD_RATIO_MAX,
      };
      if (sel.enRango) {
        if (!bestEnRango || sel.costoUsd < bestEnRango.costoUsd) bestEnRango = sel;
      } else {
        const dist = (s: InverterSelection) =>
          Math.min(Math.abs(s.loadRatio - LOAD_RATIO_MIN), Math.abs(s.loadRatio - LOAD_RATIO_MAX));
        if (
          !bestCercano ||
          dist(sel) < dist(bestCercano) ||
          (dist(sel) === dist(bestCercano) && sel.costoUsd < bestCercano.costoUsd)
        ) {
          bestCercano = sel;
        }
      }
    }
  }

  return bestEnRango ?? bestCercano;
}

/**
 * String sizing: módulos en serie por string entre 15 y 22, verificando Voc
 * a temperatura de diseño. Devuelve null si ni siquiera 15 módulos entran.
 */
export function stringSizing(
  nPaneles: number,
  panel: Panel,
  inversor: Inversor,
  tminDisenoC = -10
): StringSizingResult | null {
  const coldFactor = vocColdFactor(panel, tminDisenoC);
  const nMaxTension = Math.floor(inversor.vdcMaxV / (panel.vocV * coldFactor));
  const mpsMax = Math.min(MODULES_PER_STRING_MAX, nMaxTension);
  if (mpsMax < MODULES_PER_STRING_MIN) return null;

  const build = (mps: number, exacto: boolean): StringSizingResult => ({
    nStrings: Math.ceil(nPaneles / mps),
    modulesPerString: mps,
    vocStringFrioV: Math.round(panel.vocV * mps * coldFactor * 10) / 10,
    exacto,
    tminDisenoC,
  });

  for (let mps = mpsMax; mps >= MODULES_PER_STRING_MIN; mps--) {
    if (nPaneles % mps === 0) return build(mps, true);
  }
  return build(mpsMax, false);
}
