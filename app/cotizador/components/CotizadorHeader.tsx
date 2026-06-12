"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { FolderOpen, Loader2, LogOut, Plus, Save, Sun } from "lucide-react";
import { saveProject } from "../lib/saveProject";
import { useCotizador } from "../context/CotizadorContext";
import { CotizadorNavLink, useCotizadorPending } from "./CotizadorPendingNavigation";

function formatSavedAt(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Guardado hace un momento";
  if (diff < 3600_000) return `Guardado hace ${Math.floor(diff / 60_000)} min`;
  return `Guardado ${d.toLocaleString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}`;
}

export function CotizadorHeader() {
  const router = useRouter();
  const { state, dispatch } = useCotizador();
  const { startPending } = useCotizadorPending();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveOk, setSaveOk] = useState(false);

  const metrics = state.report
    ? { kwp: state.report.metrics.kwpDc, mwh: state.report.metrics.energiaAnualMwh }
    : state.result
    ? {
        kwp: state.result.sizing.kwpSistema,
        mwh: state.result.economics.produccionAnualKwh / 1000,
      }
    : undefined;

  const guardar = useCallback(async () => {
    setSaving(true);
    setSaveError(null);
    setSaveOk(false);
    try {
      const result = await saveProject(state, metrics);
      if (!result.ok) throw new Error(result.error);
      if (result.created) {
        dispatch({ type: "SET_PROJECT_ID", projectId: result.projectId });
        router.replace(`/cotizador?proyecto=${result.projectId}`, { scroll: false });
      }
      if (result.snapshotUrl) {
        dispatch({ type: "SET_SNAPSHOT_URL", snapshotDataUrl: result.snapshotUrl });
      }
      dispatch({ type: "MARK_SAVED", updatedAt: result.updatedAt });
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 2500);
    } catch (err) {
      setSaveError(err instanceof Error ? err.message : "Error al guardar.");
    } finally {
      setSaving(false);
    }
  }, [state, dispatch, metrics, router]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        if (state.dirty && !saving) void guardar();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [guardar, state.dirty, saving]);

  async function handleLogout() {
    await fetch("/api/cotizador/auth", { method: "DELETE" });
    router.push("/cotizador/login");
    router.refresh();
  }

  function nuevoProyecto() {
    if (state.dirty && !window.confirm("Hay cambios sin guardar. ¿Crear un proyecto nuevo igual?")) {
      return;
    }
    dispatch({ type: "RESET" });
    startPending("Nuevo proyecto", "Preparando el wizard…");
    router.push("/cotizador");
  }

  return (
    <header className="flex shrink-0 flex-col border-b border-slate-200 bg-white">
      <div className="flex h-14 items-center justify-between gap-2 px-4 sm:px-6">
        <Link href="/cotizador" className="flex items-center gap-2">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 text-amber-600">
            <Sun className="h-4 w-4" />
          </span>
          <span className="text-sm font-semibold text-slate-900">
            Cotizador Solar
            <span className="ml-2 hidden rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-slate-500 sm:inline">
              Interno
            </span>
          </span>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <CotizadorNavLink
            href="/cotizador/proyectos"
            pendingTitle="Cargando proyectos"
            pendingSubtitle="Obteniendo borradores guardados…"
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <FolderOpen className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Proyectos</span>
          </CotizadorNavLink>
          <button
            type="button"
            onClick={nuevoProyecto}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
          <button
            type="button"
            onClick={() => void guardar()}
            disabled={!state.dirty || saving}
            title={!state.dirty ? "No hay cambios para guardar" : "Guardar proyecto (Ctrl+S)"}
            className="flex items-center gap-1 rounded-lg bg-amber-600 px-2.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {saving ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            Guardar
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-500 hover:bg-slate-100"
            title="Cerrar sesión"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
      {(state.dirty || state.lastSavedAt || saveError || saveOk) && (
        <div className="border-t border-slate-100 px-4 py-1 text-center text-[11px] sm:px-6">
          {saveError && <span className="text-red-600">{saveError}</span>}
          {!saveError && saveOk && <span className="text-emerald-600">Proyecto guardado</span>}
          {!saveError && !saveOk && state.needsRecalc && (
            <span className="text-amber-700">Reporte desactualizado — recalculá</span>
          )}
          {!saveError && !saveOk && !state.needsRecalc && state.dirty && (
            <span className="text-amber-700">Cambios sin guardar</span>
          )}
          {!saveError && !saveOk && !state.dirty && state.lastSavedAt && (
            <span className="text-stone-400">{formatSavedAt(state.lastSavedAt)}</span>
          )}
        </div>
      )}
    </header>
  );
}
