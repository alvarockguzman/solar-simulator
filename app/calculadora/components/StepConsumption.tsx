"use client";

import { useState } from "react";
import { useWizard } from "../context/WizardContext";
import { WizardNav } from "./WizardNav";
import { WizardStepBanner } from "./WizardStepBanner";
import { WizardStepLayout } from "./WizardStepLayout";

interface StepConsumptionProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
  isLoading?: boolean;
  nextLabel?: string;
  loadingLabel?: string;
}

const PROFILE_PRESETS = [
  { id: "small", label: "Pequeño (Oficina/Local)", value: 15000 },
  { id: "medium", label: "Mediano (Taller/Pyme)", value: 50000 },
  { id: "large", label: "Grande (Industria)", value: 150000 },
] as const;

export function StepConsumption({
  stepIndex,
  onBack,
  onNext,
  isLoading = false,
  nextLabel = "Siguiente",
  loadingLabel = "...",
}: StepConsumptionProps) {
  const { consumptionKwhPerYear, setConsumptionKwhPerYear } = useWizard();
  const [localValue, setLocalValue] = useState(
    consumptionKwhPerYear > 0 ? String(consumptionKwhPerYear) : ""
  );
  const [showProfiles, setShowProfiles] = useState(false);

  const num = localValue.trim() === "" ? 0 : Number(localValue);
  const canNext = !Number.isNaN(num) && num > 0;

  const handleNext = () => {
    if (canNext) {
      setConsumptionKwhPerYear(num);
      onNext();
    }
  };

  const handlePresetClick = (value: number) => {
    setLocalValue(String(value));
  };

  return (
    <WizardStepLayout
      banner={
        <WizardStepBanner
          stepIndex={stepIndex}
          title="Consumo de energía"
          subtitle="¿Cuánta energía consumís al año?"
        />
      }
    >
      <h3 className="mb-4 text-lg font-semibold text-stone-800">
        Ingresá tu consumo anual de energía (kWh)
      </h3>
      <div className="flex max-w-md flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Ej. 50000"
          className="min-w-[140px] flex-1 rounded-xl border-2 border-stone-200 px-4 py-3 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          aria-label="Consumo anual en kWh"
        />
        <span className="text-sm text-stone-500">kWh</span>
      </div>
      <p className="mt-3 max-w-md text-sm text-stone-600">
        Si no lo sabés, podés ingresar un número orientativo para obtener una estimación.
      </p>
      <button
        type="button"
        onClick={() => setShowProfiles((prev) => !prev)}
        className="mt-3 inline-flex items-center rounded-lg px-1 text-sm font-medium text-amber-600 hover:text-amber-700 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
      >
        ¿No conocés tu consumo? Usar un estándar de industria
      </button>

      {showProfiles && (
        <div className="mt-4 max-w-xl space-y-3">
          <div className="flex flex-wrap gap-3">
            {PROFILE_PRESETS.map((preset) => {
              const isActive = num === preset.value;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => handlePresetClick(preset.value)}
                  className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
                    isActive
                      ? "border-amber-500 bg-amber-50 text-amber-700"
                      : "border-stone-200 bg-white text-stone-700 hover:border-amber-300 hover:bg-amber-50/60"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-amber-500" />
                  <span>{preset.label}</span>
                  <span className="text-xs text-stone-500">
                    {preset.value.toLocaleString("es-AR")} kWh
                  </span>
                </button>
              );
            })}
          </div>
          <p className="max-w-md text-xs leading-relaxed text-slate-600">
            Valores basados en promedios industriales de consumo anual. Podrás refinar este dato más
            adelante.
          </p>
        </div>
      )}

      <WizardNav
        onBack={onBack}
        onNext={handleNext}
        canGoNext={canNext}
        isLoading={isLoading}
        nextLabel={nextLabel}
        loadingLabel={loadingLabel}
      />
    </WizardStepLayout>
  );
}
