"use client";

import { useState } from "react";
import { useRelevamiento } from "../context/RelevamientoContext";
import { LoadingOverlay } from "../../components/LoadingOverlay";

const MIN_LOADING_MS = 700;

interface Step5ContactoProps {
  onBack: () => void;
  onNext: () => void;
  onSuccess?: () => void;
}

export function Step5Contacto({ onBack, onSuccess }: Step5ContactoProps) {
  const { nombre, apellido, empresa, email, telefono, setContacto, submit } = useRelevamiento();
  const [form, setForm] = useState({ nombre, apellido, empresa, email, telefono });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const start = Date.now();
    const result = await submit(form);
    const elapsed = Date.now() - start;
    if (elapsed < MIN_LOADING_MS) {
      await new Promise((r) => setTimeout(r, MIN_LOADING_MS - elapsed));
    }
    setLoading(false);
    if (result.error) {
      setError(result.error);
      return;
    }
    onSuccess?.();
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 overflow-auto" aria-busy={loading}>
      <form onSubmit={handleSubmit} className="p-4 max-w-lg mx-auto flex-1 flex flex-col">
        <h2 className="text-xl font-semibold text-stone-800 mb-4">Contacto</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-1">Nombre</label>
            <input
              type="text"
              required
              disabled={loading}
              value={form.nombre}
              onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Tu nombre"
            />
          </div>
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-1">Apellido</label>
            <input
              type="text"
              required
              disabled={loading}
              value={form.apellido}
              onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Tu apellido"
            />
          </div>
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-1">Empresa</label>
            <input
              type="text"
              required
              disabled={loading}
              value={form.empresa}
              onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="Nombre de la empresa"
            />
          </div>
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-1">Mail</label>
            <input
              type="email"
              required
              disabled={loading}
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="tu@email.com"
            />
          </div>
          <div>
            <label className="block text-stone-700 text-sm font-medium mb-1">Teléfono</label>
            <input
              type="tel"
              required
              disabled={loading}
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className="w-full rounded-xl border border-stone-300 px-4 py-3 text-stone-800 disabled:opacity-60 disabled:cursor-not-allowed"
              placeholder="+54 9 11 1234-5678"
            />
          </div>
        </div>
        {error && <p className="mt-3 text-red-600 text-sm">{error}</p>}
        <div className="relevamiento-nav-bar mt-6 pt-4 flex flex-wrap gap-3 justify-center border-t border-stone-200 bg-white -mx-4 px-4">
          <button type="button" onClick={onBack} disabled={loading} className="rounded-xl border-2 border-amber-600 px-6 py-3 font-semibold text-amber-700 bg-white hover:bg-amber-50 disabled:opacity-60 disabled:cursor-not-allowed">
            Atrás
          </button>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-amber-500 px-6 py-3 font-semibold text-white shadow-md hover:bg-amber-600 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Enviando…" : "ENVIAR A INGENIERÍA"}
          </button>
        </div>
      </form>

      <LoadingOverlay
        visible={loading}
        message="Enviando…"
        aria-label="Enviando relevamiento"
      />
    </div>
  );
}
