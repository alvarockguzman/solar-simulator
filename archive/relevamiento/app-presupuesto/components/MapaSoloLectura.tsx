"use client";

import { MapContainer, TileLayer, Polygon } from "react-leaflet";
import "leaflet/dist/leaflet.css";

type SurfacePoint = [number, number];

interface MapaSoloLecturaProps {
  center: { lat: number; lng: number };
  polygon: SurfacePoint[];
  className?: string;
}

export function MapaSoloLectura({ center, polygon, className = "" }: MapaSoloLecturaProps) {
  const latLngs: [number, number][] = polygon.length >= 3 ? [...polygon, polygon[0]] : polygon;

  return (
    <div className={`rounded-xl overflow-hidden border border-stone-200 ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={18}
        className="h-full w-full"
        scrollWheelZoom
      >
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
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
      </MapContainer>
    </div>
  );
}
