"use client";

import { useState, useRef, useEffect } from "react";
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

const RESULT_ITEMS: Array<{
  key: string;
  label: string;
  tooltip: string;
  getValue: (r: CalculationResult) => string;
}> = [
  {
    key: "power",
    label: "Potencia estimada (kWp)",
    tooltip:
      "Es la capacidad instalada del sistema solar y define el tamaño del proyecto.",
    getValue: (r) => formatKwp(r.powerKwp),
  },
  {
    key: "energy",
    label: "Energía producida por año (kWh/año)",
    tooltip:
      "Es la cantidad de electricidad generada por el sistema solar en un año promedio. Puede utilizarse para consumo propio o, si existe un excedente, inyectarse a la red.",
    getValue: (r) => formatKwhPerYear(r.energyKwhPerYear),
  },
  {
    key: "savings",
    label: "Ahorro anual estimado (USD/año)",
    tooltip:
      "Es el ahorro estimado en tu factura eléctrica gracias a la energía solar generada, usando una tarifa promedio como referencia.",
    getValue: (r) => `${formatUsd(r.savingsUsdPerYear)}/año`,
  },
  {
    key: "payback",
    label: "Repago estimado (años)",
    tooltip:
      "Es el tiempo estimado para recuperar la inversión inicial, considerando el ahorro anual generado por la instalación.",
    getValue: (r) => formatPayback(r.paybackYears),
  },
];

export function StepResults({ results, stepIndex, onBack, onRequestQuote }: StepResultsProps) {
  return (
    <div className="renovatio-results-enter flex flex-1 flex-col lg:flex-row min-h-0" aria-busy="false">
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
            {RESULT_ITEMS.map((item) => (
              <ResultItem
                key={item.key}
                label={item.label}
                value={item.getValue(results)}
                tooltipText={item.tooltip}
              />
            ))}
          </div>
        </div>
        <p className="mt-4 text-sm text-stone-500 max-w-xl">
          Todos los valores son estimaciones orientativas y pueden ajustarse en un presupuesto personalizado.
        </p>
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

function ResultItem({
  label,
  value,
  tooltipText,
}: {
  label: string;
  value: string;
  tooltipText?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClickOutside(event: MouseEvent) {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  return (
    <div ref={ref} className="rounded-xl bg-white/80 p-4 shadow-sm relative">
      <p className="text-xs font-medium text-stone-500 flex items-center gap-1.5 flex-wrap">
        {label}
        {tooltipText && (
          <span className="relative inline-flex">
            <button
              type="button"
              onClick={() => setOpen((prev) => !prev)}
              onMouseEnter={() => setOpen(true)}
              onMouseLeave={() => setOpen(false)}
              className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-stone-300 bg-stone-100 text-stone-500 hover:bg-stone-200 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-1 text-[10px] font-normal leading-none"
              aria-label="Más información"
            >
              ⓘ
            </button>
            {open && (
              <span
                role="tooltip"
                className="absolute left-0 bottom-full z-10 mb-1.5 w-56 rounded-lg border border-stone-200 bg-white px-3 py-2 text-left text-xs font-normal text-stone-700 shadow-lg sm:left-1/2 sm:-translate-x-1/2 sm:w-64"
              >
                {tooltipText}
              </span>
            )}
          </span>
        )}
      </p>
      <p className="font-semibold text-stone-900 mt-0.5">{value}</p>
    </div>
  );
}
