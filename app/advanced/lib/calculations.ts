import type { TariffId } from "./constants";

// Constantes obligatorias
const KWP_PER_M2 = 0.2;
const CAPEX_USD_PER_KWP = 1100;
const OPEX_USD_PER_KWP_YEAR = 18;
const KWH_PER_KWP_YEAR = 1550;

const TARIFF_USD_PER_KWH: Record<TariffId, number> = {
  T1: 0.12,
  T2: 0.09,
  T3: 0.08,
};

export interface CalculationInput {
  surfaceM2: number;
  tariff: TariffId;
  consumptionKwhPerYear: number;
}

export interface CalculationResult {
  powerKwp: number;
  energyKwhPerYear: number;
  tariffUsdPerKwh: number;
  savingsUsdPerYear: number;
  investmentUsd: number;
  opexUsdPerYear: number;
  netFlowUsdPerYear: number;
  paybackYears: number | null;
}

export function calculate(input: CalculationInput): CalculationResult {
  const { surfaceM2, tariff } = input;

  if (surfaceM2 <= 0) {
    return {
      powerKwp: 0,
      energyKwhPerYear: 0,
      tariffUsdPerKwh: TARIFF_USD_PER_KWH[tariff],
      savingsUsdPerYear: 0,
      investmentUsd: 0,
      opexUsdPerYear: 0,
      netFlowUsdPerYear: 0,
      paybackYears: null,
    };
  }

  const powerKwp = surfaceM2 * KWP_PER_M2;
  const energyKwhPerYear = powerKwp * KWH_PER_KWP_YEAR;
  const tariffUsdPerKwh = TARIFF_USD_PER_KWH[tariff];
  const savingsUsdPerYear = energyKwhPerYear * tariffUsdPerKwh;
  const investmentUsd = powerKwp * CAPEX_USD_PER_KWP;
  const opexUsdPerYear = powerKwp * OPEX_USD_PER_KWP_YEAR;
  const netFlowUsdPerYear = savingsUsdPerYear - opexUsdPerYear;

  let paybackYears: number | null = null;
  if (netFlowUsdPerYear > 0) {
    paybackYears = investmentUsd / netFlowUsdPerYear;
  }

  return {
    powerKwp,
    energyKwhPerYear,
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
