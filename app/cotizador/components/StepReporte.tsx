"use client";

import { useState } from "react";
import {
  Bar,
  CartesianGrid,
  Cell,
  ComposedChart,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { AlertTriangle, FileDown, Loader2, Pencil } from "lucide-react";
import { buildQuoteInput, useCotizador } from "../context/CotizadorContext";
import { QuoteWarningList } from "./QuoteWarningList";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const DONUT_COLORS = [
  "#d97706", "#f59e0b", "#fbbf24", "#a8a29e", "#78716c",
  "#0ea5e9", "#38bdf8", "#7dd3fc", "#facc15", "#fde047",
];

function fmt(n: number, dec = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

export function StepReporte({
  onBack,
  onRecalcular,
}: {
  onBack: () => void;
  onRecalcular: () => void;
}) {
  const { state } = useCotizador();
  const { report, result, needsRecalc, dirty } = state;
  const [pdfLoading, setPdfLoading] = useState(false);
  const [pdfError, setPdfError] = useState<string | null>(null);

  if (!report || !result) {
    return (
      <div className="flex h-full items-center justify-center text-stone-500">
        Sin resultados. Volvé al paso anterior y calculá el reporte.
      </div>
    );
  }

  const { metrics, tablaMensual, cascada, dona, bomTecnico, fieldSegment, warnings } = report;
  const isFallback = result.pvgis.source === "fallback";
  const autoconsumoObj = state.catalog?.parametros.autoconsumoObjetivo ?? 1;
  const yieldKwp = result.pvgis.yieldKwhPerKwpYear;
  const kwpMaxTecho = result.sizing.kwpMaxTecho;
  const consumoPromedio = state.consumo.modo === "promedio";
  const produccionAnualKwh = report.produccionMensualKwh.reduce((a, b) => a + b, 0);
  const consumoAnualKwh =
    report.consumoMensualKwh?.reduce((a, b) => a + b, 0) ?? 0;
  const kwpParaCubrir =
    consumoAnualKwh > 0 && yieldKwp > 0
      ? (consumoAnualKwh * autoconsumoObj) / yieldKwp
      : null;
  const coberturaPct =
    consumoAnualKwh > 0 ? (produccionAnualKwh / consumoAnualKwh) * 100 : null;

  const chartData = MESES.map((mes, i) => ({
    mes,
    Producción: Math.round(report.produccionMensualKwh[i]),
    ...(report.consumoMensualKwh ? { Consumo: Math.round(report.consumoMensualKwh[i]) } : {}),
  }));

  async function descargarPdf() {
    setPdfLoading(true);
    setPdfError(null);
    try {
      const res = await fetch("/api/cotizador/report/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          report,
          snapshotDataUrl: state.techo.snapshotDataUrl,
          cliente: state.cliente.razonSocial,
          borrador: isFallback,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "Error generando el PDF.");
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Reporte de Produccion${isFallback ? " BORRADOR" : ""} - ${state.cliente.razonSocial || "proyecto"}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setPdfError(err instanceof Error ? err.message : "Error generando el PDF.");
    } finally {
      setPdfLoading(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto bg-slate-50">
      {/* Sticky header con acciones */}
      <div className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0">
            <h2 className="truncate text-lg font-semibold text-slate-900 sm:text-xl">
              Reporte de Producción — {report.proyecto.nombre || "Sin nombre"}
            </h2>
            <p className="truncate text-xs text-slate-500 sm:text-sm">
              {report.proyecto.direccion} · {report.proyecto.fecha} · Fuente:{" "}
              {metrics.fuenteClimatica}
            </p>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={onBack}
              className="flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50"
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Editar equipos</span>
            </button>
            <button
              type="button"
              onClick={descargarPdf}
              disabled={pdfLoading || needsRecalc}
              title={
                needsRecalc
                  ? "Recalculá el reporte antes de descargar el PDF"
                  : undefined
              }
              className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-amber-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {pdfLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <FileDown className="h-4 w-4" />
              )}
              Descargar PDF
            </button>
          </div>
        </div>
        {pdfError && (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-center text-sm text-red-600 sm:px-6">
            {pdfError}
          </p>
        )}
      </div>

      <div className="mx-auto max-w-5xl space-y-5 p-4 sm:p-6">
      {isFallback && (
        <div
          role="alert"
          className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-3 text-sm font-medium text-amber-950"
        >
          PRODUCCIÓN ESTIMADA — datos satelitales no disponibles, validar antes de enviar
        </div>
      )}

      {needsRecalc && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-3 rounded-r-lg border border-amber-200 border-l-4 border-l-amber-500 bg-amber-50 px-4 py-3"
        >
          <div className="flex items-start gap-2 text-sm text-amber-950">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Modificaste datos del proyecto. Los números pueden estar desactualizados — recalculá
              antes de enviar el PDF.
            </span>
          </div>
          <button
            type="button"
            onClick={onRecalcular}
            className="shrink-0 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700"
          >
            Ir a recalcular
          </button>
        </div>
      )}

      {dirty && !needsRecalc && (
        <p className="text-center text-xs text-slate-500">
          Hay cambios sin guardar ·{" "}
          <kbd className="rounded border border-slate-200 bg-white px-1.5 py-0.5 font-mono text-[10px]">
            Ctrl+S
          </kbd>{" "}
          para guardar el proyecto
        </p>
      )}

      {/* Advertencias */}
      {warnings.length > 0 && <QuoteWarningList warnings={warnings} />}

      {/* KPIs */}
      {coberturaPct !== null && (
        <div
          className={`rounded-xl border p-4 shadow-sm ${
            coberturaPct >= 100
              ? "border-green-200 bg-green-50"
              : coberturaPct >= 70
              ? "border-amber-200 bg-amber-50"
              : "border-slate-200 bg-white"
          }`}
        >
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Cobertura del consumo
              </p>
              <p className="mt-1 text-3xl font-bold text-slate-800">
                {fmt(coberturaPct, 0)}%
              </p>
              <p className="mt-1 text-sm text-slate-600">
                Producción {fmt(produccionAnualKwh / 1000, 1)} MWh · Consumo{" "}
                {fmt(consumoAnualKwh / 1000, 1)} MWh/año
              </p>
              {kwpParaCubrir !== null && (
                <p className="mt-2 text-sm text-slate-700">
                  Para cubrir el consumo anual se necesitarían ~{fmt(kwpParaCubrir, 1)} kWp
                  {kwpMaxTecho > 0 && kwpParaCubrir > kwpMaxTecho
                    ? ` (el techo admite hasta ${fmt(kwpMaxTecho, 1)} kWp)`
                    : ""}
                  .
                </p>
              )}
            </div>
            <p className="max-w-xs text-xs text-slate-500">
              {coberturaPct >= 100
                ? "La producción estimada cubre el consumo anual declarado."
                : coberturaPct >= 70
                ? "Cobertura parcial: evaluar ampliar potencia o baterías."
                : "Producción inferior al consumo: el sistema no cubre la demanda anual."}
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <Metric label="kWp DC" value={fmt(metrics.kwpDc, 1)} />
        <Metric label="kW AC" value={fmt(metrics.kwAcTotal, 0)} />
        <Metric label="Load ratio" value={metrics.loadRatio ? metrics.loadRatio.toFixed(2) : "—"} />
        <Metric label="MWh/año" value={fmt(metrics.energiaAnualMwh, 1)} />
        <Metric label="PR" value={isFallback ? "n/d" : metrics.prPct !== null ? `${fmt(metrics.prPct, 1)}%` : "—"} />
        <Metric label="kWh/kWp·año" value={fmt(metrics.kwhPorKwp)} />
      </div>

      {/* Gráfico mensual + dona */}
      <div className="grid gap-5 lg:grid-cols-[3fr_2fr]">
        <Card
          title={
            report.consumoMensualKwh
              ? consumoPromedio
                ? "Producción vs consumo mensual (kWh) — consumo: promedio aplicado a los 12 meses"
                : "Producción vs consumo mensual (kWh)"
              : "Producción mensual (kWh)"
          }
        >
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="mes" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} width={56} />
                <Tooltip formatter={(v) => fmt(Number(v)) + " kWh"} />
                <Legend wrapperStyle={{ fontSize: 12 }} />
                <Bar
                  dataKey="Producción"
                  fill="#d97706"
                  radius={[3, 3, 0, 0]}
                  maxBarSize={report.consumoMensualKwh ? 28 : 40}
                />
                {report.consumoMensualKwh && (
                  <Bar
                    dataKey="Consumo"
                    fill="#0284c7"
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Pérdidas del sistema">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dona.map((d) => ({ name: d.etiqueta, value: d.pct }))}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="55%"
                  outerRadius="80%"
                  paddingAngle={1}
                >
                  {dona.map((_, i) => (
                    <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v) => `${Number(v).toFixed(1)}%`} />
                <Legend
                  layout="vertical"
                  align="right"
                  verticalAlign="middle"
                  wrapperStyle={{ fontSize: 11 }}
                  formatter={(name) => {
                    const slice = dona.find((d) => d.etiqueta === name);
                    return `${name} (${slice?.pct.toFixed(1)}%)`;
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      {/* Tabla mensual */}
      <Card title="Detalle mensual">
        <div className="overflow-x-auto">
          <table className="w-full text-right text-xs">
            <thead>
              <tr className="border-b border-stone-200 text-stone-500">
                <th className="py-1.5 pr-2 text-left font-medium">Mes</th>
                <th className="py-1.5 px-2 font-medium">GHI (kWh/m²)</th>
                {!isFallback && (
                  <>
                    <th className="py-1.5 px-2 font-medium">POA (kWh/m²)</th>
                    <th className="py-1.5 px-2 font-medium">Nameplate (kWh)</th>
                  </>
                )}
                <th className="py-1.5 pl-2 font-medium">A red (kWh)</th>
              </tr>
            </thead>
            <tbody>
              {tablaMensual.map((row, i) => (
                <tr
                  key={row.mes}
                  className={`border-b border-slate-100 ${i % 2 === 1 ? "bg-slate-50" : "bg-white"}`}
                >
                  <td className="py-2 pr-2 text-left text-slate-600">{MESES[row.mes - 1]}</td>
                  <td className="py-2 px-2">{row.ghiKwhM2 !== null ? fmt(row.ghiKwhM2, 1) : "—"}</td>
                  {!isFallback && (
                    <>
                      <td className="py-2 px-2">{row.poaKwhM2 !== null ? fmt(row.poaKwhM2, 1) : "—"}</td>
                      <td className="py-2 px-2">{row.nameplateKwh !== null ? fmt(row.nameplateKwh) : "—"}</td>
                    </>
                  )}
                  <td className="py-2 pl-2 font-semibold text-slate-800">{fmt(row.energiaRedKwh)}</td>
                </tr>
              ))}
              <tr className="bg-slate-100 font-semibold text-slate-900">
                <td className="py-2 pr-2 text-left">Año</td>
                <td className="py-1.5 px-2">
                  {fmt(tablaMensual.reduce((a, r) => a + (r.ghiKwhM2 ?? 0), 0))}
                </td>
                {!isFallback && (
                  <>
                    <td className="py-1.5 px-2">
                      {fmt(tablaMensual.reduce((a, r) => a + (r.poaKwhM2 ?? 0), 0))}
                    </td>
                    <td className="py-1.5 px-2">
                      {fmt(tablaMensual.reduce((a, r) => a + (r.nameplateKwh ?? 0), 0))}
                    </td>
                  </>
                )}
                <td className="py-1.5 pl-2">
                  {fmt(tablaMensual.reduce((a, r) => a + r.energiaRedKwh, 0))}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* Cascada */}
      <Card title="Cascada de pérdidas anual">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-stone-200 text-stone-500">
              <th className="py-1.5 text-left font-medium">Etapa</th>
              <th className="py-1.5 text-right font-medium">Energía (kWh)</th>
              <th className="py-1.5 text-right font-medium">Δ %</th>
            </tr>
          </thead>
          <tbody>
            {cascada.map((row, i) => {
              const esExtremo = i === 0 || i === cascada.length - 1;
              return (
                <tr
                  key={row.etapa}
                  className={`border-b border-stone-100 ${esExtremo ? "font-semibold text-stone-900" : "text-stone-600"}`}
                >
                  <td className="py-1.5">{row.etapa}</td>
                  <td className="py-1.5 text-right">{fmt(row.energiaKwh)}</td>
                  <td className="py-1.5 text-right">
                    {row.deltaPct !== 0 ? `${row.deltaPct.toFixed(1)}%` : ""}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Card>

      {/* BOM técnico + field segment + ajustes */}
      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Equipamiento (BOM técnico)">
          <table className="w-full text-xs">
            <tbody>
              {bomTecnico.map((row, i) => (
                <tr key={i} className="border-b border-stone-100">
                  <td className="py-1.5 pr-2 font-medium text-stone-500">{row.item}</td>
                  <td className="py-1.5 pr-2 text-stone-700">{row.detalle}</td>
                  <td className="py-1.5 text-right font-semibold text-stone-800">{row.cantidad}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-slate-500">
            Para cambiar panel, inversor o revisar insumos, usá el paso{" "}
            <strong className="text-slate-700">Equipos</strong> del wizard.
          </p>
        </Card>

        <Card title="Field segment">
          <table className="w-full text-xs">
            <tbody>
              <FieldRow
                label="Inclinación"
                value={
                  fieldSegment.tiltDeg !== null
                    ? `${fieldSegment.tiltDeg}°${fieldSegment.optimizadoPvgis ? " (óptimo PVGIS)" : ""}`
                    : "—"
                }
              />
              <FieldRow
                label="Azimut"
                value={
                  fieldSegment.azimutDeg !== null
                    ? `${fieldSegment.azimutDeg}° desde el norte${fieldSegment.optimizadoPvgis ? " (óptimo PVGIS)" : ""}`
                    : "—"
                }
              />
              <FieldRow label="Módulos" value={`${fieldSegment.nPaneles}`} />
              <FieldRow label="Packing" value={`${Math.round(fieldSegment.packing * 100)}%`} />
              <FieldRow label="Área bruta" value={`${fmt(fieldSegment.areaBrutaM2)} m²`} />
              <FieldRow label="Tipo de techo" value={fieldSegment.tipoTecho} />
            </tbody>
          </table>

          {state.techo.snapshotDataUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={state.techo.snapshotDataUrl}
              alt="Techo con polígono"
              className="mt-3 max-h-56 w-full rounded-lg border border-stone-200 object-cover"
            />
          ) : (
            <p className="mt-3 rounded-lg bg-stone-50 px-3 py-2 text-xs text-stone-500">
              Sin imagen del techo: capturala en el paso Techo para incluirla en el PDF.
            </p>
          )}
        </Card>
      </div>
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className="mt-1 text-2xl font-bold text-slate-800 sm:text-3xl">{value}</p>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h3 className="mb-3 text-sm font-semibold text-slate-800">{title}</h3>
      {children}
    </section>
  );
}

function FieldRow({ label, value }: { label: string; value: string }) {
  return (
    <tr className="border-b border-stone-100">
      <td className="py-1.5 pr-2 font-medium text-stone-500">{label}</td>
      <td className="py-1.5 text-right text-stone-800">{value}</td>
    </tr>
  );
}
