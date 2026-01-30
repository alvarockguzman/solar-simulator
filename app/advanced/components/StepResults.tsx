"use client";

import { useWizard } from "../context/WizardContext";
import {
  formatKwp,
  formatKwhPerYear,
  formatUsd,
  formatPayback,
  type CalculationResult,
} from "../lib/calculations";

interface StepResultsProps {
  results: CalculationResult;
  stepIndex: number;
  onBack: () => void;
  onRequestQuote: () => void;
}

export function StepResults({ results, stepIndex, onBack, onRequestQuote }: StepResultsProps) {
  return (
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Tu instalación a medida</h2>
        <p className="mt-2 text-amber-100 text-sm">
          Revisá los resultados y solicitá un presupuesto.
        </p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div className="h-full w-full rounded-full bg-white" />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-12 bg-white overflow-auto">
        <h3 className="text-lg font-semibold text-stone-800 mb-6">
          Tu instalación solar a medida
        </h3>
        <div className="rounded-2xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 shadow-sm max-w-xl">
          <div className="grid gap-4 sm:grid-cols-2">
            <ResultItem
              label="Potencia estimada"
              value={formatKwp(results.powerKwp)}
            />
            <ResultItem
              label="Energía producida por año"
              value={formatKwhPerYear(results.energyKwhPerYear)}
            />
            <ResultItem
              label="Ahorro anual estimado"
              value={`${formatUsd(results.savingsUsdPerYear)}/año`}
            />
            <ResultItem
              label="Repago estimado"
              value={formatPayback(results.paybackYears)}
            />
          </div>
        </div>
        <div className="mt-6 flex flex-wrap gap-4">
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl border-2 border-amber-600 px-6 py-3 font-semibold text-amber-700 bg-white hover:bg-amber-50 transition-colors"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={onRequestQuote}
            className="rounded-xl bg-amber-500 px-8 py-3 font-semibold text-white shadow-md hover:bg-amber-600 transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
          >
            Solicitar presupuesto
          </button>
        </div>
      </div>
    </div>
  );
}

function ResultItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-white/80 p-4 shadow-sm">
      <p className="text-xs font-medium text-stone-500">{label}</p>
      <p className="font-semibold text-stone-900">{value}</p>
    </div>
  );
}
