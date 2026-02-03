"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import { useParams } from "next/navigation";
import { MapaSoloLectura } from "../../components/MapaSoloLectura";

const MapaSoloLecturaDynamic = dynamic(
  () => import("../../components/MapaSoloLectura").then((m) => m.MapaSoloLectura),
  { ssr: false, loading: () => <div className="h-64 bg-stone-200 rounded-xl animate-pulse" /> }
);

interface RelevamientoItem {
  id: string;
  fecha: string;
  estado: string;
  address?: string;
  polygon: [number, number][];
  center: { lat: number; lng: number };
  surfaceM2: number;
  city: string | null;
  facturaUrl: string;
  material: string;
  fotoTechoUrl: string;
  fotoObstaculosUrl: string;
  fotoTableroUrl: string;
  cableado: string;
  distanciaTablero: string;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  telefono: string;
  notasAdmin: string | null;
}

const ESTADOS = ["Pendiente", "En Revisión", "Presupuestado"] as const;

export default function RelevamientoAdminDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const [item, setItem] = useState<RelevamientoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [estado, setEstado] = useState("");
  const [notas, setNotas] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const res = await fetch("/api/relevamiento", { credentials: "include" });
    if (!res.ok) {
      setItem(null);
      return;
    }
    const data: RelevamientoItem[] = await res.json();
    const found = data.find((r) => r.id === id);
    setItem(found ?? null);
    if (found) {
      setEstado(found.estado);
      setNotas(found.notasAdmin ?? "");
    }
  }, [id]);

  useEffect(() => {
    load().finally(() => setLoading(false));
  }, [load]);

  const handleSave = async () => {
    if (!id) return;
    setSaving(true);
    const res = await fetch("/api/relevamiento/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ id, estado, notas }),
    });
    setSaving(false);
    if (res.ok) {
      setItem((prev) => (prev ? { ...prev, estado, notasAdmin: notas } : null));
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-stone-500">Cargando…</p>
      </div>
    );
  }

  if (!item) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-4 gap-4">
        <p className="text-stone-600">Relevamiento no encontrado</p>
        <Link href="/relevamiento/admin" className="text-amber-600 hover:underline">
          Volver al listado
        </Link>
      </div>
    );
  }

  const photos = [
    { label: "Factura", url: item.facturaUrl },
    { label: "Techo", url: item.fotoTechoUrl },
    { label: "Obstáculos", url: item.fotoObstaculosUrl },
    { label: "Tablero", url: item.fotoTableroUrl },
  ].filter((p) => p.url && !p.url.startsWith("https://placeholder"));

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto p-4 max-w-2xl mx-auto">
      <div className="flex items-center gap-4 mb-4">
        <Link href="/relevamiento/admin" className="text-amber-600 hover:underline font-medium">
          ← Listado
        </Link>
      </div>

      <div className="space-y-6">
        <div>
          <h1 className="text-xl font-bold text-stone-800">{item.nombre} {item.apellido}</h1>
          {item.empresa && <p className="text-stone-600 text-sm mt-1">{item.empresa}</p>}
          {item.address && (
            <p className="text-stone-600 text-sm mt-1">📍 {item.address}</p>
          )}
          <p className="text-stone-600 text-sm">
            {new Date(item.fecha).toLocaleString("es-AR")} · {item.email} · {item.telefono}
          </p>
        </div>

        <div className="h-64">
          <MapaSoloLecturaDynamic center={item.center} polygon={item.polygon} className="h-full" />
        </div>
        <p className="text-sm text-stone-600">Superficie: {Math.round(item.surfaceM2)} m² · Ciudad: {item.city ?? "—"}</p>

        <div>
          <h2 className="font-semibold text-stone-800 mb-2">Galería</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {photos.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => setLightboxUrl(p.url)}
                className="rounded-lg overflow-hidden border border-stone-200 aspect-square bg-stone-100 hover:ring-2 ring-amber-500"
              >
                <img src={p.url} alt={p.label} className="w-full h-full object-cover" />
                <span className="sr-only">{p.label}</span>
              </button>
            ))}
          </div>
          {photos.length === 0 && <p className="text-stone-500 text-sm">Sin fotos (o URLs placeholder)</p>}
        </div>

        <div>
          <label className="block font-semibold text-stone-800 mb-2">Estado</label>
          <select
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="w-full rounded-xl border border-stone-300 px-4 py-2"
          >
            {ESTADOS.map((e) => (
              <option key={e} value={e}>{e}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-semibold text-stone-800 mb-2">Notas internas</label>
          <textarea
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            rows={4}
            className="w-full rounded-xl border border-stone-300 px-4 py-3"
            placeholder="Notas del admin…"
          />
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
        >
          {saving ? "Guardando…" : "Guardar cambios"}
        </button>
      </div>

      {lightboxUrl && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setLightboxUrl(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === "Escape" && setLightboxUrl(null)}
          aria-label="Cerrar"
        >
          <img
            src={lightboxUrl}
            alt="Zoom"
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </div>
  );
}
