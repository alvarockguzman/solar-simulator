"use client";

import { useEffect, useRef } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const createIcon = () =>
  L.icon({
    iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
    iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
    shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    iconSize: [25, 41],
    iconAnchor: [12, 41],
  });

interface MapaDireccionProps {
  center: { lat: number; lng: number };
  marker: { lat: number; lng: number } | null;
  onMarkerChange: (lat: number, lng: number) => void;
  className?: string;
}

function MapClickHandler({ onMarkerChange }: { onMarkerChange: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onMarkerChange(e.latlng.lat, e.latlng.lng),
  });
  return null;
}

function FlyToMarker({ marker }: { marker: { lat: number; lng: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (marker) map.flyTo([marker.lat, marker.lng], 17, { duration: 0.5 });
  }, [map, marker?.lat, marker?.lng]);
  return null;
}

export function MapaDireccion({ center, marker, onMarkerChange, className = "" }: MapaDireccionProps) {
  const markerRef = useRef<L.Marker | null>(null);
  const mapCenter: [number, number] = marker ? [marker.lat, marker.lng] : [center.lat, center.lng];

  return (
    <div className={`relative rounded-xl overflow-hidden border border-stone-200 w-full h-full min-h-[200px] ${className}`} style={{ height: "100%" }}>
      <MapContainer center={mapCenter} zoom={17} className="h-full w-full min-h-[200px]" scrollWheelZoom>
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
        />
        {marker && (
          <Marker
            ref={markerRef}
            position={[marker.lat, marker.lng]}
            icon={createIcon()}
            eventHandlers={{
              dragend: () => {
                const m = markerRef.current;
                if (m) {
                  const latlng = m.getLatLng();
                  onMarkerChange(latlng.lat, latlng.lng);
                }
              },
            }}
            draggable
          />
        )}
        <FlyToMarker marker={marker} />
        <MapClickHandler onMarkerChange={onMarkerChange} />
      </MapContainer>
    </div>
  );
}
