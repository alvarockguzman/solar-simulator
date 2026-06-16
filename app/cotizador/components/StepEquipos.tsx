"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Check,
  CheckCircle2,
  Circle,
  Package,
  Sun,
  Zap,
} from "lucide-react";
import type { BomLinea } from "@/lib/cotizador/types";
import { selectInverter } from "@/lib/cotizador/engine/inverterSelect";
import { useCotizador } from "../context/CotizadorContext";
import { useLiveQuote } from "../hooks/useLiveQuote";
import { QuoteWarningList } from "./QuoteWarningList";
import {
  BtnPrimary,
  BtnSecondary,
  FormCard,
  FormField,
  selectCls,
  ValidationHint,
} from "./ui/cotizador-ui";

function fmt(n: number, dec = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function bomCategoria(id: string): string {
  if (id === "paneles" || id.startsWith("inversor")) return "Generación";
  if (id === "estructura") return "Estructura y montaje";
  if (id === "cableado" || id === "protecciones") return "Eléctrico";
  if (id === "mano-obra" || id === "ingenieria") return "Servicios e ingeniería";
  if (id.startsWith("manual")) return "Adicionales";
  return "Insumos";
}

function groupBomLineas(lineas: BomLinea[]): { categoria: string; lineas: BomLinea[] }[] {
  const map = new Map<string, BomLinea[]>();
  for (const l of lineas) {
    const cat = bomCategoria(l.id);
    if (!map.has(cat)) map.set(cat, []);
    map.get(cat)!.push(l);
  }
  const order = [
    "Generación",
    "Estructura y montaje",
    "Eléctrico",
    "Servicios e ingeniería",
    "Adicionales",
    "Insumos",
  ];
  return order.filter((c) => map.has(c)).map((c) => ({ categoria: c, lineas: map.get(c)! }));
}

export function StepEquipos({
  onBack,
  onContinuar,
}: {
  onBack: () => void;
  onContinuar: () => void;
}) {
  const { state, dispatch } = useCotizador();
  const { ajustes } = state;
  const { result, catalog } = useLiveQuote();
  const [checked, setChecked] = useState<Record<string, boolean>>({});
  const isBusy = false;

  const lineas = result?.bom.lineas ?? [];
  const grupos = useMemo(() => groupBomLineas(lineas), [lineas]);

  useEffect(() => {
    setChecked((prev) => {
      const next = { ...prev };
      for (const l of lineas) {
        if (next[l.id] === undefined) next[l.id] = false;
      }
      for (const id of Object.keys(next)) {
        if (!lineas.some((l) => l.id === id)) delete next[id];
      }
      return next;
    });
  }, [lineas]);

  const revisados = lineas.filter((l) => checked[l.id]).length;
  const todosRevisados = lineas.length > 0 && revisados === lineas.length;
  const hayErrores = result?.warnings.some((w) => w.code === "sin_inversor") ?? false;

  function handleContinuar() {
    if (hayErrores || !todosRevisados) return;
    onContinuar();
  }

  if (!result || !catalog) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
        Sin dimensionamiento. Volvé a Consumo y continuá al paso de equipos.
      </div>
    );
  }

  const { sizing, bom, warnings } = result;
  const panelesActivos = catalog.paneles.filter((p) => p.activo);
  const inversoresActivos = catalog.inversores.filter((i) => i.activo);
  const panelSel = sizing.panel;
  const inversorLines = bom.inversores;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">4 · Equipos e insumos</h2>
          <p className="mt-1 text-sm text-slate-500">
            Revisá la selección automática, ajustá panel e inversor si hace falta, y confirmá cada
            ítem antes de generar el reporte.
          </p>
        </header>

        {warnings.length > 0 && <QuoteWarningList warnings={warnings} />}

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Potencia" value={`${fmt(sizing.kwpSistema, 1)} kWp`} />
          <Kpi label="Paneles" value={String(sizing.nPaneles)} sub={`${panelSel.wp} Wp c/u`} />
          <Kpi
            label="Inversión AC"
            value={`${fmt(bom.kwAcTotal, 0)} kW`}
            sub={`Ratio ${bom.ratioDcAc.toFixed(2)}`}
          />
          <Kpi
            label="Revisión"
            value={`${revisados}/${lineas.length}`}
            sub={todosRevisados ? "Listo" : "Pendiente"}
            highlight={todosRevisados}
          />
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <FormCard title="Panel fotovoltaico" className="!p-5">
            <div className="mb-3 flex items-start gap-3 rounded-lg bg-amber-50/80 p-3">
              <Sun className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" />
              <div className="min-w-0 text-sm">
                <p className="font-semibold text-slate-900">
                  {panelSel.marca} {panelSel.modelo}
                </p>
                <p className="text-slate-600">
                  {sizing.nPaneles} un. · {panelSel.wp} Wp ·{" "}
                  {panelSel.bifacial ? "Bifacial" : "Monofacial"}
                </p>
              </div>
            </div>
            <FormField label="Cambiar modelo">
              <select
                className={selectCls}
                value={ajustes.panelModelo ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_AJUSTES",
                    ajustes: {
                      panelModelo: e.target.value || null,
                      lineasOverride: {},
                    },
                  })
                }
              >
                <option value="">Automático (mejor USD/Wp)</option>
                {panelesActivos.map((p) => {
                  const usdWp = (p.precioUsd / p.wp).toFixed(3);
                  return (
                    <option key={p.modelo} value={p.modelo}>
                      {p.marca} {p.modelo} — {usdWp} USD/Wp
                    </option>
                  );
                })}
              </select>
            </FormField>
          </FormCard>

          <FormCard title="Inversor(es)" className="!p-5">
            <div className="mb-3 flex items-start gap-3 rounded-lg bg-sky-50/80 p-3">
              <Zap className="mt-0.5 h-5 w-5 shrink-0 text-sky-600" />
              <div className="min-w-0 text-sm">
                {inversorLines.length === 0 ? (
                  <p className="font-semibold text-red-700">Sin inversor compatible</p>
                ) : (
                  inversorLines.map((inv, i) => (
                    <p key={i} className={i > 0 ? "mt-1 text-slate-600" : "font-semibold text-slate-900"}>
                      {inv.cantidad}× {inv.inversor.marca} {inv.inversor.modelo} ({inv.inversor.kwAc}{" "}
                      kW AC)
                    </p>
                  ))
                )}
              </div>
            </div>
            <FormField label="Forzar modelo">
              <select
                className={selectCls}
                value={ajustes.inversorModelo ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_AJUSTES",
                    ajustes: {
                      inversorModelo: e.target.value || null,
                      lineasOverride: {},
                    },
                  })
                }
              >
                <option value="">Automático (mín. costo, load ratio 1.1–1.3)</option>
                {inversoresActivos.map((i) => {
                  const sel = selectInverter(sizing.kwpSistema, [i], i.modelo);
                  const ratioLabel = sel
                    ? ` · ratio ${sel.loadRatio.toFixed(2)}${sel.enRango ? " ✓" : ""}`
                    : "";
                  return (
                    <option key={i.modelo} value={i.modelo}>
                      {i.marca} {i.modelo} — {i.kwAc} kW{ratioLabel}
                    </option>
                  );
                })}
              </select>
            </FormField>
          </FormCard>
        </div>

        <section className="rounded-2xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-amber-600" />
              <div>
                <h3 className="text-sm font-semibold text-slate-900">Checklist de insumos</h3>
                <p className="text-xs text-slate-500">
                  Estos ítems aparecen en el reporte. Marcá cada uno como revisado.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                const all: Record<string, boolean> = {};
                for (const l of lineas) all[l.id] = true;
                setChecked(all);
              }}
              className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
            >
              Marcar todo OK
            </button>
          </div>

          <div className="divide-y divide-slate-100">
            {grupos.map(({ categoria, lineas: catLineas }) => (
              <div key={categoria} className="px-5 py-4">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-400">
                  {categoria}
                </p>
                <ul className="space-y-2">
                  {catLineas.map((l) => {
                    const ok = checked[l.id];
                    return (
                      <li key={l.id}>
                        <button
                          type="button"
                          onClick={() =>
                            setChecked((prev) => ({ ...prev, [l.id]: !prev[l.id] }))
                          }
                          className={`flex w-full items-start gap-3 rounded-xl border px-3 py-2.5 text-left transition ${
                            ok
                              ? "border-emerald-200 bg-emerald-50/60"
                              : "border-slate-200 bg-slate-50/50 hover:border-amber-200 hover:bg-amber-50/30"
                          }`}
                        >
                          {ok ? (
                            <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                          ) : (
                            <Circle className="mt-0.5 h-5 w-5 shrink-0 text-slate-300" />
                          )}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-slate-900">{l.item}</p>
                            <p className="mt-0.5 text-xs text-slate-500">{l.detalle}</p>
                          </div>
                          <div className="shrink-0 text-right text-sm">
                            <p className="font-semibold text-slate-800">
                              {fmt(l.cantidad, l.cantidad % 1 ? 1 : 0)} {l.unidad}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              ${fmt(l.subtotalUsd, 0)} USD
                            </p>
                            {ok && (
                              <span className="text-[10px] font-medium uppercase text-emerald-700">
                                OK
                              </span>
                            )}
                          </div>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-100 bg-slate-50/80 px-5 py-3 text-xs text-slate-500">
            <p className="mb-1 text-right font-semibold text-slate-800">
              Total insumos: ${fmt(bom.costoUsd, 0)} USD
            </p>
            {todosRevisados ? (
              <span className="flex items-center gap-1.5 font-medium text-emerald-700">
                <Check className="h-3.5 w-3.5" />
                Checklist completo — podés generar el reporte
              </span>
            ) : (
              <span>
                Faltan {lineas.length - revisados} ítem{lineas.length - revisados !== 1 ? "s" : ""}{" "}
                por revisar
              </span>
            )}
          </div>
        </section>

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-2">
          {!todosRevisados && !hayErrores && (
            <ValidationHint>
              Revisá todos los insumos del checklist antes de continuar al modelo económico.
            </ValidationHint>
          )}
          <div className="flex gap-3">
            <BtnSecondary onClick={onBack} className="flex-1" disabled={isBusy}>
              ← Consumo
            </BtnSecondary>
            <BtnPrimary
              onClick={handleContinuar}
              disabled={isBusy || hayErrores || !todosRevisados}
              className="relative flex flex-1 items-center justify-center gap-2"
            >
              Revisar economía →
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}

function Kpi({
  label,
  value,
  sub,
  highlight = false,
}: {
  label: string;
  value: string;
  sub?: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        highlight ? "border-emerald-200 bg-emerald-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-lg font-bold text-slate-900">{value}</p>
      {sub && <p className="text-[11px] text-slate-500">{sub}</p>}
    </div>
  );
}
