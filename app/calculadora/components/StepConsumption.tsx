"use client";

import { useState } from "react";
import { useBrand } from "@/app/lib/BrandContext";
import { useWizard } from "../context/WizardContext";
import { stepTitleClass } from "./wizardButtons";
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
  const isNexo = useBrand().id === "nexo";
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
      <h3 className={stepTitleClass(isNexo, "mb-4")}>
        Ingresá tu consumo anual de energía (kWh)
      </h3>
      <div className="flex max-w-md flex-wrap items-center gap-2">
        <input
          type="number"
          min={1}
          value={localValue}
          onChange={(e) => setLocalValue(e.target.value)}
          placeholder="Ej. 50000"
          className="min-w-[140px] flex-1 rounded-xl border-2 border-brand-line px-4 py-3 text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/20"
          aria-label="Consumo anual en kWh"
        />
        <span className="text-sm text-brand-caption">kWh</span>
      </div>
      <p className="mt-3 max-w-md text-sm text-brand-body-soft">
        Si no lo sabés, podés ingresar un número orientativo para obtener una estimación.
      </p>
      <button
        type="button"
        onClick={() => setShowProfiles((prev) => !prev)}
        className="mt-3 inline-flex items-center rounded-lg px-1 text-sm font-medium text-brand-accent-dark hover:text-brand-accent-deep focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
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
                      ? "border-brand-accent bg-brand-accent-wash text-brand-accent-deep"
                      : "border-brand-line bg-white text-brand-body hover:border-brand-accent-soft hover:bg-brand-accent-wash/60"
                  }`}
                >
                  <span className="h-2 w-2 rounded-full bg-brand-accent" />
                  <span>{preset.label}</span>
                  <span className="text-xs text-brand-caption">
                    {preset.value.toLocaleString("es-AR")} kWh
                  </span>
                </button>
              );
            })}
          </div>
          <p className="max-w-md text-xs leading-relaxed text-brand-slate">
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
