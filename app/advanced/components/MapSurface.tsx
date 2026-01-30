"use client";

import { useState, useCallback } from "react";
import { MapContainer, TileLayer, Polygon, useMapEvents } from "react-leaflet";
import { polygon as turfPolygon } from "@turf/helpers";
import area from "@turf/area";

import "leaflet/dist/leaflet.css";

interface MapSurfaceProps {
  center: { lat: number; lng: number };
  onAreaComplete: (areaM2: number) => void;
  className?: string;
}

function MapClickHandler({
  points,
  onAddPoint,
}: {
  points: [number, number][];
  onAddPoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      onAddPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapSurface({ center, onAreaComplete, className = "" }: MapSurfaceProps) {
  const [points, setPoints] = useState<[number, number][]>([]);
  const [closed, setClosed] = useState(false);

  const addPoint = useCallback((lat: number, lng: number) => {
    if (closed) return;
    setPoints((prev) => [...prev, [lat, lng]]);
  }, [closed]);

  const closePolygon = useCallback(() => {
    if (points.length < 3) return;
    const ring = [...points, points[0]];
    const coords = ring.map(([lat, lng]) => [lng, lat] as [number, number]);
    const poly = turfPolygon([coords]);
    const areaM2 = area(poly);
    setClosed(true);
    onAreaComplete(areaM2);
  }, [points, onAreaComplete]);

  const reset = useCallback(() => {
    setPoints([]);
    setClosed(false);
  }, []);

  const latLngs: [number, number][] = closed && points.length >= 3
    ? [...points, points[0]]
    : points;

  return (
    <div className={`relative ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={17}
        className="h-full w-full rounded-r-xl"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {latLngs.length >= 2 && (
          <Polygon
            positions={latLngs}
            pathOptions={{
              color: "#ea580c",
              fillColor: "#f59e0b",
              fillOpacity: 0.4,
              weight: 2,
            }}
          />
        )}
        <MapClickHandler points={points} onAddPoint={addPoint} />
      </MapContainer>
      <div className="absolute bottom-4 left-4 right-4 flex flex-wrap gap-2 z-[1000]">
        {!closed ? (
          <>
            <button
              type="button"
              onClick={closePolygon}
              disabled={points.length < 3}
              className="rounded-lg bg-amber-500 px-4 py-2 text-sm font-medium text-white shadow hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Cerrar polígono
            </button>
            <span className="self-center text-sm text-stone-600">
              {points.length < 3
                ? "Hacé click en el mapa para marcar los vértices del área."
                : `${points.length} puntos. Cerrar polígono para calcular el área.`}
            </span>
          </>
        ) : (
          <button
            type="button"
            onClick={reset}
            className="rounded-lg border-2 border-amber-600 px-4 py-2 text-sm font-medium text-amber-700 bg-white hover:bg-amber-50"
          >
            Dibujar de nuevo
          </button>
        )}
      </div>
    </div>
  );
}
