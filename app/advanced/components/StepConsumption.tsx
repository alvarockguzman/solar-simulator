"use client";

import { useState } from "react";
import { useWizard } from "../context/WizardContext";
import { WizardNav } from "./WizardNav";

interface StepConsumptionProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  loadingLabel?: string;
}

export function StepConsumption({ stepIndex, onBack, onNext, isLoading = false, nextLabel = "Siguiente", loadingLabel = "..." }: StepConsumptionProps) {
  const { consumptionKwhPerYear, setConsumptionKwhPerYear } = useWizard();
  const [localValue, setLocalValue] = useState(
    consumptionKwhPerYear > 0 ? String(consumptionKwhPerYear) : ""
  );

  const num = localValue.trim() === "" ? 0 : Number(localValue);
  const canNext = !Number.isNaN(num) && num > 0;

  const handleNext = () => {
    if (canNext) {
      setConsumptionKwhPerYear(num);
      onNext();
    }
  };

  return (
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Consumo de energía</h2>
        <p className="mt-2 text-amber-100 text-sm">¿Cuánta energía consumís al año?</p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex flex-1 flex-col justify-center px-6 py-8 lg:px-12 bg-white overflow-auto">
        <h3 className="text-lg font-semibold text-stone-800 mb-4">
          Ingresá tu consumo anual de energía (kWh)
        </h3>
        <div className="flex items-center gap-2 max-w-md flex-wrap">
          <input
            type="number"
            min={1}
            value={localValue}
            onChange={(e) => setLocalValue(e.target.value)}
            placeholder="Ej. 50000"
            className="flex-1 min-w-[140px] rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            aria-label="Consumo anual en kWh"
          />
          <span className="text-stone-500 text-sm">kWh</span>
        </div>
        <p className="mt-3 text-sm text-stone-600 max-w-md">
          Si no lo sabés, podés ingresar un número orientativo para obtener una estimación.
        </p>
        <WizardNav onBack={onBack} onNext={handleNext} canGoNext={canNext} isLoading={isLoading} nextLabel={nextLabel} loadingLabel={loadingLabel} />
      </div>
    </div>
  );
}
