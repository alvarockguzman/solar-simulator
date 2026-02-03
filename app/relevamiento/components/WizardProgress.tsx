"use client";

interface WizardProgressProps {
  currentStep: number;
  totalSteps: number;
}

export function WizardProgress({ currentStep, totalSteps }: WizardProgressProps) {
  const pct = totalSteps > 0 ? (currentStep / totalSteps) * 100 : 0;
  return (
    <div className="w-full px-4 py-3 bg-white border-b border-stone-200 shrink-0">
      <div className="max-w-md mx-auto">
        <div className="h-1.5 w-full rounded-full bg-stone-200 overflow-hidden">
          <div
            className="h-full rounded-full bg-amber-500 transition-all duration-300"
            style={{ width: `${pct}%` }}
          />
        </div>
        <p className="mt-1.5 text-xs text-stone-500 text-center">
          Paso {currentStep} de {totalSteps}
        </p>
      </div>
    </div>
  );
}
