export type TariffId = "T1" | "T2" | "T3_BT" | "T3_MT";

export const TARIFF_LABELS: Record<TariffId, string> = {
  T1: "T1 – Pequeña Demanda",
  T2: "T2 – Mediana Demanda",
  T3_BT: "T3 – Gran Demanda Baja Tensión",
  T3_MT: "T3 – Gran Demanda Media Tensión",
};

export const TOTAL_STEPS = 6; // Intro, Address, Surface, Tariff, Consumption, Results (form is modal)
