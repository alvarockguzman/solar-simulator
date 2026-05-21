"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { polygon as turfPolygon } from "@turf/helpers";
import area from "@turf/area";
import { useWizard } from "../context/WizardContext";
import { DrawingInstructions } from "./DrawingInstructions";
import { ManualSurfaceModal } from "./ManualSurfaceModal";
import { getSurfaceEstimate } from "../lib/surfaceEstimate";
import type { SurfacePoint } from "./MapSurface";

const MapSurface = dynamic(
  () => import("./MapSurface").then((m) => m.MapSurface),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full w-full items-center justify-center rounded-r-xl bg-stone-200">
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
  const [points, setPoints] = useState<SurfacePoint[]>([]);
  const [areaConfirmed, setAreaConfirmed] = useState(surfaceM2 > 0);
  const [manualEntry, setManualEntry] = useState(false);
  const [showManualModal, setShowManualModal] = useState(false);

  const mapClosed = areaConfirmed;

  useEffect(() => {
    if (surfaceM2 > 0) {
      setAreaConfirmed(true);
    }
  }, [surfaceM2]);

  const handleAddPoint = useCallback((lat: number, lng: number) => {
    setPoints((prev) => [...prev, [lat, lng]]);
  }, []);

  const handleConfirmArea = useCallback(() => {
    if (points.length < 4) return;
    const ring = [...points, points[0]];
    const coords = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
    const poly = turfPolygon([coords]);
    const areaM2 = area(poly);
    setSurfaceM2(areaM2);
    setManualEntry(false);
    setAreaConfirmed(true);
  }, [points, setSurfaceM2]);

  const handleManualConfirm = useCallback(
    (m2: number) => {
      setPoints([]);
      setManualEntry(true);
      setSurfaceM2(m2);
      setAreaConfirmed(true);
      setShowManualModal(false);
    },
    [setSurfaceM2]
  );

  const handleReset = useCallback(() => {
    setPoints([]);
    setManualEntry(false);
    setAreaConfirmed(false);
    setSurfaceM2(0);
  }, [setSurfaceM2]);

  const estimate =
    areaConfirmed && surfaceM2 > 0 ? getSurfaceEstimate(surfaceM2) : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
      <div className="flex flex-col justify-center bg-gradient-to-br from-amber-500 to-orange-600 px-8 py-8 lg:w-2/5 lg:min-h-0">
        <h2 className="text-2xl font-bold text-white">Superficie disponible</h2>
        <p className="mt-2 text-sm text-amber-100">Dibujá el área en el mapa.</p>
        <div className="mt-6 h-1.5 w-full max-w-[200px] rounded-full bg-amber-300/50">
          <div
            className="h-full rounded-full bg-white transition-all duration-300"
            style={{ width: `${((stepIndex + 1) / 6) * 100}%` }}
          />
        </div>
        <p className="mt-2 text-sm text-white/90">Paso {stepIndex + 1}/6</p>
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="flex shrink-0 flex-col justify-center overflow-auto bg-white px-6 py-6 lg:px-8 lg:py-8">
          <h3 className="mb-4 text-lg font-semibold text-stone-800">
            Dibujá el área disponible para tu instalación solar
          </h3>

          {!areaConfirmed ? (
            <>
              <DrawingInstructions />
              <button
                type="button"
                onClick={() => setShowManualModal(true)}
                className="mt-4 text-left text-sm font-medium text-amber-700 underline decoration-amber-700/40 underline-offset-2 transition-colors hover:text-amber-800 hover:decoration-amber-800"
              >
                ¿Preferís ingresar la superficie manualmente?
              </button>
            </>
          ) : estimate ? (
            <p className="text-sm leading-relaxed text-stone-800">
              <span className="font-semibold text-stone-900">
                Superficie estimada: {estimate.surfaceM2} m²
              </span>
              {" — "}
              equivalente a ~{estimate.panels} paneles de {estimate.panelPowerW}W
              (≈ {estimate.kwp} kWp si fuera 100% utilizable).
            </p>
          ) : null}

          {areaConfirmed && manualEntry && (
            <p className="mt-2 text-xs text-stone-500">
              Superficie ingresada manualmente.
            </p>
          )}

          <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
            <button
              type="button"
              onClick={onBack}
              className="rounded-xl border-2 border-amber-600 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Atrás
            </button>
            {!areaConfirmed ? (
              <button
                type="button"
                onClick={handleConfirmArea}
                disabled={points.length < 4}
                className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Confirmar área
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border-2 border-amber-600 bg-white px-6 py-3 font-semibold text-amber-700 transition-colors hover:bg-amber-50 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                {manualEntry ? "Cambiar superficie" : "Dibujar de nuevo"}
              </button>
            )}
            {areaConfirmed && (
              <button
                type="button"
                onClick={onNext}
                className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md transition-colors hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
              >
                Siguiente
              </button>
            )}
          </div>
        </div>
        <div className="min-h-[280px] flex-1 lg:min-h-0 lg:min-w-0">
          <MapSurface
            center={center}
            points={points}
            closed={mapClosed}
            onAddPoint={handleAddPoint}
            className="h-full min-h-[280px] lg:min-h-0"
          />
        </div>
      </div>

      <ManualSurfaceModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirm={handleManualConfirm}
      />
    </div>
  );
}
