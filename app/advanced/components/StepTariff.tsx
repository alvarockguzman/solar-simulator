"use client";

import { useEffect, useRef, useState } from "react";
import { useWizard } from "../context/WizardContext";
import { TARIFF_LABELS, type TariffId } from "../lib/constants";
import { WizardNav } from "./WizardNav";

interface StepTariffProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
}

const UNKNOWN_TARIFF_VALUE = "__unknown";
const UNKNOWN_TARIFF_INTERNAL: TariffId = "T2";

export function StepTariff({ stepIndex, onBack, onNext }: StepTariffProps) {
  const { tariff, setTariff } = useWizard();
  const [selection, setSelection] = useState<string>(tariff ?? "");
  const [showUnknownInfo, setShowUnknownInfo] = useState(selection === UNKNOWN_TARIFF_VALUE);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const canNext = tariff !== null;

  useEffect(() => {
    setSelection(tariff ?? "");
  }, [tariff]);

  useEffect(() => {
    if (!tooltipOpen) return;
    function handleClickOutside(event: MouseEvent) {
      if (tooltipRef.current && !tooltipRef.current.contains(event.target as Node)) {
        setTooltipOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [tooltipOpen]);

  return (
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Tipo de tarifa eléctrica</h2>
        <p className="mt-2 text-amber-100 text-sm">Seleccioná el tipo de tarifa que tenés contratada.</p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-12 bg-white overflow-auto">
        <div className="mb-2 flex items-center gap-2">
          <h3 className="text-lg font-semibold text-stone-800">
            Seleccioná el tipo de tarifa eléctrica
          </h3>
          <div ref={tooltipRef} className="relative inline-flex">
            <button
              type="button"
              onClick={() => setTooltipOpen((prev) => !prev)}
              onMouseEnter={() => setTooltipOpen(true)}
              onMouseLeave={() => setTooltipOpen(false)}
              className="inline-flex h-5 w-5 items-center justify-center rounded-full border border-stone-300 bg-stone-50 text-[11px] text-stone-500 hover:bg-stone-100 hover:text-stone-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              aria-label="Dónde encontrar el tipo de tarifa"
            >
              i
            </button>
            {tooltipOpen && (
              <div className="absolute left-1/2 top-full z-10 mt-2 w-64 -translate-x-1/2 rounded-lg border border-stone-200 bg-white px-3 py-2 text-xs text-slate-700 shadow-lg">
                Podés encontrar este dato en la parte superior frontal de tu factura de energía.
              </div>
            )}
          </div>
        </div>
        <p className="mb-4 text-sm text-slate-600 leading-relaxed">
          Si no estás seguro, seleccioná la opción correspondiente o usá el promedio industrial estimado.
        </p>
        <select
          value={selection}
          onChange={(e) => {
            const v = e.target.value;
            if (v === UNKNOWN_TARIFF_VALUE) {
              setTariff(UNKNOWN_TARIFF_INTERNAL);
              setSelection(UNKNOWN_TARIFF_VALUE);
              setShowUnknownInfo(true);
              return;
            }
            const real = v as TariffId | "";
            if (real) {
              setTariff(real);
              setSelection(real);
              setShowUnknownInfo(false);
            } else {
              setTariff(null as unknown as TariffId | null);
              setSelection("");
              setShowUnknownInfo(false);
            }
          }}
          className="w-full max-w-md rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          aria-label="Tipo de tarifa"
        >
          <option value="">Elegir tarifa...</option>
          {(Object.entries(TARIFF_LABELS) as [TariffId, string][]).map(([id, label]) => (
            <option key={id} value={id}>
              {label}
            </option>
          ))}
          <option value={UNKNOWN_TARIFF_VALUE}>
            No conozco mi tarifa (Usar promedio industrial)
          </option>
        </select>
        {showUnknownInfo && (
          <p className="mt-2 max-w-md text-sm text-slate-600 leading-relaxed">
            Utilizaremos una tarifa estimada para los cálculos iniciales. Podrás ajustarla más adelante con un asesor.
          </p>
        )}
        <WizardNav onBack={onBack} onNext={onNext} canGoNext={canNext} />
      </div>
    </div>
  );
}
