"use client";

import { useMemo } from "react";
import {
  AlertCircle,
  ArrowRight,
  Calculator,
  Info,
  Loader2,
  TrendingUp,
} from "lucide-react";
import {
  applyEconomicsToResult,
  ECONOMICS_HORIZONTE_ANOS,
  mergeEconomicsParams,
} from "@/lib/cotizador/economics-overrides";
import { buildQuoteInput, useCotizador } from "../context/CotizadorContext";
import { useLiveQuote } from "../hooks/useLiveQuote";
import {
  BtnPrimary,
  BtnSecondary,
  FormCard,
  FormField,
  inputCls,
  ValidationHint,
} from "./ui/cotizador-ui";

function fmt(n: number, dec = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function fmtUsd(n: number): string {
  return `US$ ${fmt(n, 0)}`;
}

function pctDisplay(frac: number): string {
  return `${(frac * 100).toFixed(frac < 0.01 ? 2 : 1)} %`;
}

function numOrEmpty(v: number | null | undefined): string {
  return v == null ? "" : String(v);
}

export function StepEconomics({
  onBack,
  onGenerarReporte,
  calculando,
}: {
  onBack: () => void;
  onGenerarReporte: () => void | Promise<void>;
  calculando: boolean;
}) {
  const { state, dispatch } = useCotizador();
  const { result: liveResult, catalog, pvgis } = useLiveQuote();
  const { consumo, ajustes, economicsOverrides } = state;
  const isBusy = calculando;

  const baseResult = liveResult ?? state.result;
  const params = catalog?.parametros;

  const mergedParams = useMemo(
    () => (params ? mergeEconomicsParams(params, economicsOverrides) : null),
    [params, economicsOverrides]
  );

  const preview = useMemo(() => {
    if (!baseResult || !catalog || !pvgis || !mergedParams) return null;
    const consumoInput = buildQuoteInput(state).consumo;
    return applyEconomicsToResult(
      baseResult,
      consumoInput,
      pvgis,
      catalog.parametros,
      economicsOverrides
    );
  }, [baseResult, catalog, pvgis, economicsOverrides, state]);

  if (!baseResult || !catalog || !preview) {
    return (
      <div className="flex h-full items-center justify-center bg-slate-50 text-slate-500">
        Completá el paso de equipos antes de revisar el modelo económico.
      </div>
    );
  }

  const eco = preview.economics;
  const { bom } = preview;
  const capexUsd = bom.capexUsd;
  const costoUsd = bom.costoUsd;
  const margenPct = ajustes.margenPct ?? catalog.parametros.margenDefault;
  const tarifaIny =
    consumo.tarifaInyeccionUsdKwh ?? catalog.parametros.tarifaInyeccion;
  const consumoAnual = consumo.mensualKwh.reduce((a, b) => a + b, 0);
  const consumoDiurnoAnual = Math.round(consumoAnual * consumo.pctDiurno);
  const ano1 = eco.proyeccion[0];
  const flujoNetoAno1 = eco.ahorroAnualUsd - eco.opexAnualUsd;

  const checklist = [
    {
      ok: consumo.habilitado && consumoAnual > 0,
      text: "Consumo anual cargado (paso Consumo)",
    },
    {
      ok: consumo.tarifaUsdKwh > 0,
      text: "Tarifa de compra de energía definida",
    },
    {
      ok: consumo.pctDiurno > 0 && consumo.pctDiurno <= 1,
      text: "% diurno coherente con el perfil de carga industrial",
    },
    {
      ok: tarifaIny >= 0,
      text: "Tarifa de inyección acorde a la distribuidora (Ley 27.424)",
    },
    {
      ok: capexUsd > 0,
      text: "CAPEX incluye equipos, estructura, ingeniería y margen comercial",
    },
    {
      ok: eco.paybackAnos !== null && eco.paybackAnos < ECONOMICS_HORIZONTE_ANOS,
      text: `Recupero simple dentro del horizonte de ${ECONOMICS_HORIZONTE_ANOS} años`,
    },
    {
      ok: eco.vanUsd > 0,
      text: `VAN positivo al ${pctDisplay(mergedParams!.tasaDescuento)} de descuento`,
    },
  ];

  const checklistOk = checklist.filter((c) => c.ok).length;

  return (
    <div className="h-full overflow-y-auto bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-5">
        <header>
          <h2 className="text-lg font-semibold text-slate-900">5 · Modelo económico</h2>
          <p className="mt-1 text-sm text-slate-600">
            Revisá supuestos financieros antes de generar el reporte. Los cambios aquí actualizan
            payback, VAN y TIR del proyecto.
          </p>
        </header>

        {/* Checklist asesor */}
        <div className="rounded-xl border border-sky-200 bg-sky-50/80 p-4">
          <div className="mb-2 flex items-center gap-2 text-sky-900">
            <Calculator className="h-4 w-4 shrink-0" />
            <p className="text-sm font-semibold">
              Checklist pre-reporte ({checklistOk}/{checklist.length})
            </p>
          </div>
          <ul className="space-y-1.5 text-sm">
            {checklist.map((item) => (
              <li
                key={item.text}
                className={`flex items-start gap-2 ${item.ok ? "text-sky-800" : "text-amber-800"}`}
              >
                <span className="mt-0.5 shrink-0">{item.ok ? "✓" : "○"}</span>
                {item.text}
              </li>
            ))}
          </ul>
        </div>

        {/* Preview KPIs */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Kpi label="Inversión" value={fmtUsd(capexUsd)} />
          <Kpi label="Ahorro año 1" value={fmtUsd(eco.ahorroAnualUsd)} highlight />
          <Kpi
            label="Recupero"
            value={eco.paybackAnos != null ? `${fmt(eco.paybackAnos, 1)} años` : "—"}
          />
          <Kpi label="VAN (25 a)" value={fmtUsd(eco.vanUsd)} />
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {/* Inversión */}
          <FormCard title="Inversión (CAPEX)">
            <ReadRow label="Costo directo (BOM)" value={fmtUsd(costoUsd)} />
            <ReadRow label="Margen comercial" value={pctDisplay(margenPct)} />
            <FormField label="Margen % (override)">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                max="100"
                placeholder={String(Math.round(margenPct * 100))}
                value={
                  ajustes.margenPct != null ? Math.round(ajustes.margenPct * 1000) / 10 : ""
                }
                onChange={(e) =>
                  dispatch({
                    type: "SET_AJUSTES",
                    ajustes: {
                      margenPct: e.target.value === "" ? null : Number(e.target.value) / 100,
                    },
                  })
                }
              />
              <p className="mt-1 text-xs text-slate-400">Vacío = default del catálogo.</p>
            </FormField>
            <FormField label="Descuento comercial %">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                max="50"
                value={Math.round(ajustes.descuentoPct * 1000) / 10}
                onChange={(e) =>
                  dispatch({
                    type: "SET_AJUSTES",
                    ajustes: { descuentoPct: Number(e.target.value) / 100 },
                  })
                }
              />
            </FormField>
            <ReadRow label="CAPEX final" value={fmtUsd(capexUsd)} strong />
            <AdvisorNote>
              Verificá que el margen refleje la política comercial vigente y que ingeniería /
              trámites estén en el BOM.
            </AdvisorNote>
          </FormCard>

          {/* Ingresos */}
          <FormCard title="Ingresos — año 1">
            <ReadRow
              label="Consumo anual"
              value={`${fmt(consumoAnual)} kWh (${fmt(consumoDiurnoAnual)} diurno)`}
            />
            <FormField label="Tarifa de compra (USD/kWh)">
              <input
                className={inputCls}
                type="number"
                step="0.001"
                min="0"
                value={consumo.tarifaUsdKwh}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONSUMO_FINANCIERO",
                    consumo: { tarifaUsdKwh: Number(e.target.value) },
                  })
                }
              />
            </FormField>
            <FormField label="Tarifa de inyección (USD/kWh)">
              <input
                className={inputCls}
                type="number"
                step="0.001"
                min="0"
                placeholder={String(catalog.parametros.tarifaInyeccion)}
                value={consumo.tarifaInyeccionUsdKwh ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONSUMO_FINANCIERO",
                    consumo: {
                      tarifaInyeccionUsdKwh:
                        e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
              />
            </FormField>
            <FormField label="% consumo en horario diurno">
              <input
                className={inputCls}
                type="number"
                min="0"
                max="100"
                value={Math.round(consumo.pctDiurno * 100)}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONSUMO_FINANCIERO",
                    consumo: { pctDiurno: Number(e.target.value) / 100 },
                  })
                }
              />
            </FormField>
            <ReadRow
              label="Autoconsumo × tarifa"
              value={fmtUsd(ano1.autoconsumoKwh * consumo.tarifaUsdKwh)}
            />
            <ReadRow
              label="Inyección × tarifa"
              value={fmtUsd(ano1.excedenteKwh * tarifaIny)}
            />
            <ReadRow label="Total ingresos año 1" value={fmtUsd(eco.ahorroAnualUsd)} strong />
            <AdvisorNote>
              El autoconsumo se calcula mes a mes: min(producción, consumo diurno). Confirmá el %
              diurno con el cliente.
            </AdvisorNote>
          </FormCard>

          {/* OPEX y modelo */}
          <FormCard title="Costos operativos (OPEX)">
            <FormField label="OPEX (USD/kWp·año)">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                placeholder={String(catalog.parametros.opexUsdKwp)}
                value={numOrEmpty(economicsOverrides.opexUsdKwp)}
                onChange={(e) =>
                  dispatch({
                    type: "SET_ECONOMICS_OVERRIDES",
                    overrides: {
                      opexUsdKwp: e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
              />
            </FormField>
            <ReadRow
              label="OPEX anual sistema"
              value={fmtUsd(eco.opexAnualUsd)}
            />
            <ReadRow label="Flujo neto año 1" value={fmtUsd(flujoNetoAno1)} strong />
            <AdvisorNote>
              Incluye limpieza, monitoreo y mantenimiento preventivo. No cubre reemplazo de
              inversor ni seguros.
            </AdvisorNote>
          </FormCard>

          <FormCard title="Parámetros del modelo (25 años)">
            <ReadRow label="Horizonte" value={`${ECONOMICS_HORIZONTE_ANOS} años`} />
            <FormField label="Tasa de descuento VAN %">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                max="30"
                placeholder={String(Math.round(catalog.parametros.tasaDescuento * 1000) / 10)}
                value={
                  economicsOverrides.tasaDescuento != null
                    ? Math.round(economicsOverrides.tasaDescuento * 1000) / 10
                    : ""
                }
                onChange={(e) =>
                  dispatch({
                    type: "SET_ECONOMICS_OVERRIDES",
                    overrides: {
                      tasaDescuento: e.target.value === "" ? null : Number(e.target.value) / 100,
                    },
                  })
                }
              />
            </FormField>
            <FormField label="Degradación anual paneles %">
              <input
                className={inputCls}
                type="number"
                step="0.05"
                min="0"
                max="2"
                placeholder={String(catalog.parametros.degradacionAnual * 100)}
                value={
                  economicsOverrides.degradacionAnual != null
                    ? Math.round(economicsOverrides.degradacionAnual * 10000) / 100
                    : ""
                }
                onChange={(e) =>
                  dispatch({
                    type: "SET_ECONOMICS_OVERRIDES",
                    overrides: {
                      degradacionAnual:
                        e.target.value === "" ? null : Number(e.target.value) / 100,
                    },
                  })
                }
              />
            </FormField>
            <FormField label="Escalación tarifaria real %/año">
              <input
                className={inputCls}
                type="number"
                step="0.5"
                min="0"
                max="15"
                placeholder={String(catalog.parametros.escalacionTarifaReal * 100)}
                value={
                  economicsOverrides.escalacionTarifaReal != null
                    ? Math.round(economicsOverrides.escalacionTarifaReal * 1000) / 10
                    : ""
                }
                onChange={(e) =>
                  dispatch({
                    type: "SET_ECONOMICS_OVERRIDES",
                    overrides: {
                      escalacionTarifaReal:
                        e.target.value === "" ? null : Number(e.target.value) / 100,
                    },
                  })
                }
              />
            </FormField>
            <FormField label="Factor CO₂ (kg/kWh)">
              <input
                className={inputCls}
                type="number"
                step="0.01"
                min="0"
                placeholder={String(catalog.parametros.co2KgKwh)}
                value={numOrEmpty(economicsOverrides.co2KgKwh)}
                onChange={(e) =>
                  dispatch({
                    type: "SET_ECONOMICS_OVERRIDES",
                    overrides: {
                      co2KgKwh: e.target.value === "" ? null : Number(e.target.value),
                    },
                  })
                }
              />
            </FormField>
            <ReadRow
              label="TIR"
              value={eco.tirPct != null ? `${fmt(eco.tirPct, 1)} %` : "—"}
            />
            <ReadRow
              label="CO₂ evitado/año"
              value={`${fmt(eco.co2EvitadoTonAno, 1)} t`}
            />
            <AdvisorNote>
              Payback simple = CAPEX ÷ flujo neto año 1. VAN y TIR usan flujos a {ECONOMICS_HORIZONTE_ANOS}{" "}
              años con degradación y escalación configuradas.
            </AdvisorNote>
          </FormCard>
        </div>

        {!consumo.habilitado && (
          <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>
              El consumo no está habilitado: los ingresos por autoconsumo serán cero. Activá el
              consumo en el paso 3 para un modelo económico completo.
            </span>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-slate-200 pt-2">
          {eco.paybackAnos === null && (
            <ValidationHint>
              El flujo neto del año 1 no es positivo: no hay recupero simple con estos supuestos.
            </ValidationHint>
          )}
          <div className="flex gap-3">
            <BtnSecondary onClick={onBack} className="flex-1" disabled={isBusy}>
              ← Equipos
            </BtnSecondary>
            <BtnPrimary
              onClick={() => void onGenerarReporte()}
              disabled={isBusy}
              className="relative flex flex-1 items-center justify-center gap-2"
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Generando reporte…
                </>
              ) : (
                <>
                  <TrendingUp className="h-4 w-4" />
                  Generar reporte
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
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
  highlight = false,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 shadow-sm ${
        highlight ? "border-amber-300 bg-amber-50" : "border-slate-200 bg-white"
      }`}
    >
      <p className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">{label}</p>
      <p className={`mt-1 text-lg font-bold ${highlight ? "text-amber-900" : "text-slate-800"}`}>
        {value}
      </p>
    </div>
  );
}

function ReadRow({
  label,
  value,
  strong = false,
}: {
  label: string;
  value: string;
  strong?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-2 border-b border-slate-100 py-2 text-sm last:border-0">
      <span className={strong ? "font-semibold text-slate-700" : "text-slate-500"}>{label}</span>
      <span className={strong ? "font-semibold text-slate-900" : "text-slate-800"}>{value}</span>
    </div>
  );
}

function AdvisorNote({ children }: { children: React.ReactNode }) {
  return (
    <p className="flex items-start gap-1.5 rounded-lg bg-slate-50 px-2.5 py-2 text-xs text-slate-500">
      <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-slate-400" />
      {children}
    </p>
  );
}
