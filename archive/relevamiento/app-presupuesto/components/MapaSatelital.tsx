"use client";

import { useEffect } from "react";
import { MapContainer, TileLayer, Polygon, CircleMarker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";

function SetView({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.setView([center.lat, center.lng], map.getZoom());
  }, [center.lat, center.lng, map]);
  return null;
}

export type SurfacePoint = [number, number];

interface MapaSatelitalProps {
  center: { lat: number; lng: number };
  points: SurfacePoint[];
  closed: boolean;
  onAddPoint: (lat: number, lng: number) => void;
  zoom?: number;
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

export function MapaSatelital({
  center,
  points,
  closed,
  onAddPoint,
  zoom = 18,
  className = "",
}: MapaSatelitalProps) {
  const latLngs: [number, number][] =
    closed && points.length >= 3 ? [...points, points[0]] : points;

  return (
    <div className={`relative w-full h-full ${className}`} style={{ cursor: "crosshair", minHeight: 280 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={zoom}
        className="h-full w-full rounded-xl min-h-[280px]"
        scrollWheelZoom
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
        <SetView center={center} />
        <MapClickHandler disabled={closed} onAddPoint={onAddPoint} />
      </MapContainer>
    </div>
  );
}
