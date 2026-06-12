"use client";

import { useEffect, useRef, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, Copy, FileDown, Loader2, Plus, RotateCcw } from "lucide-react";
import { quote } from "@/lib/cotizador/engine";
import type { BomLinea } from "@/lib/cotizador/types";
import { buildQuoteInput, useCotizador } from "../context/CotizadorContext";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

function fmt(n: number, dec = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export function StepResultados({ onBack }: { onBack: () => void }) {
  const { state, dispatch } = useCotizador();
  const { result, catalog, pvgis, pvgisKwp, ajustes } = state;
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);
  const refetchingPvgis = useRef(false);

  // Recalculo en vivo client-side ante cada ajuste; PVGIS solo se re-llama
  // si el kWp del sistema cambió más de 5% respecto del usado.
  useEffect(() => {
    if (!catalog || !pvgis) return;
    const input = buildQuoteInput(state);
    const newResult = quote(input, catalog, pvgis);
    const kwp = newResult.sizing.kwpSistema;

    if (
      pvgisKwp &&
      Math.abs(kwp - pvgisKwp) / pvgisKwp > 0.05 &&
      !refetchingPvgis.current
    ) {
      refetchingPvgis.current = true;
      fetch("/api/cotizador/pvgis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: state.cliente.lat,
          lon: state.cliente.lon,
          kwp,
          tipoTecho: state.techo.tipoTecho,
          azimutDeg: state.techo.azimutDeg,
          inclinacionDeg: state.techo.inclinacionDeg,
          // Pérdidas parametrizadas calculadas por el motor en el último quote.
          lossPct: Math.round(newResult.losses.total * 1000) / 10,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((nuevo) => {
          if (nuevo) dispatch({ type: "SET_PVGIS", pvgis: nuevo, kwp });
        })
        .finally(() => {
          refetchingPvgis.current = false;
        });
    }

    dispatch({ type: "SET_RESULT", result: newResult });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ajustes, pvgis, state.poligonos, state.consumo, state.techo.tipoTecho, state.techo.factorAprovechamiento, state.techo.distanciaTableroM]);

  if (!result || !catalog) {
    return (
      <div className="flex h-full items-center justify-center text-stone-500">
        Sin resultados. Volvé al paso anterior y calculá la cotización.
      </div>
    );
  }

  const { sizing, bom, economics, warnings } = result;
  const hayErrores = warnings.some((w) => w.code === "sin_inversor");

  const chartData = MESES.map((mes, i) => ({
    mes,
    Producción: economics.produccionMensualKwh[i],
    Consumo: economics.consumoMensualKwh[i],
  }));

  async function generarPdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/cotizador/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ input: buildQuoteInput(state), result }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al generar el PDF.");
      setPdfUrl(data.url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Error al generar el PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  async function copiarLink() {
    if (!pdfUrl) return;
    await navigator.clipboard.writeText(pdfUrl);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-6">
      {/* Advertencias */}
      {warnings.length > 0 && (
        <div className="space-y-1.5">
          {warnings.map((w) => (
            <div
              key={w.code}
              className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-xs ${
                w.code === "sin_inversor"
                  ? "border-red-200 bg-red-50 text-red-700"
                  : "border-amber-200 bg-amber-50 text-amber-800"
              }`}
            >
              <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
              {w.message}
            </div>
          ))}
        </div>
      )}

      {/* Métricas grandes */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Metric label="Potencia" value={`${fmt(sizing.kwpSistema, 1)} kWp`} sub={`${sizing.nPaneles} paneles`} />
        <Metric label="Producción anual" value={`${fmt(economics.produccionAnualKwh / 1000, 0)} MWh`} sub={`${fmt(result.pvgis.yieldKwhPerKwpYear, 0)} kWh/kWp·año`} />
        <Metric label="Ahorro anual" value={`USD ${fmt(economics.ahorroAnualUsd)}`} sub={`VAN USD ${fmt(economics.vanUsd)} · TIR ${economics.tirPct ?? "—"}%`} />
        <Metric label="Inversión" value={`USD ${fmt(bom.capexUsd)}`} sub={`Payback ${economics.paybackAnos ?? "—"} años`} highlight />
      </div>

      {/* Gráfico mensual */}
      <div className="rounded-2xl border border-stone-200 bg-white p-4">
        <h3 className="mb-3 text-sm font-semibold text-stone-900">
          Producción vs consumo mensual (kWh)
        </h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e7e5e4" />
              <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} tickFormatter={(v) => fmt(v)} />
              <Tooltip formatter={(v) => fmt(Number(v)) + " kWh"} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              <Bar dataKey="Producción" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              <Bar dataKey="Consumo" fill="#78716c" radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Panel de revisión */}
      <PanelRevision />

      {/* BOM */}
      <TablaBom lineas={bom.lineas} costo={bom.costoUsd} capex={bom.capexUsd} margen={bom.margenPct} descuento={bom.descuentoPct} />

      {/* Acciones */}
      <div className="flex flex-col gap-3 rounded-2xl border border-stone-200 bg-white p-4 sm:flex-row sm:items-center">
        <button
          onClick={onBack}
          className="rounded-lg border border-stone-300 px-4 py-2.5 text-sm font-medium text-stone-600 hover:bg-stone-50"
        >
          ← Consumo
        </button>
        <div className="flex-1" />
        {pdfUrl && (
          <div className="flex items-center gap-2">
            <a
              href={pdfUrl}
              target="_blank"
              rel="noreferrer"
              className="rounded-lg border border-amber-600 px-4 py-2.5 text-sm font-semibold text-amber-700 hover:bg-amber-50"
            >
              Descargar PDF
            </a>
            <button
              onClick={copiarLink}
              className="flex items-center gap-1.5 rounded-lg border border-stone-300 px-3 py-2.5 text-sm text-stone-600 hover:bg-stone-50"
            >
              <Copy className="h-4 w-4" />
              {copiado ? "¡Copiado!" : "Copiar link"}
            </button>
          </div>
        )}
        <button
          onClick={generarPdf}
          disabled={pdfLoading || hayErrores}
          className="flex items-center justify-center gap-2 rounded-lg bg-amber-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
          title={hayErrores ? "Resolvé los errores antes de generar" : undefined}
        >
          {pdfLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <FileDown className="h-4 w-4" />}
          {pdfLoading ? "Generando…" : "Generar cotización"}
        </button>
      </div>
      {pdfError && <p className="text-sm text-red-600">{pdfError}</p>}
    </div>
  );
}

function Metric({
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
      className={`rounded-2xl border p-4 ${
        highlight ? "border-amber-300 bg-amber-50" : "border-stone-200 bg-white"
      }`}
    >
      <p className="text-xs font-medium uppercase tracking-wide text-stone-500">{label}</p>
      <p className="mt-1 text-xl font-bold text-stone-900">{value}</p>
      {sub && <p className="mt-0.5 text-xs text-stone-500">{sub}</p>}
    </div>
  );
}

function PanelRevision() {
  const { state, dispatch } = useCotizador();
  const { catalog, ajustes, result } = state;
  if (!catalog || !result) return null;

  const margenActual = ajustes.margenPct ?? catalog.parametros.margenDefault;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <h3 className="mb-3 text-sm font-semibold text-stone-900">Revisión y ajustes</h3>
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
        <Field label="Panel">
          <select
            className={inputCls}
            value={ajustes.panelModelo ?? ""}
            onChange={(e) =>
              dispatch({
                type: "SET_AJUSTES",
                ajustes: { panelModelo: e.target.value || null, lineasOverride: {} },
              })
            }
          >
            <option value="">Auto (mejor USD/Wp)</option>
            {catalog.paneles.map((p) => (
              <option key={p.modelo} value={p.modelo}>
                {p.marca} {p.modelo} ({p.wp} Wp)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Inversor">
          <select
            className={inputCls}
            value={ajustes.inversorModelo ?? ""}
            onChange={(e) =>
              dispatch({
                type: "SET_AJUSTES",
                ajustes: { inversorModelo: e.target.value || null, lineasOverride: {} },
              })
            }
          >
            <option value="">Auto (mín. costo)</option>
            {catalog.inversores.map((i) => (
              <option key={i.modelo} value={i.modelo}>
                {i.marca} {i.modelo} ({i.kwAc} kW)
              </option>
            ))}
          </select>
        </Field>
        <Field label="Margen %">
          <input
            className={inputCls}
            type="number"
            min="0"
            max="100"
            value={Math.round(margenActual * 100)}
            onChange={(e) =>
              dispatch({
                type: "SET_AJUSTES",
                ajustes: { margenPct: Number(e.target.value) / 100 },
              })
            }
          />
        </Field>
        <Field label="Descuento %">
          <input
            className={inputCls}
            type="number"
            min="0"
            max="100"
            value={Math.round(ajustes.descuentoPct * 100)}
            onChange={(e) =>
              dispatch({
                type: "SET_AJUSTES",
                ajustes: { descuentoPct: Number(e.target.value) / 100 },
              })
            }
          />
        </Field>
        <Field label="PDF">
          <label className="flex h-[38px] cursor-pointer items-center gap-2 rounded-lg border border-stone-300 px-3 text-xs text-stone-600">
            <input
              type="checkbox"
              checked={ajustes.mostrarDetalle}
              onChange={(e) =>
                dispatch({ type: "SET_AJUSTES", ajustes: { mostrarDetalle: e.target.checked } })
              }
            />
            Mostrar detalle BOM
          </label>
        </Field>
      </div>
    </div>
  );
}

function TablaBom({
  lineas,
  costo,
  capex,
  margen,
  descuento,
}: {
  lineas: BomLinea[];
  costo: number;
  capex: number;
  margen: number;
  descuento: number;
}) {
  const { state, dispatch } = useCotizador();
  const { ajustes } = state;
  const [nuevo, setNuevo] = useState({ item: "", cantidad: 1, unitarioUsd: 0 });

  function override(id: string, campo: "cantidad" | "unitarioUsd", valor: number) {
    dispatch({
      type: "SET_AJUSTES",
      ajustes: {
        lineasOverride: {
          ...ajustes.lineasOverride,
          [id]: { ...ajustes.lineasOverride[id], [campo]: valor },
        },
      },
    });
  }

  function agregarManual() {
    if (!nuevo.item.trim() || nuevo.unitarioUsd <= 0) return;
    dispatch({
      type: "SET_AJUSTES",
      ajustes: {
        lineasManuales: [
          ...ajustes.lineasManuales,
          {
            id: `manual-${Date.now()}`,
            item: nuevo.item,
            detalle: "Línea manual",
            cantidad: nuevo.cantidad,
            unidad: "gl",
            unitarioUsd: nuevo.unitarioUsd,
            subtotalUsd: nuevo.cantidad * nuevo.unitarioUsd,
            manual: true,
          },
        ],
      },
    });
    setNuevo({ item: "", cantidad: 1, unitarioUsd: 0 });
  }

  function quitarManual(id: string) {
    dispatch({
      type: "SET_AJUSTES",
      ajustes: { lineasManuales: ajustes.lineasManuales.filter((l) => l.id !== id) },
    });
  }

  const hayOverrides = Object.keys(ajustes.lineasOverride).length > 0;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-stone-900">Detalle del sistema (BOM)</h3>
        {hayOverrides && (
          <button
            onClick={() => dispatch({ type: "SET_AJUSTES", ajustes: { lineasOverride: {} } })}
            className="flex items-center gap-1 text-xs text-stone-500 hover:text-stone-800"
          >
            <RotateCcw className="h-3 w-3" />
            Restaurar precios
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-stone-200 text-left text-xs uppercase tracking-wide text-stone-500">
              <th className="py-2 pr-3">Ítem</th>
              <th className="py-2 pr-3">Detalle</th>
              <th className="py-2 pr-3 text-right">Cant.</th>
              <th className="py-2 pr-3 text-right">Unitario USD</th>
              <th className="py-2 text-right">Subtotal USD</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {lineas.map((l) => (
              <tr key={l.id} className="border-b border-stone-100">
                <td className="py-2 pr-3 font-medium text-stone-800">
                  {l.item}
                  {l.manual && (
                    <span className="ml-1.5 rounded bg-amber-100 px-1 py-0.5 text-[10px] text-amber-700">
                      editado
                    </span>
                  )}
                </td>
                <td className="max-w-[260px] truncate py-2 pr-3 text-xs text-stone-500" title={l.detalle}>
                  {l.detalle}
                </td>
                <td className="py-2 pr-3 text-right">
                  <input
                    className="w-20 rounded border border-stone-200 px-1.5 py-1 text-right text-xs"
                    type="number"
                    value={l.cantidad}
                    onChange={(e) => override(l.id, "cantidad", Number(e.target.value))}
                    disabled={l.id.startsWith("manual-")}
                  />
                  <span className="ml-1 text-xs text-stone-400">{l.unidad}</span>
                </td>
                <td className="py-2 pr-3 text-right">
                  <input
                    className="w-24 rounded border border-stone-200 px-1.5 py-1 text-right text-xs"
                    type="number"
                    value={l.unitarioUsd}
                    onChange={(e) => override(l.id, "unitarioUsd", Number(e.target.value))}
                    disabled={l.id.startsWith("manual-")}
                  />
                </td>
                <td className="py-2 text-right font-medium">{fmt(l.subtotalUsd)}</td>
                <td className="pl-2">
                  {l.id.startsWith("manual-") && (
                    <button
                      onClick={() => quitarManual(l.id)}
                      className="text-xs text-stone-400 hover:text-red-600"
                    >
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="text-sm">
            <tr>
              <td colSpan={4} className="py-1.5 text-right text-stone-500">
                Costo
              </td>
              <td className="py-1.5 text-right font-medium">{fmt(costo)}</td>
              <td />
            </tr>
            <tr>
              <td colSpan={4} className="py-1.5 text-right text-stone-500">
                Margen {Math.round(margen * 100)}%
                {descuento > 0 && ` · Descuento ${Math.round(descuento * 100)}%`}
              </td>
              <td className="py-1.5 text-right font-medium">{fmt(capex - costo)}</td>
              <td />
            </tr>
            <tr className="border-t border-stone-200">
              <td colSpan={4} className="py-2 text-right font-semibold text-stone-900">
                Total (CAPEX)
              </td>
              <td className="py-2 text-right text-base font-bold text-stone-900">
                USD {fmt(capex)}
              </td>
              <td />
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Agregar línea manual */}
      <div className="mt-3 flex flex-wrap items-end gap-2 border-t border-stone-100 pt-3">
        <div className="min-w-[180px] flex-1">
          <label className="mb-1 block text-[10px] font-medium uppercase text-stone-400">
            Ítem manual
          </label>
          <input
            className={inputCls}
            value={nuevo.item}
            onChange={(e) => setNuevo({ ...nuevo, item: e.target.value })}
            placeholder="Ej: Adecuación de tablero"
          />
        </div>
        <div className="w-20">
          <label className="mb-1 block text-[10px] font-medium uppercase text-stone-400">
            Cant.
          </label>
          <input
            className={inputCls}
            type="number"
            min="1"
            value={nuevo.cantidad}
            onChange={(e) => setNuevo({ ...nuevo, cantidad: Number(e.target.value) })}
          />
        </div>
        <div className="w-28">
          <label className="mb-1 block text-[10px] font-medium uppercase text-stone-400">
            Unitario USD
          </label>
          <input
            className={inputCls}
            type="number"
            min="0"
            value={nuevo.unitarioUsd}
            onChange={(e) => setNuevo({ ...nuevo, unitarioUsd: Number(e.target.value) })}
          />
        </div>
        <button
          onClick={agregarManual}
          className="flex h-[38px] items-center gap-1 rounded-lg border border-stone-300 px-3 text-xs font-medium text-stone-600 hover:bg-stone-50"
        >
          <Plus className="h-3.5 w-3.5" />
          Agregar
        </button>
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-stone-500">
        {label}
      </label>
      {children}
    </div>
  );
}
