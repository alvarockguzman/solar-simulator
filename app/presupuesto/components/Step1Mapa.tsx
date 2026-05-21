"use client";

import { useState, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { polygon as turfPolygon } from "@turf/helpers";
import area from "@turf/area";
import { useRelevamiento } from "../context/RelevamientoContext";
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

interface Step1MapaProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step1Mapa({ onBack, onNext }: Step1MapaProps) {
  const { center: ctxCenter, setMapData } = useRelevamiento();
  const [center, setCenter] = useState<{ lat: number; lng: number }>(ctxCenter ?? DEFAULT_CENTER);
  const [points, setPoints] = useState<SurfacePoint[]>([]);
  const [closed, setClosed] = useState(false);
  const [surfaceM2, setSurfaceM2] = useState(0);

  useEffect(() => {
    if (ctxCenter) setCenter(ctxCenter);
  }, [ctxCenter]);

  const handleUseLocation = useCallback(() => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setCenter({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => {}
    );
  }, []);

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

  const handleAddPoint = useCallback((lat: number, lng: number) => {
    setPoints((prev) => [...prev, [lat, lng]]);
  }, []);

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
      <div className="flex-1 flex flex-col min-h-0 p-4 gap-4">
        <div className="relative flex-1 min-h-[280px] rounded-xl overflow-hidden border border-stone-200">
          <MapaSatelital
            center={center}
            points={points}
            closed={closed}
            onAddPoint={handleAddPoint}
            className="absolute inset-0 h-full w-full"
          />
          <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 shadow-md px-3 py-2 text-sm text-stone-700 border border-stone-200">
            📍 Toca las esquinas de tu techo para marcar el área donde quieres los paneles.
          </div>
        </div>

        <div className="shrink-0 bg-white rounded-xl border border-stone-200 p-4">
          <p className="text-stone-700 font-medium">
            Superficie detectada: {Math.round(surfaceM2)} m²
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              type="button"
              onClick={handleUseLocation}
              className="rounded-xl border border-stone-300 px-3 py-2 text-sm font-medium text-stone-600 hover:bg-stone-50"
            >
              Usar mi ubicación
            </button>
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
    </div>
  );
}

export function Step1MapaPlaceholder() {
  return (
    <div className="flex-1 flex flex-col p-4">
      <p className="text-stone-600">Paso 1: Mapa (próximamente)</p>
    </div>
  );
}
