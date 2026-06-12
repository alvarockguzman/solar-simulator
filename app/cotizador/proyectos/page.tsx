"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import {
  ChevronRight,
  Copy,
  FolderOpen,
  Loader2,
  Plus,
  Search,
  Sun,
  Trash2,
  Zap,
} from "lucide-react";
import type { CotizadorProjectSummary } from "@/lib/cotizador/types";
import { CotizadorHeader } from "../components/CotizadorHeader";
import { CotizadorNavLink, useCotizadorPending } from "../components/CotizadorPendingNavigation";
import { CotizadorPageLoader } from "../components/CotizadorPageLoader";
import { inputClsEmpty } from "../components/ui/cotizador-ui";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleString("es-AR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function storageLabel(mode: string): string {
  if (mode === "blob") return "Vercel Blob";
  if (mode === "local") return "Disco local";
  return mode || "—";
}

export default function ProyectosPage() {
  const router = useRouter();
  const { startPending } = useCotizadorPending();
  const [projects, setProjects] = useState<CotizadorProjectSummary[]>([]);
  const [storage, setStorage] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async (query?: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = query?.trim() ? `?q=${encodeURIComponent(query.trim())}` : "";
      const res = await fetch(`/api/cotizador/projects${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al cargar.");
      setProjects(data.projects ?? []);
      setStorage(data.storage ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al cargar.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const t = window.setTimeout(() => void load(q), q ? 300 : 0);
    return () => window.clearTimeout(t);
  }, [q, load]);

  async function eliminar(id: string, nombre: string) {
    if (!window.confirm(`¿Eliminar "${nombre}"? Esta acción no se puede deshacer.`)) return;
    setBusyId(id);
    try {
      const res = await fetch(`/api/cotizador/projects/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data?.error ?? "Error al eliminar.");
      }
      setProjects((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al eliminar.");
    } finally {
      setBusyId(null);
    }
  }

  function abrirProyecto(id: string, nombre: string) {
    startPending(
      `Abriendo «${nombre || "proyecto"}»`,
      "Restaurando datos y recalculando resultados…"
    );
    router.push(`/cotizador?proyecto=${id}`);
  }

  async function duplicar(id: string) {
    setBusyId(id);
    try {
      const res = await fetch(`/api/cotizador/projects/${id}`, { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al duplicar.");
      await load(q);
      if (data.project?.id) {
        startPending("Abriendo copia del proyecto", "Cargando borrador duplicado…");
        router.push(`/cotizador?proyecto=${data.project.id}`);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al duplicar.");
    } finally {
      setBusyId(null);
    }
  }

  const conReporte = projects.filter((p) => p.kwp != null).length;

  return (
    <div className="flex min-h-[100dvh] flex-col bg-slate-50">
      <CotizadorHeader />

      {/* Breadcrumb */}
      <nav
        aria-label="Ubicación"
        className="flex shrink-0 items-center gap-1 border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500 sm:px-6"
      >
        <CotizadorNavLink
          href="/cotizador"
          pendingTitle="Volviendo al cotizador"
          pendingSubtitle="Preparando el wizard…"
          className="font-medium hover:text-amber-700"
        >
          Cotizador
        </CotizadorNavLink>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden />
        <span className="font-semibold text-slate-800">Proyectos</span>
      </nav>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-amber-100 text-amber-600">
              <FolderOpen className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <h1 className="text-lg font-semibold text-slate-900">Proyectos guardados</h1>
              <p className="text-xs text-slate-500">
                Borradores del equipo ·{" "}
                <span className="rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
                  {storageLabel(storage)}
                </span>
              </p>
            </div>
          </div>
          <CotizadorNavLink
            href="/cotizador"
            pendingTitle="Nuevo proyecto"
            pendingSubtitle="Preparando el wizard…"
            className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            <Plus className="h-4 w-4" />
            Nuevo proyecto
          </CotizadorNavLink>
        </div>
      </div>

      <main className="mx-auto w-full max-w-5xl flex-1 p-4 sm:p-6">
        {/* Resumen rápido */}
        {!loading && !error && projects.length > 0 && (
          <div className="mb-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <StatCard label="Total" value={String(projects.length)} />
            <StatCard label="Con reporte" value={String(conReporte)} />
            <StatCard
              label="Sin calcular"
              value={String(projects.length - conReporte)}
              className="hidden sm:block"
            />
          </div>
        )}

        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            className={`${inputClsEmpty(q)} pl-9`}
            placeholder="Buscar por nombre, cliente o dirección…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Buscar proyectos"
          />
        </div>

        {loading && (
          <CotizadorPageLoader
            compact
            title="Cargando proyectos…"
            subtitle="Obteniendo borradores guardados"
          />
        )}

        {error && (
          <div className="rounded-r-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {!loading && !error && projects.length === 0 && (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white py-16 text-center shadow-sm">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">
              <Sun className="h-7 w-7 text-slate-300" />
            </span>
            <p className="mt-4 text-sm font-medium text-slate-700">
              {q.trim() ? "No hay resultados para esa búsqueda." : "No hay proyectos guardados todavía."}
            </p>
            <p className="mt-1 text-xs text-slate-500">
              {q.trim() ? "Probá con otro término." : "Creá uno desde el wizard del cotizador."}
            </p>
            {!q.trim() && (
              <CotizadorNavLink
                href="/cotizador"
                pendingTitle="Nuevo proyecto"
                pendingSubtitle="Preparando el wizard…"
                className="mt-5 inline-flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-amber-700"
              >
                <Plus className="h-4 w-4" />
                Crear el primero
              </CotizadorNavLink>
            )}
          </div>
        )}

        {!loading && projects.length > 0 && (
          <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500">
                    <th className="px-4 py-3">Proyecto</th>
                    <th className="hidden px-4 py-3 md:table-cell">Cliente</th>
                    <th className="hidden px-4 py-3 lg:table-cell">Potencia</th>
                    <th className="hidden px-4 py-3 sm:table-cell">Actualizado</th>
                    <th className="px-4 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {projects.map((p, i) => (
                    <tr
                      key={p.id}
                      className={`border-b border-slate-100 transition last:border-0 hover:bg-amber-50/40 ${
                        i % 2 === 1 ? "bg-slate-50/60" : "bg-white"
                      }`}
                    >
                      <td className="px-4 py-3">
                        <p className="font-semibold text-slate-900">
                          {p.proyectoNombre || "Sin nombre"}
                        </p>
                        <p className="mt-0.5 line-clamp-1 text-xs text-slate-500">{p.direccion || "—"}</p>
                      </td>
                      <td className="hidden px-4 py-3 text-slate-700 md:table-cell">
                        {p.clienteRazonSocial || "—"}
                        {p.vendedor && (
                          <p className="mt-0.5 text-xs text-slate-400">{p.vendedor}</p>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 lg:table-cell">
                        {p.kwp != null ? (
                          <div className="flex items-center gap-1.5 text-slate-800">
                            <Zap className="h-3.5 w-3.5 text-amber-600" />
                            <span className="font-semibold">{p.kwp.toFixed(1)} kWp</span>
                            {p.mwh != null && (
                              <span className="text-slate-500">· {p.mwh.toFixed(1)} MWh</span>
                            )}
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">Sin calcular</span>
                        )}
                      </td>
                      <td className="hidden px-4 py-3 text-xs text-slate-500 sm:table-cell">
                        {fmtDate(p.updatedAt)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => abrirProyecto(p.id, p.proyectoNombre)}
                            className="rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700"
                          >
                            Abrir
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void duplicar(p.id)}
                            className="rounded-lg border border-slate-200 p-1.5 text-slate-500 transition hover:bg-slate-100 disabled:opacity-50"
                            title="Duplicar"
                          >
                            {busyId === p.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Copy className="h-4 w-4" />
                            )}
                          </button>
                          <button
                            type="button"
                            disabled={busyId === p.id}
                            onClick={() => void eliminar(p.id, p.proyectoNombre)}
                            className="rounded-lg border border-slate-200 p-1.5 text-red-500 transition hover:bg-red-50 disabled:opacity-50"
                            title="Eliminar"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function StatCard({
  label,
  value,
  className = "",
}: {
  label: string;
  value: string;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-slate-200 bg-white px-4 py-3 shadow-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-0.5 text-2xl font-bold text-slate-800">{value}</p>
    </div>
  );
}
