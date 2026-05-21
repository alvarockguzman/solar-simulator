export type TariffId = "T1" | "T2" | "T3";

export const TARIFF_LABELS: Record<TariffId, string> = {
  T1: "T1 – Pequeña Demanda",
  T2: "T2 – Mediana Demanda",
  T3: "T3 – Gran Demanda",
};

export const TOTAL_STEPS = 6; // Intro, Address, Surface, Tariff, Consumption, Results (form is modal)
