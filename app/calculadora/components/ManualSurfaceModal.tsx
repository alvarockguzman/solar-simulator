"use client";

import { useEffect, useId, useState } from "react";

interface ManualSurfaceModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (surfaceM2: number) => void;
}

export function ManualSurfaceModal({
  open,
  onClose,
  onConfirm,
}: ManualSurfaceModalProps) {
  const titleId = useId();
  const [value, setValue] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setValue("");
      setError(null);
    }
  }, [open]);

  if (!open) return null;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = Number(value.replace(",", "."));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError("Ingresá un valor mayor a 0 m².");
      return;
    }
    onConfirm(parsed);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id={titleId} className="text-lg font-semibold text-stone-900">
          Superficie manual
        </h2>
        <p className="mt-2 text-sm text-stone-600">
          Ingresá la superficie disponible en metros cuadrados. Podés estimarla
          con planos o mediciones del techo o terreno.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="manual-surface-m2"
              className="block text-sm font-medium text-stone-700"
            >
              Superficie (m²)
            </label>
            <input
              id="manual-surface-m2"
              type="number"
              inputMode="decimal"
              min={1}
              step={1}
              value={value}
              onChange={(e) => {
                setValue(e.target.value);
                setError(null);
              }}
              className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2.5 text-stone-900 focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-500/30"
              placeholder="Ej. 261"
              autoFocus
            />
            {error && (
              <p className="mt-1.5 text-sm text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="rounded-lg bg-amber-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-amber-600 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:ring-offset-2"
            >
              Guardar superficie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
