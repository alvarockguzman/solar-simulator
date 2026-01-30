import type { TariffId } from "./constants";

// Constants (plan)
const KWP_PER_M2 = 0.2;
const CAPEX_USD_PER_KWP = 820;
const OPEX_USD_PER_KWP_YEAR = 13;
const KWH_PER_KWP_YEAR = 1459;

const TARIFF_USD_PER_KWH: Record<TariffId, number> = {
  T1: 0.08, // 0.080 USD/kWh
  T2: 0.049,
  T3_BT: 0.046,
  T3_MT: 0.046,
};

export interface CalculationInput {
  surfaceM2: number;
  tariff: TariffId;
  consumptionKwhPerYear: number;
}

export interface CalculationResult {
  powerKwp: number;
  energyKwhPerYear: number;
  energyUsedForSavingsKwh: number;
  tariffUsdPerKwh: number;
  savingsUsdPerYear: number;
  investmentUsd: number;
  opexUsdPerYear: number;
  netFlowUsdPerYear: number;
  paybackYears: number | null; // null when "No aplica"
}

export function calculate(input: CalculationInput): CalculationResult {
  const { surfaceM2, tariff, consumptionKwhPerYear } = input;
  const powerKwp = KWP_PER_M2 * surfaceM2;
  const energyKwhPerYear = powerKwp * KWH_PER_KWP_YEAR;
  const tariffUsdPerKwh = TARIFF_USD_PER_KWH[tariff];
  const energyUsedForSavingsKwh = Math.min(energyKwhPerYear, consumptionKwhPerYear);
  const savingsUsdPerYear = energyUsedForSavingsKwh * tariffUsdPerKwh;
  const investmentUsd = CAPEX_USD_PER_KWP * powerKwp;
  const opexUsdPerYear = OPEX_USD_PER_KWP_YEAR * powerKwp;
  const netFlowUsdPerYear = savingsUsdPerYear - opexUsdPerYear;

  let paybackYears: number | null = null;
  if (netFlowUsdPerYear > 0) {
    paybackYears = investmentUsd / netFlowUsdPerYear;
  }

  return {
    powerKwp,
    energyKwhPerYear,
    energyUsedForSavingsKwh,
    tariffUsdPerKwh,
    savingsUsdPerYear,
    investmentUsd,
    opexUsdPerYear,
    netFlowUsdPerYear,
    paybackYears,
  };
}

export function formatKwp(value: number): string {
  return `${value.toFixed(1)} kWp`;
}

export function formatKwhPerYear(value: number): string {
  return `${Math.round(value).toLocaleString("es-AR")} kWh/año`;
}

export function formatUsd(value: number): string {
  return `USD ${Math.round(value).toLocaleString("es-AR")}`;
}

export function formatPayback(years: number | null): string {
  if (years === null) return "No aplica";
  return `${years.toFixed(1)} años`;
}
