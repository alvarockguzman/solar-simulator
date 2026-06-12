/** Presets rápidos del wizard (UX pre-dimensionamiento). */

export type KwpPresetId = "pequeno" | "mediano" | "grande";
export type ConsumoPresetId = "pequeno" | "mediano" | "grande";
export type TarifaNivel = "T1" | "T2" | "T3";

export const KWP_PRESETS: {
  id: KwpPresetId;
  title: string;
  kwp: number;
  subtitle: string;
}[] = [
  { id: "pequeno", title: "Pequeño", kwp: 25, subtitle: "25 kWp" },
  { id: "mediano", title: "Mediano", kwp: 75, subtitle: "75 kWp" },
  { id: "grande", title: "Grande", kwp: 150, subtitle: "150 kWp" },
];

/** Consumo mensual promedio orientativo (industria / comercial AR). */
export const CONSUMO_PRESETS: {
  id: ConsumoPresetId;
  title: string;
  promedioKwh: number;
  subtitle: string;
}[] = [
  {
    id: "pequeno",
    title: "Pequeño",
    promedioKwh: 12_000,
    subtitle: "~12.000 kWh/mes · comercio / PYME",
  },
  {
    id: "mediano",
    title: "Mediano",
    promedioKwh: 40_000,
    subtitle: "~40.000 kWh/mes · industria chica",
  },
  {
    id: "grande",
    title: "Grande",
    promedioKwh: 120_000,
    subtitle: "~120.000 kWh/mes · industria",
  },
];

/**
 * Tarifas argentinas simplificadas (USD/kWh referencia para comparar en reporte).
 * T1: residencial / baja demanda · T2: comercial e industrial BT (default) · T3: MT / gran demanda.
 */
export const TARIFA_NIVELES: {
  id: TarifaNivel;
  title: string;
  subtitle: string;
  usdKwh: number;
}[] = [
  { id: "T1", title: "T1", subtitle: "Residencial / baja tensión", usdKwh: 0.095 },
  { id: "T2", title: "T2", subtitle: "Comercial e industrial BT", usdKwh: 0.117 },
  { id: "T3", title: "T3", subtitle: "Media tensión / gran demanda", usdKwh: 0.085 },
];

export function tarifaUsdForNivel(nivel: TarifaNivel): number {
  return TARIFA_NIVELES.find((t) => t.id === nivel)?.usdKwh ?? 0.117;
}

export function matchKwpPreset(kwp: number | null | undefined): KwpPresetId | null {
  if (kwp == null) return null;
  const found = KWP_PRESETS.find((p) => p.kwp === kwp);
  return found?.id ?? null;
}

export function matchConsumoPreset(promedioKwh: number): ConsumoPresetId | null {
  const found = CONSUMO_PRESETS.find((p) => p.promedioKwh === promedioKwh);
  return found?.id ?? null;
}
