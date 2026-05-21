"use client";

import Link from "next/link";
import { useState } from "react";
import { useWizard } from "../context/WizardContext";
import type { CalculationResult } from "../lib/calculations";
import {
  MONDAY_PRESUPUESTO_FORM_URL,
  WHATSAPP_ADVISOR_URL,
} from "@/app/lib/renovatioLinks";

interface LeadFormAdvancedProps {
  onClose: () => void;
  results?: CalculationResult | null;
  /** Solo desarrollo: abrir directamente la pantalla de éxito */
  initialSuccess?: boolean;
}

interface FormData {
  nombre: string;
  apellido: string;
  empresa: string;
  mail: string;
  telefono: string;
}

function CheckCircleIcon({ className = "h-6 w-6" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <circle cx="12" cy="12" r="10" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}

function WhatsAppIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function LeadFormSuccess({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 p-4 backdrop-blur-[2px] overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lead-success-title"
    >
      <div className="relative my-6 w-full max-w-md rounded-2xl bg-white shadow-2xl shadow-stone-900/10 ring-1 ring-stone-200/80 sm:my-10 sm:max-w-[28rem]">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-lg p-1.5 text-stone-400 transition-colors hover:bg-stone-100 hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 sm:right-5 sm:top-5"
          aria-label="Cerrar"
        >
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            aria-hidden
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>

        <div className="px-6 py-9 sm:px-9 sm:py-11">
          {/* Confirmación — compacta */}
          <div className="flex items-start gap-3.5 pr-8">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-1 ring-emerald-100">
              <CheckCircleIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <h2
                id="lead-success-title"
                className="text-lg font-semibold tracking-tight text-stone-900 sm:text-xl"
              >
                Información recibida
              </h2>
              <p className="mt-1.5 max-w-[26rem] text-sm leading-relaxed text-stone-500">
                Recibimos correctamente tus datos. Un asesor de Renovatio se
                pondrá en contacto con vos próximamente.
              </p>
            </div>
          </div>

          {/* CTA principal — prioridad visual */}
          <section
            className="mt-9 rounded-xl border border-amber-100/90 bg-gradient-to-b from-amber-50/70 to-stone-50/50 px-5 py-6 sm:mt-10 sm:px-6 sm:py-7"
            aria-labelledby="lead-success-next-step"
          >
            <h3
              id="lead-success-next-step"
              className="max-w-[24rem] text-[15px] font-semibold leading-snug text-stone-900 sm:text-base"
            >
              Avanzar con una propuesta diseñada para tu propiedad.
            </h3>
            <div className="mt-3 max-w-[24rem] space-y-2.5 text-sm leading-relaxed text-stone-600">
              <p>
                Da un paso más y completá el formulario de relevamiento con
                información más precisa.
              </p>
              <p>
                Nuestro equipo de ingeniería utilizará esta información para
                desarrollar una propuesta técnica más precisa.
              </p>
            </div>
            <a
              href={MONDAY_PRESUPUESTO_FORM_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 flex w-full items-center justify-center rounded-xl bg-amber-500 px-6 py-4 text-sm font-bold uppercase tracking-wide text-white shadow-md shadow-amber-500/20 transition-colors hover:bg-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              Completar formulario
            </a>
            <p className="mt-3 text-center text-xs text-stone-500">
              ⏱️ Tiempo estimado: 5–10 minutos.
            </p>
          </section>

          {/* CTA secundario — menor peso */}
          <section
            className="mt-8 border-t border-stone-100 pt-7"
            aria-labelledby="lead-success-whatsapp"
          >
            <h3
              id="lead-success-whatsapp"
              className="text-sm font-semibold text-stone-800"
            >
              ¿Preferís hablar directamente con un asesor?
            </h3>
            <p className="mt-1.5 max-w-[24rem] text-sm leading-relaxed text-stone-500">
              Resolvé dudas técnicas y recibí asesoramiento personalizado por
              WhatsApp.
            </p>
            <a
              href={WHATSAPP_ADVISOR_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex items-center gap-1.5 rounded-md py-0.5 text-sm font-medium text-brand-navy transition-colors hover:text-[#128C7E] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              <WhatsAppIcon className="h-[18px] w-[18px] shrink-0 text-[#25D366]" />
              <span>Contactar por WhatsApp</span>
            </a>
          </section>

          <div className="mt-10 text-center sm:mt-12">
            <Link
              href="/"
              onClick={onClose}
              className="text-xs font-medium text-stone-400 transition-colors hover:text-stone-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2 rounded-sm"
            >
              Volver al inicio
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export function LeadFormAdvanced({
  onClose,
  results,
  initialSuccess = false,
}: LeadFormAdvancedProps) {
  const wizard = useWizard();
  const [form, setForm] = useState<FormData>({
    nombre: "",
    apellido: "",
    empresa: "",
    mail: "",
    telefono: "",
  });
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(initialSuccess);
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
    return <LeadFormSuccess onClose={onClose} />;
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
