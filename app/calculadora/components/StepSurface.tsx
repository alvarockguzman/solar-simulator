"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { polygon as turfPolygon } from "@turf/helpers";
import area from "@turf/area";
import { useWizard } from "../context/WizardContext";
import { DrawingInstructions } from "./DrawingInstructions";
import { ManualSurfaceModal } from "./ManualSurfaceModal";
import { MapStepLayout, MAP_MIN_HEIGHT_CLASS } from "./MapStepLayout";
import { wizardBtnPrimary, wizardBtnSecondary } from "./wizardButtons";
import { getSurfaceEstimate } from "../lib/surfaceEstimate";
import type { SurfacePoint } from "./MapSurface";

const MapSurface = dynamic(
  () => import("./MapSurface").then((m) => m.MapSurface),
  {
    ssr: false,
    loading: () => (
      <div
        className={`flex h-full w-full items-center justify-center bg-stone-200 lg:rounded-r-xl ${MAP_MIN_HEIGHT_CLASS}`}
      >
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
    <>
      <MapStepLayout
        stepIndex={stepIndex}
        title="Superficie disponible"
        subtitle="Dibujá el área en el mapa."
        controls={
          <>
            <h3 className="mb-3 text-lg font-semibold text-stone-800">
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
                equivalente a ~{estimate.panels} paneles de {estimate.panelPowerW}W (≈{" "}
                {estimate.kwp} kWp si fuera 100% utilizable).
              </p>
            ) : null}

            {areaConfirmed && manualEntry && (
              <p className="mt-2 text-xs text-stone-500">Superficie ingresada manualmente.</p>
            )}

            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 sm:gap-4">
              <button type="button" onClick={onBack} className={wizardBtnSecondary}>
                Atrás
              </button>
              {!areaConfirmed ? (
                <button
                  type="button"
                  onClick={handleConfirmArea}
                  disabled={points.length < 4}
                  className={wizardBtnPrimary}
                >
                  Confirmar área
                </button>
              ) : (
                <button type="button" onClick={handleReset} className={wizardBtnSecondary}>
                  {manualEntry ? "Cambiar superficie" : "Dibujar de nuevo"}
                </button>
              )}
              {areaConfirmed && (
                <button type="button" onClick={onNext} className={wizardBtnPrimary}>
                  Siguiente
                </button>
              )}
            </div>
          </>
        }
        map={
          <MapSurface
            center={center}
            points={points}
            closed={mapClosed}
            onAddPoint={handleAddPoint}
            className={`h-full w-full ${MAP_MIN_HEIGHT_CLASS}`}
          />
        }
      />

      <ManualSurfaceModal
        open={showManualModal}
        onClose={() => setShowManualModal(false)}
        onConfirm={handleManualConfirm}
      />
    </>
  );
}
