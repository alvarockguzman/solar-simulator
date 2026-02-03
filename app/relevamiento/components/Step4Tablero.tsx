"use client";

import { useRef } from "react";
import { useRelevamiento } from "../context/RelevamientoContext";
import type { Cableado, DistanciaTablero } from "../context/RelevamientoContext";

const CABLEADO_OPTS: { id: Cableado; label: string }[] = [
  { id: "Exterior", label: "Exterior / Cañerías vistas (Fácil)" },
  { id: "Interior", label: "Interior de paredes (Medio)" },
  { id: "Zanjas", label: "Requiere zanjas o perforar losas (Complejo)" },
];

const DISTANCIA_OPTS: { id: DistanciaTablero; label: string }[] = [
  { id: "< 10m", label: "< 10m" },
  { id: "10-25m", label: "10-25m" },
  { id: "> 25m", label: "> 25m" },
];

interface Step4TableroProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step4Tablero({ onBack, onNext }: Step4TableroProps) {
  const { fotoTableroFile, fotoTableroPreview, setFotoTablero, cableado, distanciaTablero, setConexion } = useRelevamiento();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setFotoTablero(null, null);
    setFotoTablero(file, URL.createObjectURL(file));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="p-4 max-w-lg mx-auto">
        <div className="rounded-xl bg-amber-100 border border-amber-400 px-4 py-3 mb-4">
          <p className="text-amber-900 font-semibold text-sm">
            ⚠️ IMPORTANTE: Saca la foto con la tapa abierta para identificar el espacio disponible.
          </p>
        </div>

        <h2 className="text-xl font-semibold text-stone-800 mb-2">Foto del tablero</h2>
        <p className="text-stone-600 text-sm mb-3">No toques ningún cable, solo necesitamos la foto del interior.</p>
        <input ref={inputRef} type="file" accept="image/*" capture="environment" onChange={handleFile} className="hidden" />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/50 py-4 px-4 text-amber-700 font-medium hover:bg-amber-50"
        >
          {fotoTableroFile ? "Cambiar foto del tablero" : "Subir foto del tablero"}
        </button>
        {fotoTableroPreview && (
          <img src={fotoTableroPreview} alt="Tablero" className="mt-2 max-h-40 rounded-lg border border-stone-200" />
        )}

        <div className="mt-6">
          <label className="block text-stone-700 font-medium text-sm mb-2">¿Por dónde viajarán los cables?</label>
          <select
            value={cableado ?? ""}
            onChange={(e) => {
              const c = e.target.value as Cableado;
              if (c) setConexion(c, distanciaTablero ?? "< 10m");
            }}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800"
          >
            <option value="">Seleccionar</option>
            {CABLEADO_OPTS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
        <div className="mt-4">
          <label className="block text-stone-700 font-medium text-sm mb-2">Distancia techo a tablero</label>
          <select
            value={distanciaTablero ?? ""}
            onChange={(e) => {
              const d = e.target.value as DistanciaTablero;
              if (d) setConexion(cableado ?? "Exterior", d);
            }}
            className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800"
          >
            <option value="">Seleccionar</option>
            {DISTANCIA_OPTS.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
