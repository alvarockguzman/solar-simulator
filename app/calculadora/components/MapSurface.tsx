"use client";

import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents } from "react-leaflet";

import "leaflet/dist/leaflet.css";

export type SurfacePoint = [number, number];

interface MapSurfaceProps {
  center: { lat: number; lng: number };
  points: SurfacePoint[];
  closed: boolean;
  onAddPoint: (lat: number, lng: number) => void;
  className?: string;
}

function MapClickHandler({
  disabled,
  onAddPoint,
}: {
  disabled: boolean;
  onAddPoint: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click: (e) => {
      if (!disabled) onAddPoint(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

export function MapSurface({ center, points, closed, onAddPoint, className = "" }: MapSurfaceProps) {
  const latLngs: [number, number][] =
    closed && points.length >= 3 ? [...points, points[0]] : points;

  return (
    <div className={`relative map-interactive ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={18}
        className="h-full w-full rounded-r-xl"
        scrollWheelZoom={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {points.length > 0 &&
          points.map(([lat, lng], i) => (
            <CircleMarker
              key={i}
              center={[lat, lng]}
              radius={6}
              pathOptions={{
                fillColor: "#ea580c",
                color: "#fff",
                weight: 2,
                fillOpacity: 1,
              }}
            />
          ))}
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
        <MapClickHandler disabled={closed} onAddPoint={onAddPoint} />
      </MapContainer>
    </div>
  );
}
