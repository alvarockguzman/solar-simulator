"use client";

import { useRef } from "react";
import { useRelevamiento } from "../context/RelevamientoContext";
import type { MaterialTecho } from "../context/RelevamientoContext";

const MATERIALES: { id: MaterialTecho; label: string }[] = [
  { id: "Chapa", label: "Chapa" },
  { id: "Teja", label: "Teja" },
  { id: "Losa", label: "Losa" },
  { id: "Suelo", label: "Suelo" },
];

interface Step3TechoProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step3Techo({ onBack, onNext }: Step3TechoProps) {
  const { material, setMaterial, fotoTechoFile, fotoTechoPreview, setFotoTecho, fotoObstaculosFile, fotoObstaculosPreview, setFotoObstaculos } = useRelevamiento();
  const inputTechoRef = useRef<HTMLInputElement>(null);
  const inputObstaculosRef = useRef<HTMLInputElement>(null);

  const handleTecho = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setFotoTecho(null, null);
    setFotoTecho(file, URL.createObjectURL(file));
  };
  const handleObstaculos = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return setFotoObstaculos(null, null);
    setFotoObstaculos(file, URL.createObjectURL(file));
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          Fotos del techo y material
        </h2>

        <p className="text-stone-600 text-sm mb-3">Material del techo</p>
        <div className="flex flex-wrap gap-2 mb-4">
          {MATERIALES.map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setMaterial(m.id)}
              className={`rounded-xl px-4 py-2 text-sm font-medium border-2 transition-colors ${
                material === m.id
                  ? "border-amber-500 bg-amber-50 text-amber-800"
                  : "border-stone-200 text-stone-600 hover:border-stone-300"
              }`}
            >
              {m.label}
            </button>
          ))}
        </div>

        <p className="text-stone-600 text-sm mb-2">Saca la foto con el sol a tus espaldas. Muestra chimeneas, tanques o árboles que puedan dar sombra.</p>

        <div className="space-y-4">
          <div>
            <input ref={inputTechoRef} type="file" accept="image/*" capture="environment" onChange={handleTecho} className="hidden" />
            <button
              type="button"
              onClick={() => inputTechoRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/50 py-4 px-4 text-amber-700 font-medium hover:bg-amber-50"
            >
              {fotoTechoFile ? "Cambiar: Foto General del Techo" : "Foto General del Techo"}
            </button>
            {fotoTechoPreview && (
              <img src={fotoTechoPreview} alt="Techo" className="mt-2 max-h-32 rounded-lg border border-stone-200" />
            )}
          </div>
          <div>
            <input ref={inputObstaculosRef} type="file" accept="image/*" capture="environment" onChange={handleObstaculos} className="hidden" />
            <button
              type="button"
              onClick={() => inputObstaculosRef.current?.click()}
              className="w-full rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/50 py-4 px-4 text-amber-700 font-medium hover:bg-amber-50"
            >
              {fotoObstaculosFile ? "Cambiar: Foto de Obstáculos" : "Foto de Obstáculos"}
            </button>
            {fotoObstaculosPreview && (
              <img src={fotoObstaculosPreview} alt="Obstáculos" className="mt-2 max-h-32 rounded-lg border border-stone-200" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
