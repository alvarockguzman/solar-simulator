"use client";

import { useEffect, useRef } from "react";
import {
  CircleMarker,
  MapContainer,
  Polygon,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import type { Poligono } from "../context/CotizadorContext";

import "leaflet/dist/leaflet.css";

/**
 * Mapa satelital para dibujar 1..n polígonos del techo.
 * Click agrega vértice; doble click cierra el polígono en curso.
 * Expone el contenedor por ref para capturar el snapshot (html2canvas).
 */

interface MapaTechoProps {
  center: { lat: number; lng: number };
  poligonos: Poligono[];
  drawingPoints: [number, number][];
  onAddPoint: (lat: number, lng: number) => void;
  onClosePolygon: () => void;
  containerRef?: React.RefObject<HTMLDivElement>;
  className?: string;
}

function ClickHandler({
  onAddPoint,
  onClosePolygon,
}: {
  onAddPoint: (lat: number, lng: number) => void;
  onClosePolygon: () => void;
}) {
  useMapEvents({
    click: (e) => onAddPoint(e.latlng.lat, e.latlng.lng),
    dblclick: (e) => {
      e.originalEvent.preventDefault();
      onClosePolygon();
    },
  });
  return null;
}

function FlyToCenter({ center }: { center: { lat: number; lng: number } }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo([center.lat, center.lng], 18, { duration: 0.4 });
    const id = window.setTimeout(() => map.invalidateSize(), 450);
    return () => window.clearTimeout(id);
  }, [map, center.lat, center.lng]);
  return null;
}

function DisableDoubleClickZoom() {
  const map = useMap();
  useEffect(() => {
    map.doubleClickZoom.disable();
  }, [map]);
  return null;
}

const COLORES = ["#ea580c", "#0ea5e9", "#22c55e", "#a855f7", "#eab308"];

export function MapaTecho({
  center,
  poligonos,
  drawingPoints,
  onAddPoint,
  onClosePolygon,
  containerRef,
  className = "",
}: MapaTechoProps) {
  const localRef = useRef<HTMLDivElement>(null);
  const ref = containerRef ?? localRef;

  return (
    <div ref={ref} className={`relative ${className}`}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={18}
        className="h-full w-full"
        scrollWheelZoom
        preferCanvas
      >
        <FlyToCenter center={center} />
        <DisableDoubleClickZoom />
        <TileLayer
          attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
          crossOrigin="anonymous"
        />
        {poligonos.map((poly, i) => (
          <Polygon
            key={poly.id}
            positions={[...poly.points, poly.points[0]]}
            pathOptions={{
              color: COLORES[i % COLORES.length],
              fillColor: COLORES[i % COLORES.length],
              fillOpacity: 0.35,
              weight: 2,
            }}
          />
        ))}
        {drawingPoints.map(([lat, lng], i) => (
          <CircleMarker
            key={i}
            center={[lat, lng]}
            radius={5}
            pathOptions={{ fillColor: "#ea580c", color: "#fff", weight: 2, fillOpacity: 1 }}
          />
        ))}
        {drawingPoints.length >= 2 && (
          <Polygon
            positions={drawingPoints}
            pathOptions={{
              color: "#ea580c",
              fillColor: "#f59e0b",
              fillOpacity: 0.2,
              weight: 2,
              dashArray: "6 6",
            }}
          />
        )}
        <ClickHandler onAddPoint={onAddPoint} onClosePolygon={onClosePolygon} />
      </MapContainer>
    </div>
  );
}
