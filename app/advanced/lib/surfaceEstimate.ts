import { KWP_PER_M2 } from "./calculations";

/** Referencia orientativa: ~2 m² de techo por panel estándar. */
const M2_PER_PANEL = 2;
const PANEL_POWER_W = 550;

export function getSurfaceEstimate(surfaceM2: number) {
  const kwp = surfaceM2 * KWP_PER_M2;
  const panels = Math.round(surfaceM2 / M2_PER_PANEL);

  return {
    surfaceM2: Math.round(surfaceM2),
    panels,
    kwp: Math.round(kwp),
    panelPowerW: PANEL_POWER_W,
  };
}
