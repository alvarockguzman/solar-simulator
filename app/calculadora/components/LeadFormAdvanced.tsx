"use client";

import { useState } from "react";
import { useWizard } from "../context/WizardContext";
import type { CalculationResult } from "../lib/calculations";

interface LeadFormAdvancedProps {
  onClose: () => void;
  results?: CalculationResult | null;
}

interface FormData {
  nombre: string;
  apellido: string;
  empresa: string;
  mail: string;
  telefono: string;
}

export function LeadFormAdvanced({ onClose, results }: LeadFormAdvancedProps) {
  const wizard = useWizard();
  const [form, setForm] = useState<FormData>({
    nombre: "",
    apellido: "",
    empresa: "",
    mail: "",
    telefono: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/lead/advanced", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          source: "advanced",
          contact: {
            nombre: form.nombre,
            apellido: form.apellido,
            empresa: form.empresa,
            mail: form.mail,
            telefono: form.telefono || "",
          },
          wizard: {
            address: wizard.address,
            coordinates: wizard.coordinates,
            surfaceM2: wizard.surfaceM2,
            tariff: wizard.tariff,
            consumptionKwhPerYear: wizard.consumptionKwhPerYear,
          },
          results: results
            ? {
                powerKwp: results.powerKwp,
                energyKwhPerYear: results.energyKwhPerYear,
                savingsUsdPerYear: results.savingsUsdPerYear,
                paybackYears: results.paybackYears,
                investmentUsd: results.investmentUsd,
              }
            : null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Error al enviar");
      }
      setSent(true);
    } catch (err) {
      const rawMessage = err instanceof Error ? err.message : "";
      const message =
        rawMessage === "Failed to fetch"
          ? "No se pudo conectar con el servidor. Revisá que estés corriendo la app en local (npm run dev) y que en .env.local tengas LEAD_FORM_URL con la URL de tu Google Apps Script."
          : rawMessage || "No se pudo enviar. Revisá los datos o intentá más tarde.";
      setError(message);
    } finally {
      setSending(false);
    }
  };

  if (sent) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="rounded-2xl bg-white p-8 shadow-xl max-w-md">
          <p className="mb-4 text-lg font-medium text-stone-800">
            Gracias. Recibirás más información a la brevedad.
          </p>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg bg-amber-500 px-4 py-2 font-medium text-white hover:bg-amber-600"
          >
            Cerrar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-form-title"
    >
      <div className="my-8 w-full max-w-lg">
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl bg-white p-6 shadow-xl sm:p-8"
        >
          <h3 id="lead-form-title" className="mb-4 text-xl font-semibold text-stone-900">
            Quiero recibir más información
          </h3>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="nombre" className="mb-1 block text-sm font-medium text-stone-700">
                Nombre *
              </label>
              <input
                id="nombre"
                type="text"
                required
                value={form.nombre}
                onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
            <div>
              <label htmlFor="apellido" className="mb-1 block text-sm font-medium text-stone-700">
                Apellido *
              </label>
              <input
                id="apellido"
                type="text"
                required
                value={form.apellido}
                onChange={(e) => setForm((f) => ({ ...f, apellido: e.target.value }))}
                className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>
          </div>
          <div className="mt-4">
            <label htmlFor="empresa" className="mb-1 block text-sm font-medium text-stone-700">
              Empresa *
            </label>
            <input
              id="empresa"
              type="text"
              required
              value={form.empresa}
              onChange={(e) => setForm((f) => ({ ...f, empresa: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="mail" className="mb-1 block text-sm font-medium text-stone-700">
              Mail *
            </label>
            <input
              id="mail"
              type="email"
              required
              value={form.mail}
              onChange={(e) => setForm((f) => ({ ...f, mail: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          <div className="mt-4">
            <label htmlFor="telefono" className="mb-1 block text-sm font-medium text-stone-700">
              Teléfono
            </label>
            <input
              id="telefono"
              type="tel"
              value={form.telefono}
              onChange={(e) => setForm((f) => ({ ...f, telefono: e.target.value }))}
              className="w-full rounded-lg border border-stone-300 px-3 py-2 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
            />
          </div>
          {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="submit"
              disabled={sending}
              className="rounded-lg bg-amber-500 px-5 py-2.5 font-medium text-white hover:bg-amber-600 disabled:opacity-50"
            >
              {sending ? "Enviando…" : "Enviar"}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-stone-300 px-5 py-2.5 font-medium text-stone-700 hover:bg-stone-50"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
