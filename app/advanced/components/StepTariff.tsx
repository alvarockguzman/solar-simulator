"use client";

import { useWizard } from "../context/WizardContext";
import { TARIFF_LABELS, type TariffId } from "../lib/constants";
import { WizardNav } from "./WizardNav";

interface StepTariffProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
}

export function StepTariff({ stepIndex, onBack, onNext }: StepTariffProps) {
  const { tariff, setTariff } = useWizard();
  const canNext = tariff !== null;

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
        <h3 className="text-lg font-semibold text-stone-800 mb-4">
          Seleccioná el tipo de tarifa eléctrica
        </h3>
        <select
          value={tariff ?? ""}
          onChange={(e) => {
            const v = e.target.value as TariffId | "";
            if (v) setTariff(v);
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
        </select>
        <WizardNav onBack={onBack} onNext={onNext} canGoNext={canNext} />
      </div>
    </div>
  );
}
