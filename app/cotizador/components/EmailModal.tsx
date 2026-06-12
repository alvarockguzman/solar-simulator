"use client";

import { useState } from "react";
import { Loader2, Mail, X } from "lucide-react";
import { useCotizador } from "../context/CotizadorContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type Estado = "idle" | "enviando" | "ok" | "error";

/** Modal de envío del Reporte de Producción por mail (Resend, R8). */
export function EmailModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { state } = useCotizador();
  const [to, setTo] = useState(state.cliente.email);
  const [mensaje, setMensaje] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const emailValido = EMAIL_RE.test(to.trim());

  async function enviar() {
    if (!emailValido || !state.report) return;
    setEstado("enviando");
    setError(null);
    try {
      const res = await fetch("/api/cotizador/report/email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report: state.report,
          snapshotDataUrl: state.techo.snapshotDataUrl,
          cliente: state.cliente.razonSocial,
          to: to.trim(),
          mensaje: mensaje.trim() || undefined,
        }),
      });
      const data = await res.json().catch(() => null);
      if (res.status === 503) {
        throw new Error(data?.error ?? "Envío de mail no configurado.");
      }
      if (!res.ok) throw new Error(data?.error ?? "No se pudo enviar el mail.");
      setEstado("ok");
    } catch (err) {
      setEstado("error");
      setError(err instanceof Error ? err.message : "No se pudo enviar el mail.");
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-base font-semibold text-stone-900">
            <Mail className="h-4 w-4 text-amber-600" />
            Enviar reporte por mail
          </h3>
          <button onClick={onClose} className="text-stone-400 hover:text-stone-600">
            <X className="h-5 w-5" />
          </button>
        </div>

        {estado === "ok" ? (
          <div className="space-y-4">
            <p className="rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">
              Reporte enviado a <strong>{to}</strong>.
            </p>
            <button
              onClick={onClose}
              className="w-full rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700"
            >
              Cerrar
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">
              Destinatario
              <input
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                type="email"
                value={to}
                onChange={(e) => setTo(e.target.value)}
                placeholder="cliente@empresa.com"
              />
              {to.trim() && !emailValido && (
                <span className="mt-1 block text-xs font-normal normal-case text-red-600">
                  Email inválido.
                </span>
              )}
            </label>
            <label className="block text-xs font-medium uppercase tracking-wide text-stone-500">
              Mensaje (opcional)
              <textarea
                className="mt-1 w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500"
                rows={3}
                value={mensaje}
                onChange={(e) => setMensaje(e.target.value)}
                placeholder="Texto que se incluye en el cuerpo del mail…"
              />
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700">{error}</p>
            )}

            <button
              onClick={enviar}
              disabled={!emailValido || estado === "enviando"}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-600 py-2 text-sm font-semibold text-white hover:bg-amber-700 disabled:opacity-50"
            >
              {estado === "enviando" && <Loader2 className="h-4 w-4 animate-spin" />}
              {estado === "enviando"
                ? "Enviando…"
                : estado === "error"
                ? "Reintentar"
                : "Enviar"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
