"use client";

import { useRef } from "react";
import { useRelevamiento } from "../context/RelevamientoContext";

interface Step2FacturaProps {
  onBack: () => void;
  onNext: () => void;
}

export function Step2Factura({ onBack, onNext }: Step2FacturaProps) {
  const { facturaFile, facturaPreview, setFactura } = useRelevamiento();
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setFactura(null, null);
      return;
    }
    const isImage = file.type.startsWith("image/");
    if (isImage) {
      const url = URL.createObjectURL(file);
      setFactura(file, url);
    } else {
      setFactura(file, null);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto">
      <div className="p-4 max-w-lg mx-auto">
        <h2 className="text-xl font-semibold text-stone-800 mb-2">
          Perfil energético
        </h2>
        <p className="text-stone-600 text-sm mb-4">
          Sube tu factura. Necesitamos ver el gráfico de consumo del último año.
        </p>

        <input
          ref={inputRef}
          type="file"
          accept=".pdf,image/jpeg,image/png,image/jpg"
          onChange={handleFile}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full rounded-xl border-2 border-dashed border-amber-500 bg-amber-50/50 py-6 px-4 text-amber-700 font-medium hover:bg-amber-50"
        >
          {facturaFile ? "Cambiar archivo" : "Elegir factura (PDF, JPG o PNG)"}
        </button>

        {facturaFile && (
          <div className="mt-4 p-4 rounded-xl border border-stone-200 bg-white">
            <p className="text-sm font-medium text-stone-700 mb-2">{facturaFile.name}</p>
            {facturaPreview ? (
              <img
                src={facturaPreview}
                alt="Vista previa factura"
                className="max-h-40 w-auto rounded-lg border border-stone-200"
              />
            ) : (
              <div className="flex items-center gap-2 text-stone-500 text-sm">
                <span className="text-2xl">📄</span> PDF cargado
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
