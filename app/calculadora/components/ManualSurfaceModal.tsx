"use client";

import { useEffect, useId, useState } from "react";
import { useBrand } from "@/app/lib/BrandContext";
import { nexoBtnPrimary, nexoBtnSecondary } from "./wizardButtons";

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
  const isNexo = useBrand().id === "nexo";
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
        <h2 id={titleId} className={isNexo ? "text-lg font-bold text-brand-primary" : "text-lg font-semibold text-brand-ink"}>
          Superficie manual
        </h2>
        <p className="mt-2 text-sm text-brand-body-soft">
          Ingresá la superficie disponible en metros cuadrados. Podés estimarla
          con planos o mediciones del techo o terreno.
        </p>
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label
              htmlFor="manual-surface-m2"
              className="block text-sm font-medium text-brand-body"
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
              className="mt-1 w-full rounded-lg border border-brand-line-strong px-3 py-2.5 text-brand-ink focus:border-brand-accent focus:outline-none focus:ring-2 focus:ring-brand-accent/30"
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
              className={
                isNexo
                  ? nexoBtnSecondary
                  : "rounded-lg border border-brand-line-strong px-4 py-2.5 text-sm font-medium text-brand-body hover:bg-brand-surface"
              }
            >
              Cancelar
            </button>
            <button
              type="submit"
              className={
                isNexo
                  ? nexoBtnPrimary
                  : "rounded-lg bg-brand-accent px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-accent-dark focus:outline-none focus:ring-2 focus:ring-brand-accent focus:ring-offset-2"
              }
            >
              Guardar superficie
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
