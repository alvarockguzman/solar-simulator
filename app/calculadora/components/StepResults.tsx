"use client";

import { useWizard } from "../context/WizardContext";
import { TARIFF_LABELS } from "../lib/constants";
import { WizardStepBanner } from "./WizardStepBanner";
import { WizardStepLayout } from "./WizardStepLayout";
import { wizardBtnPrimary, wizardBtnSecondary } from "./wizardButtons";
import {
  formatKwp,
  formatPayback,
  formatUsd,
  savingsAccumulatedLifetime,
  co2AvoidedTonsPerYear,
  KWP_PER_M2,
  KWH_PER_KWP_YEAR,
  CAPEX_USD_PER_KWP,
  OPEX_USD_PER_KWP_YEAR,
  CO2_KG_PER_KWH,
  PROJECT_LIFETIME_YEARS,
  type CalculationResult,
} from "../lib/calculations";

interface StepResultsProps {
  results: CalculationResult;
  stepIndex: number;
  onBack: () => void;
  onRequestQuote: () => void;
}

function formatEnergyKwh(value: number): string {
  return Math.round(value).toLocaleString("es-AR");
}

function formatCo2Tons(value: number): string {
  return `${Math.round(value).toLocaleString("es-AR")} t`;
}

export function StepResults({
  results,
  stepIndex,
  onBack,
  onRequestQuote,
}: StepResultsProps) {
  const { tariff } = useWizard();
  const accumulated = savingsAccumulatedLifetime(results.savingsUsdPerYear);
  const co2Tons = co2AvoidedTonsPerYear(results.energyKwhPerYear);
  const tariffLabel = tariff ? TARIFF_LABELS[tariff] : "—";

  return (
    <WizardStepLayout
      className="renovatio-results-enter"
      banner={
        <WizardStepBanner
          stepIndex={stepIndex}
          title="Tu instalación a medida"
          subtitle="Revisá los resultados y solicitá un presupuesto."
        />
      }
    >
      <div className="mx-auto w-full max-w-3xl">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-stone-500">
            Tu instalación solar a medida
          </h3>

          {/* Hero: ahorro anual */}
          <section
            className="mt-4 rounded-2xl border border-stone-200 bg-gradient-to-br from-brand-cream/60 to-white p-6 shadow-sm sm:p-8"
            aria-labelledby="hero-savings-title"
          >
            <p
              id="hero-savings-title"
              className="text-xs font-semibold uppercase tracking-wider text-brand-muted"
            >
              Ahorro anual estimado
            </p>
            <p className="mt-3 font-bold tabular-nums text-brand-navy text-4xl sm:text-5xl">
              {formatUsd(results.savingsUsdPerYear)}
              <span className="text-2xl font-semibold text-brand-navy/80 sm:text-3xl">
                {" "}
                / año
              </span>
            </p>
            <p className="mt-2 text-sm text-stone-600 sm:text-base">
              ≈ {formatUsd(accumulated)} acumulados a {PROJECT_LIFETIME_YEARS}{" "}
              años
            </p>
          </section>

          {/* Sub-KPIs */}
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
            <SubKpi
              label="Potencia"
              value={formatKwp(results.powerKwp)}
            />
            <SubKpi
              label="Energía"
              value={formatEnergyKwh(results.energyKwhPerYear)}
              subValue="kWh/año"
            />
            <SubKpi
              label="Repago"
              value={formatPayback(results.paybackYears)}
              subValue="Vida útil 25-30"
            />
            <SubKpi
              label="CO₂ evitado"
              value={formatCo2Tons(co2Tons)}
              subValue="/ año"
            />
          </div>

          {/* Supuestos */}
          <details className="group mt-8 rounded-xl border border-stone-200 bg-stone-50/80">
            <summary className="cursor-pointer list-none px-4 py-3 text-sm font-medium text-stone-700 transition-colors hover:text-stone-900 [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2">
                <span
                  className="text-stone-400 transition-transform group-open:rotate-180"
                  aria-hidden
                >
                  ▼
                </span>
                Supuestos del cálculo
              </span>
            </summary>
            <ul className="space-y-2 border-t border-stone-200 px-4 py-4 text-sm text-stone-600">
              <li>
                Densidad de potencia: {KWP_PER_M2} kWp/m² de superficie
                utilizable.
              </li>
              <li>
                Generación: {KWH_PER_KWP_YEAR.toLocaleString("es-AR")} kWh/kWp·año.
              </li>
              <li>Tarifa de referencia: {tariffLabel}.</li>
              <li>
                Inversión estimada: {formatUsd(results.investmentUsd)} (CAPEX{" "}
                {CAPEX_USD_PER_KWP.toLocaleString("es-AR")} USD/kWp).
              </li>
              <li>
                OPEX anual: {formatUsd(results.opexUsdPerYear)} (
                {OPEX_USD_PER_KWP_YEAR} USD/kWp·año).
              </li>
              <li>
                Repago: inversión ÷ flujo neto anual (ahorro − OPEX), cuando el
                flujo es positivo.
              </li>
              <li>
                CO₂ evitado: {CO2_KG_PER_KWH} kg/kWh generado (equivalente red).
              </li>
              <li>
                Ahorro acumulado a {PROJECT_LIFETIME_YEARS} años: ahorro anual
                × {PROJECT_LIFETIME_YEARS} (sin actualización).
              </li>
            </ul>
          </details>

          <p className="mt-4 text-xs text-stone-500">
            Valores orientativos; un presupuesto personalizado puede ajustar
            supuestos y dimensionamiento.
          </p>

          <div className="mt-8 flex flex-wrap gap-4">
            <button type="button" onClick={onBack} className={wizardBtnSecondary}>
              Atrás
            </button>
            <button
              type="button"
              onClick={onRequestQuote}
              className={`inline-flex items-center gap-2 ${wizardBtnPrimary} px-8`}
            >
              Solicitar presupuesto personalizado
              <span aria-hidden>→</span>
            </button>
          </div>
      </div>
    </WizardStepLayout>
  );
}

function SubKpi({
  label,
  value,
  subValue,
}: {
  label: string;
  value: string;
  subValue?: string;
}) {
  return (
    <div className="rounded-xl border border-stone-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-medium uppercase tracking-wide text-brand-muted">
        {label}
      </p>
      <p className="mt-1 font-bold tabular-nums text-brand-navy text-xl sm:text-2xl">
        {value}
      </p>
      {subValue && (
        <p className="mt-0.5 text-xs text-stone-500 sm:text-sm">{subValue}</p>
      )}
    </div>
  );
}
