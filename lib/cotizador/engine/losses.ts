import type { ClippingPoint, Parametros, SystemLosses } from "../types";

/**
 * Pérdidas del sistema, parametrizadas y combinadas multiplicativamente:
 *   total = 1 − Π(1 − li)
 * El total (en %) es lo que se pasa a PVGIS como parámetro `loss`, en
 * reemplazo del 14% fijo histórico.
 */

/**
 * Pérdida por clipping en función del load ratio DC/AC, interpolando
 * linealmente sobre la curva de Parametros. Por debajo del primer punto la
 * pérdida es 0; por encima del último se mantiene el último valor.
 */
export function clippingLoss(loadRatio: number, curve: ClippingPoint[]): number {
  if (curve.length === 0) return 0;
  if (loadRatio <= curve[0][0]) return loadRatio < curve[0][0] ? 0 : curve[0][1];
  const last = curve[curve.length - 1];
  if (loadRatio >= last[0]) return last[1];
  for (let i = 0; i < curve.length - 1; i++) {
    const [r0, l0] = curve[i];
    const [r1, l1] = curve[i + 1];
    if (loadRatio >= r0 && loadRatio <= r1) {
      const t = (loadRatio - r0) / (r1 - r0);
      return l0 + t * (l1 - l0);
    }
  }
  return last[1];
}

export interface SystemLossesInput {
  /** Eficiencia europea del inversor seleccionado (fracción, ej. 0.98). */
  eficienciaEuroInversor: number;
  /** Load ratio DC/AC del sistema. */
  loadRatio: number;
  /** Override de sombra del sitio (%, null = default de Parametros). */
  sombraPctSitio?: number | null;
}

export function systemLosses(params: Parametros, input: SystemLossesInput): SystemLosses {
  const sombra = (input.sombraPctSitio ?? params.sombraPct) / 100;
  const losses = {
    sombra,
    soiling: params.soilingPct / 100,
    mismatch: params.mismatchPct / 100,
    dcWiring: params.dcWiringPct / 100,
    clipping: clippingLoss(input.loadRatio, params.clippingCurve),
    inversor: 1 - input.eficienciaEuroInversor,
    ac: params.acPct / 100,
  };
  const total =
    1 -
    Object.values(losses).reduce((acc, l) => acc * (1 - l), 1);
  return { ...losses, total };
}
