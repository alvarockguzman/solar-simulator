"use client";

import { AlertCircle, AlertTriangle, Building2, CheckCircle2, Maximize2, Zap } from "lucide-react";
import { computeSizing } from "@/lib/cotizador/engine";
import { getMockCatalog } from "@/lib/cotizador/pricing/mock";
import { computeTechoSemaforo } from "@/lib/cotizador/techo-viabilidad";
import { useCotizador } from "../context/CotizadorContext";

export function CotizadorContextBar() {
  const { state } = useCotizador();
  const { cliente, techo, poligonos, step } = state;

  if (step < 2) return null;

  const areaBruta = poligonos.reduce((acc, p) => acc + p.areaM2, 0);
  const areaUtil = Math.round(areaBruta * techo.factorAprovechamiento);
  const kwp = techo.kwpDeseado ?? 0;
  const clienteLabel = cliente.razonSocial.trim() || "Sin definir";

  let kwpMaxTecho = 0;
  let kwpPorM2Util: number | undefined;
  if (areaBruta > 0 && kwp > 0) {
    try {
      const catalog = state.catalog ?? getMockCatalog();
      const sizing = computeSizing(
        { ...techo, areasM2: poligonos.map((p) => p.areaM2) },
        { mensualKwh: Array(12).fill(0), tarifaUsdKwh: 0, pctDiurno: 0.7 },
        catalog,
        1400,
        state.ajustes.panelModelo
      );
      kwpMaxTecho = sizing.kwpMaxTecho;
      const panel = sizing.panel;
      kwpPorM2Util = panel.wp / 1000 / (panel.largoM * panel.anchoM);
    } catch {
      kwpMaxTecho = 0;
    }
  }

  const semaforo =
    kwp > 0
      ? computeTechoSemaforo(kwpMaxTecho, kwp, areaBruta > 0, areaUtil, kwpPorM2Util)
      : null;

  return (
    <div className="sticky top-0 z-20 shrink-0 border-b border-slate-200 bg-slate-50/95 backdrop-blur-sm">
      <div className="mx-auto flex flex-wrap items-center gap-x-6 gap-y-1 px-4 py-2 text-xs sm:px-8">
        <ContextItem icon={Building2} label="Cliente" value={clienteLabel} />
        <Divider />
        <ContextItem
          icon={Zap}
          label="Potencia obj."
          value={kwp > 0 ? `${kwp.toLocaleString("es-AR")} kWp` : "—"}
        />
        <Divider />
        <ContextItem
          icon={Maximize2}
          label="Área útil"
          value={areaUtil > 0 ? `${areaUtil.toLocaleString("es-AR")} m²` : "—"}
        />
        {semaforo && (
          <>
            <Divider />
            <SemaforoBadge semaforo={semaforo} />
          </>
        )}
      </div>
    </div>
  );
}

function SemaforoBadge({
  semaforo,
}: {
  semaforo: ReturnType<typeof computeTechoSemaforo>;
}) {
  const Icon =
    semaforo.estado === "verde"
      ? CheckCircle2
      : semaforo.estado === "amarillo"
        ? AlertTriangle
        : AlertCircle;
  const cls =
    semaforo.estado === "verde"
      ? "text-green-700"
      : semaforo.estado === "amarillo"
        ? "text-amber-700"
        : "text-red-700";

  return (
    <div className={`flex items-center gap-1.5 ${cls}`}>
      <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden />
      <span className="font-medium text-slate-500">Techo:</span>
      <span className="max-w-[200px] truncate font-semibold" title={semaforo.label}>
        {semaforo.estado === "verde"
          ? "OK"
          : semaforo.estado === "amarillo"
            ? "Justo / sin verificar"
            : "Insuficiente"}
      </span>
    </div>
  );
}

function ContextItem({
  icon: Icon,
  label,
  value,
}: {
  icon: typeof Building2;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <Icon className="h-3.5 w-3.5 text-amber-600" aria-hidden />
      <span className="font-medium text-slate-500">{label}:</span>
      <span className="font-semibold text-slate-800">{value}</span>
    </div>
  );
}

function Divider() {
  return <span className="hidden h-3 w-px bg-slate-300 sm:block" aria-hidden />;
}
