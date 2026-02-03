"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { polygon as turfPolygon } from "@turf/helpers";
import area from "@turf/area";
import { useRelevamiento } from "../context/RelevamientoContext";
import { reverseGeocode } from "../lib/geocode";
import type { SurfacePoint } from "./MapaSatelital";

const MapaSatelital = dynamic(
  () => import("./MapaSatelital").then((m) => m.MapaSatelital),
  {
    ssr: false,
    loading: () => (
      <div className="h-full w-full bg-stone-200 flex items-center justify-center rounded-xl min-h-[280px]">
        Cargando mapa…
      </div>
    ),
  }
);

const DEFAULT_CENTER = { lat: -34.6037, lng: -58.3816 };
const ZOOM_TECHOS = 19;

interface Step2MapaProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step2Mapa({ onBack, onNext }: Step2MapaProps) {
  const { address, center: ctxCenter, setMapData, setAddressOnly } = useRelevamiento();
  const center = ctxCenter ?? DEFAULT_CENTER;
  const [points, setPoints] = useState<SurfacePoint[]>([]);
  const [closed, setClosed] = useState(false);
  const [surfaceM2, setSurfaceM2] = useState(0);
  const [reverseLoading, setReverseLoading] = useState(false);

  useEffect(() => {
    if (points.length >= 3 && !closed) {
      const ring = [...points, points[0]];
      const coords = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
      const poly = turfPolygon([coords]);
      setSurfaceM2(area(poly));
    } else if (points.length < 3) {
      setSurfaceM2(0);
    }
  }, [points, closed]);

  const handleAddPoint = useCallback(
    async (lat: number, lng: number) => {
      setPoints((prev) => [...prev, [lat, lng]]);
      setReverseLoading(true);
      try {
        const addr = await reverseGeocode(lat, lng);
        if (addr) setAddressOnly(addr);
      } finally {
        setReverseLoading(false);
      }
    },
    [setAddressOnly]
  );

  const handleConfirmArea = useCallback(() => {
    if (points.length < 3) return;
    const ring = [...points, points[0]];
    const coords = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
    const poly = turfPolygon([coords]);
    const areaM2 = area(poly);
    setSurfaceM2(areaM2);
    setClosed(true);
    setMapData(points, center, areaM2);
  }, [points, center, setMapData]);

  const handleReset = useCallback(() => {
    setPoints([]);
    setClosed(false);
    setSurfaceM2(0);
    setMapData([], center, 0);
  }, [center, setMapData]);

  const canNext = surfaceM2 > 0;

  return (
    <div className="flex-1 flex flex-col min-h-0">
      <div className="flex-1 flex flex-col min-h-0 p-4 gap-4 overflow-auto">
        <div className="shrink-0 rounded-xl border border-stone-200 bg-white p-3">
          <p className="text-xs font-medium text-stone-500 mb-1">Dirección</p>
          <p className="text-stone-800 font-medium break-words">{address || "—"}</p>
          {reverseLoading && <p className="text-xs text-amber-600 mt-1">Actualizando dirección…</p>}
        </div>

        <div className="relative w-full h-[320px] rounded-xl overflow-hidden border border-stone-200 bg-stone-200">
          <MapaSatelital
            center={center}
            points={points}
            closed={closed}
            onAddPoint={handleAddPoint}
            zoom={ZOOM_TECHOS}
            className="absolute inset-0 w-full h-full"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 shadow-md px-3 py-2 text-sm text-stone-700 border border-stone-200 pointer-events-none">
            📍 Toca las esquinas de tu techo para marcar el área donde quieres los paneles.
          </div>
        </div>

        <div className="shrink-0 bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-stone-700 font-medium">
            Superficie detectada: {Math.round(surfaceM2)} m²
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            {!closed ? (
              <button
                type="button"
                onClick={handleConfirmArea}
                disabled={points.length < 3}
                className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Confirmar área
              </button>
            ) : (
              <button
                type="button"
                onClick={handleReset}
                className="rounded-xl border-2 border-amber-600 px-4 py-2 text-sm font-semibold text-amber-700"
              >
                Dibujar de nuevo
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="shrink-0 p-4 border-t border-stone-200 bg-white flex flex-wrap gap-3 justify-center">
        <button
          type="button"
          onClick={onBack}
          className="rounded-xl border-2 border-amber-600 px-6 py-3 font-semibold text-amber-700 bg-white hover:bg-amber-50"
        >
          Atrás
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Siguiente
        </button>
      </div>
    </div>
  );
}
