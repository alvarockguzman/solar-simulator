"use client";

import dynamic from "next/dynamic";
import { useWizard } from "../context/WizardContext";
import { WizardNav } from "./WizardNav";

const MapSurface = dynamic(
  () => import("./MapSurface").then((m) => m.MapSurface),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-stone-200 flex items-center justify-center rounded-r-xl">
        Cargando mapa…
      </div>
    ),
  }
);

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };

interface StepSurfaceProps {
  stepIndex: number;
  onBack: () => void;
  onNext: () => void;
}

export function StepSurface({ stepIndex, onBack, onNext }: StepSurfaceProps) {
  const { surfaceM2, setSurfaceM2, coordinates } = useWizard();
  const center = coordinates ?? DEFAULT_CENTER;

  const handleAreaComplete = (areaM2: number) => {
    setSurfaceM2(areaM2);
  };

  const canNext = surfaceM2 > 0;

  return (
    <div className="flex flex-1 flex-col lg:flex-row min-h-0">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Superficie disponible</h2>
        <p className="mt-2 text-amber-100 text-sm">Dibujá el área en el mapa.</p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex flex-1 flex-col min-h-0 lg:flex-row">
        <div className="flex flex-col justify-center px-6 py-6 lg:py-8 lg:px-8 bg-white overflow-auto shrink-0">
          <h3 className="text-lg font-semibold text-stone-800 mb-4">
            Dibujá el área disponible para tu instalación solar
          </h3>
          {surfaceM2 > 0 && (
            <p className="text-amber-700 font-medium mb-4">
              Superficie estimada: {Math.round(surfaceM2)} m²
            </p>
          )}
          <WizardNav onBack={onBack} onNext={onNext} canGoNext={canNext} />
        </div>
        <div className="flex-1 min-h-[280px] lg:min-h-0 lg:min-w-0">
          <MapSurface
            center={center}
            onAreaComplete={handleAreaComplete}
            className="h-full min-h-[280px] lg:min-h-0"
          />
        </div>
      </div>
    </div>
  );
}
