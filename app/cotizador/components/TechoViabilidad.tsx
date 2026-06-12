"use client";

import { AlertCircle, AlertTriangle, CheckCircle2, Layers } from "lucide-react";
import type { Panel } from "@/lib/cotizador/types";
import {
  computeTechoSemaforo,
  orientacionDesfavorableSur,
} from "@/lib/cotizador/techo-viabilidad";

const DEFAULT_PANEL: Pick<Panel, "wp" | "largoM" | "anchoM"> = {
  wp: 615,
  largoM: 2.384,
  anchoM: 1.134,
};

export function TechoViabilidad({
  areaBruta,
  areaUtil,
  factorAprovechamiento,
  kwpObjetivo,
  kwpMaxTecho,
  azimutDeg,
  panel = DEFAULT_PANEL,
}: {
  areaBruta: number;
  areaUtil: number;
  factorAprovechamiento: number;
  kwpObjetivo: number;
  /** Capacidad máx. calculada con el panel del catálogo (opcional; se estima si falta). */
  kwpMaxTecho?: number;
  azimutDeg?: number | null;
  panel?: Pick<Panel, "wp" | "largoM" | "anchoM">;
}) {
  const areaPorPanel = panel.largoM * panel.anchoM;
  const nPaneles = areaUtil > 0 ? Math.floor(areaUtil / areaPorPanel) : 0;
  const kwpMax =
    kwpMaxTecho ?? (nPaneles > 0 ? (nPaneles * panel.wp) / 1000 : 0);
  const kwpPorM2Util = panel.wp / 1000 / areaPorPanel;

  const semaforo = computeTechoSemaforo(
    kwpMax,
    kwpObjetivo,
    areaBruta > 0,
    areaUtil,
    kwpPorM2Util
  );
  const orientacionSur = orientacionDesfavorableSur(azimutDeg);

  const badge =
    semaforo.estado === "verde" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-800">
        <CheckCircle2 className="h-3.5 w-3.5" />
        {semaforo.label}
      </span>
    ) : semaforo.estado === "amarillo" ? (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-900">
        <AlertTriangle className="h-3.5 w-3.5" />
        {semaforo.label}
      </span>
    ) : (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-semibold text-red-800">
        <AlertCircle className="h-3.5 w-3.5" />
        {semaforo.label}
      </span>
    );

  return (
    <div className="mb-4 overflow-hidden rounded-xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white shadow-sm">
      <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-4 py-2.5">
        <Layers className="h-4 w-4 text-amber-600" />
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Semáforo de viabilidad
        </span>
      </div>

      <div className="space-y-3 p-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          <Stat label="Área bruta" value={`${Math.round(areaBruta).toLocaleString("es-AR")} m²`} />
          <Stat
            label={`Área útil (× ${factorAprovechamiento})`}
            value={`${Math.round(areaUtil).toLocaleString("es-AR")} m²`}
          />
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-3">
          <p className="text-xs font-medium text-slate-500">Capacidad máx. del techo</p>
          <p className="mt-0.5 text-2xl font-bold text-slate-800">
            {areaBruta > 0 ? `${kwpMax.toFixed(1)} kWp` : "—"}
          </p>
          {areaBruta > 0 && (
            <p className="mt-1 text-[11px] text-slate-400">
              ~{nPaneles} paneles · {areaPorPanel.toFixed(2)} m²/módulo · {panel.wp} Wp
            </p>
          )}
        </div>

        {kwpObjetivo > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5">
            <div className="text-sm">
              <span className="text-slate-500">Potencia del proyecto: </span>
              <strong className="text-slate-800">{kwpObjetivo.toLocaleString("es-AR")} kWp</strong>
            </div>
            {badge}
          </div>
        )}

        {orientacionSur && (
          <p className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Orientación desfavorable en hemisferio sur (azimut {Math.round(azimutDeg ?? 0)}°).
          </p>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[11px] font-medium text-slate-500">{label}</p>
      <p className="font-semibold text-slate-800">{value}</p>
    </div>
  );
}

export { computeTechoSemaforo, orientacionDesfavorableSur };
