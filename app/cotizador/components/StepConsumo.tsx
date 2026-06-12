"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useState } from "react";
import {
  CONSUMO_PRESETS,
  matchConsumoPreset,
  TARIFA_NIVELES,
  type ConsumoPresetId,
  type TarifaNivel,
} from "@/lib/cotizador/presets";
import { useCotizador } from "../context/CotizadorContext";
import {
  BtnPrimary,
  BtnSecondary,
  FormField,
  inputCls,
  PresetCards,
  SegmentedControl,
  ValidationHint,
} from "./ui/cotizador-ui";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

export function StepConsumo({
  onContinuar,
  onBack,
  calculando,
}: {
  onContinuar: () => void | Promise<void>;
  onBack: () => void;
  calculando: boolean;
}) {
  const { state, dispatch } = useCotizador();
  const { consumo } = state;
  const consumoAnual = consumo.mensualKwh.reduce((a, b) => a + b, 0);
  const consumoInvalido =
    consumo.habilitado && (consumoAnual <= 0 || consumo.tarifaUsdKwh <= 0);
  const [clicked, setClicked] = useState(false);
  const isBusy = calculando || clicked;

  useEffect(() => {
    if (!calculando) setClicked(false);
  }, [calculando]);

  async function handleContinuar() {
    if (isBusy || consumoInvalido) return;
    setClicked(true);
    try {
      await onContinuar();
    } finally {
      if (!calculando) setClicked(false);
    }
  }

  function applyConsumoPreset(id: ConsumoPresetId) {
    const preset = CONSUMO_PRESETS.find((p) => p.id === id);
    if (!preset) return;
    dispatch({
      type: "SET_CONSUMO",
      consumo: {
        habilitado: true,
        modo: "promedio",
        consumoPreset: id,
        promedioKwh: preset.promedioKwh,
      },
    });
  }

  function applyTarifaNivel(nivel: TarifaNivel) {
    dispatch({
      type: "SET_CONSUMO",
      consumo: { tarifaNivel: nivel, tarifaModo: "directa" },
    });
  }

  return (
    <div className="relative h-full overflow-y-auto bg-slate-50 px-4 py-8 sm:px-6">
      <div className="mx-auto max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-lg sm:p-8">
        <header className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">3 · Consumo y tarifa</h2>
          <p className="mt-1 text-sm text-slate-500">
            Opcional. Elegí un perfil típico o cargá datos a mano para comparar en el reporte.
          </p>
        </header>

        <PresetCards
          label="Perfil de consumo (industria / comercial)"
          options={CONSUMO_PRESETS.map((p) => ({
            id: p.id,
            title: p.title,
            subtitle: p.subtitle,
          }))}
          selected={
            consumo.habilitado
              ? consumo.consumoPreset ?? matchConsumoPreset(consumo.promedioKwh)
              : null
          }
          onSelect={applyConsumoPreset}
        />

        <label className="mb-6 mt-4 flex cursor-pointer items-center gap-2.5 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm font-medium text-slate-700">
          <input
            type="checkbox"
            className="h-4 w-4 rounded accent-amber-600"
            checked={consumo.habilitado}
            onChange={(e) =>
              dispatch({ type: "SET_CONSUMO", consumo: { habilitado: e.target.checked } })
            }
          />
          Usar consumo en el reporte (comparación producción vs demanda)
        </label>

        {!consumo.habilitado && (
          <p className="mb-6 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2.5 text-xs text-slate-500">
            Sin consumo: el reporte muestra solo producción. Podés elegir un perfil arriba para
            activarlo al instante.
          </p>
        )}

        <div className={consumo.habilitado ? "space-y-6" : "pointer-events-none hidden"}>
          <PresetCards
            label="Tarifa Argentina (nivel)"
            options={TARIFA_NIVELES.map((t) => ({
              id: t.id,
              title: t.title,
              subtitle: `${t.subtitle} · ${t.usdKwh} USD/kWh`,
            }))}
            selected={consumo.tarifaNivel}
            onSelect={applyTarifaNivel}
          />

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Detalle de carga
            </p>
            <SegmentedControl
              options={[
                { value: "promedio" as const, label: "Promedio mensual" },
                { value: "doce" as const, label: "12 meses" },
              ]}
              value={consumo.modo}
              onChange={(v) =>
                dispatch({
                  type: "SET_CONSUMO",
                  consumo: { modo: v, consumoPreset: null },
                })
              }
            />
          </div>

          {consumo.modo === "promedio" ? (
            <FormField label="Consumo promedio mensual (kWh)">
              <input
                className={inputCls}
                type="number"
                min="0"
                value={consumo.promedioKwh}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONSUMO",
                    consumo: {
                      promedioKwh: Number(e.target.value),
                      consumoPreset: null,
                    },
                  })
                }
              />
            </FormField>
          ) : (
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
              {MESES.map((mes, i) => (
                <FormField key={mes} label={mes}>
                  <input
                    className={inputCls}
                    type="number"
                    min="0"
                    value={consumo.mensualKwh[i]}
                    onChange={(e) => {
                      const mensualKwh = [...consumo.mensualKwh];
                      mensualKwh[i] = Number(e.target.value);
                      dispatch({
                        type: "SET_CONSUMO",
                        consumo: { mensualKwh, consumoPreset: null },
                      });
                    }}
                  />
                </FormField>
              ))}
            </div>
          )}

          <p className="text-xs text-slate-500">
            Consumo anual:{" "}
            <strong className="text-slate-800">
              {Math.round(consumoAnual).toLocaleString("es-AR")} kWh
            </strong>
            {" · "}
            Tarifa {consumo.tarifaNivel}:{" "}
            <strong className="text-slate-800">{consumo.tarifaUsdKwh} USD/kWh</strong>
          </p>

          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-500">
              Forma de tarifa (avanzado)
            </p>
            <SegmentedControl
              options={[
                { value: "directa" as const, label: "USD/kWh directo" },
                { value: "factura" as const, label: "Factura mensual USD" },
              ]}
              value={consumo.tarifaModo}
              onChange={(v) => dispatch({ type: "SET_CONSUMO", consumo: { tarifaModo: v } })}
            />
          </div>

          {consumo.tarifaModo === "directa" ? (
            <FormField label="Tarifa media (USD/kWh)">
              <input
                className={inputCls}
                type="number"
                step="0.001"
                min="0"
                value={consumo.tarifaUsdKwh}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CONSUMO",
                    consumo: { tarifaUsdKwh: Number(e.target.value) },
                  })
                }
              />
            </FormField>
          ) : (
            <div className="grid grid-cols-2 gap-3">
              <FormField label="Factura mensual (USD)">
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  value={consumo.facturaMensualUsd}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_CONSUMO",
                      consumo: { facturaMensualUsd: Number(e.target.value) },
                    })
                  }
                />
              </FormField>
              <FormField label="Tarifa implícita (USD/kWh)">
                <input className={inputCls} value={consumo.tarifaUsdKwh} readOnly disabled />
              </FormField>
            </div>
          )}

          <FormField label="% del consumo en horario diurno">
            <input
              className={inputCls}
              type="number"
              min="0"
              max="100"
              value={Math.round(consumo.pctDiurno * 100)}
              onChange={(e) =>
                dispatch({
                  type: "SET_CONSUMO",
                  consumo: { pctDiurno: Number(e.target.value) / 100 },
                })
              }
            />
            <p className="mt-1 text-xs text-slate-400">Default 70% para industria.</p>
          </FormField>

          <FormField label="Tarifa de inyección (USD/kWh)">
            <input
              className={inputCls}
              type="number"
              step="0.001"
              min="0"
              placeholder={
                state.catalog
                  ? String(state.catalog.parametros.tarifaInyeccion)
                  : "0.035"
              }
              value={consumo.tarifaInyeccionUsdKwh ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_CONSUMO",
                  consumo: {
                    tarifaInyeccionUsdKwh:
                      e.target.value === "" ? null : Number(e.target.value),
                  },
                })
              }
            />
            <p className="mt-1 text-xs text-slate-400">
              Según Ley 27.424; depende de la distribuidora provincial. 0 si no será
              usuario-generador. Vacío = default del catálogo.
            </p>
          </FormField>
        </div>

        <div className="mt-8 flex flex-col gap-3 border-t border-slate-100 pt-6">
          {consumoInvalido && (
            <ValidationHint>
              Completá el consumo anual y la tarifa antes de calcular el reporte.
            </ValidationHint>
          )}
          <div className="flex gap-3">
            <BtnSecondary onClick={onBack} className="flex-1" disabled={isBusy}>
              ← Techo
            </BtnSecondary>
            <BtnPrimary
              onClick={() => void handleContinuar()}
              disabled={isBusy || consumoInvalido}
              aria-busy={isBusy}
              className={`relative flex flex-1 items-center justify-center gap-2 overflow-hidden ${
                isBusy ? "animate-pulse !cursor-wait bg-amber-700 !opacity-100" : ""
              }`}
            >
              {isBusy ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" aria-hidden />
                  <span>Preparando equipos…</span>
                  <span className="inline-flex gap-0.5" aria-hidden>
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:0ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:150ms]" />
                    <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-white [animation-delay:300ms]" />
                  </span>
                </>
              ) : (
                <>
                  Continuar → Equipos
                </>
              )}
            </BtnPrimary>
          </div>
        </div>
      </div>
    </div>
  );
}
