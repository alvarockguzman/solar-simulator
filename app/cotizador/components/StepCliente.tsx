"use client";

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import { searchAddress, type NominatimResult } from "@/app/calculadora/lib/geocode";
import {
  REPRESENTANTE_ALVARO,
  suggestProyectoNombre,
} from "@/lib/cotizador/cliente-utils";
import {
  KWP_PRESETS,
  matchKwpPreset,
} from "@/lib/cotizador/presets";
import { useWizardShortcut } from "../hooks/useWizardShortcut";
import { useCotizador } from "../context/CotizadorContext";
import {
  BtnPrimary,
  FormCard,
  FormField,
  inputClsEmpty,
  KeyboardHint,
  PresetCards,
  selectCls,
  ValidationHint,
} from "./ui/cotizador-ui";

const MapAddress = dynamic(
  () => import("@/app/calculadora/components/MapAddress").then((m) => m.MapAddress),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-slate-200" /> }
);

export function StepCliente({ onNext }: { onNext: () => void }) {
  const { state, dispatch } = useCotizador();
  const { cliente } = state;
  const [query, setQuery] = useState(cliente.direccion);
  const [results, setResults] = useState<NominatimResult[]>([]);
  const [searching, setSearching] = useState(false);
  const debounceRef = useRef<number>();

  useEffect(() => {
    if (!query.trim() || query === cliente.direccion) {
      setResults([]);
      return;
    }
    window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(async () => {
      setSearching(true);
      const res = await searchAddress(query);
      setResults(res);
      setSearching(false);
    }, 500);
    return () => window.clearTimeout(debounceRef.current);
  }, [query, cliente.direccion]);

  const canContinue =
    cliente.razonSocial.trim().length > 0 && (state.techo.kwpDeseado ?? 0) > 0;

  useWizardShortcut(onNext, canContinue);

  const selectAddress = useCallback(
    (r: NominatimResult) => {
      dispatch({
        type: "SET_CLIENTE",
        cliente: {
          direccion: r.display_name,
          lat: Number(r.lat),
          lon: Number(r.lon),
        },
      });
      if (!state.proyectoNombre.trim()) {
        const sugerido = suggestProyectoNombre(cliente.razonSocial, r.display_name);
        if (sugerido) {
          dispatch({ type: "SET_PROYECTO", proyectoNombre: sugerido });
        }
      }
      setQuery(r.display_name);
      setResults([]);
    },
    [cliente.razonSocial, dispatch, state.proyectoNombre]
  );

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] lg:grid-cols-[minmax(320px,30%)_1fr] lg:grid-rows-1">
      <div className="overflow-y-auto border-r border-slate-200 bg-white p-5 sm:p-6">
        <header className="mb-5">
          <h2 className="text-lg font-semibold text-slate-900">1 · Cliente</h2>
          <p className="mt-1 text-sm text-slate-500">
            Datos del cliente y ubicación de la planta.
          </p>
        </header>

        <div className="space-y-4">
          <FormCard title="Datos generales">
            <FormField label="Razón social *">
              <input
                className={inputClsEmpty(cliente.razonSocial)}
                value={cliente.razonSocial}
                onChange={(e) =>
                  dispatch({ type: "SET_CLIENTE", cliente: { razonSocial: e.target.value } })
                }
                placeholder="Industria SA"
              />
            </FormField>
            <FormField label="Nombre del proyecto">
              <input
                className={inputClsEmpty(state.proyectoNombre)}
                value={state.proyectoNombre}
                onChange={(e) =>
                  dispatch({ type: "SET_PROYECTO", proyectoNombre: e.target.value })
                }
                placeholder="Se sugiere al elegir dirección"
              />
            </FormField>
            <FormField label="Contacto Cliente">
              <input
                className={inputClsEmpty(cliente.contacto)}
                value={cliente.contacto}
                onChange={(e) =>
                  dispatch({ type: "SET_CLIENTE", cliente: { contacto: e.target.value } })
                }
                placeholder="Nombre y apellido"
              />
            </FormField>
            <FormField label="Representante Comercial">
              <select
                className={selectCls}
                value={cliente.representanteModo}
                onChange={(e) =>
                  dispatch({
                    type: "SET_CLIENTE",
                    cliente: {
                      representanteModo: e.target.value as "alvaro" | "otro",
                    },
                  })
                }
              >
                <option value="alvaro">{REPRESENTANTE_ALVARO}</option>
                <option value="otro">Otro</option>
              </select>
              {cliente.representanteModo === "otro" && (
                <input
                  className={`${inputClsEmpty(cliente.representanteOtro)} mt-2`}
                  value={cliente.representanteOtro}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_CLIENTE",
                      cliente: { representanteOtro: e.target.value },
                    })
                  }
                  placeholder="Nombre del representante"
                />
              )}
            </FormField>
          </FormCard>

          <FormCard title="Ubicación y escala">
            <PresetCards
              label="Potencia del proyecto *"
              options={KWP_PRESETS.map((p) => ({
                id: p.id,
                title: p.title,
                subtitle: p.subtitle,
              }))}
              selected={matchKwpPreset(state.techo.kwpDeseado)}
              onSelect={(id) => {
                const preset = KWP_PRESETS.find((p) => p.id === id);
                if (preset) {
                  dispatch({ type: "SET_TECHO", techo: { kwpDeseado: preset.kwp } });
                }
              }}
            />

            <FormField label="Potencia personalizada (kWp)">
              <input
                className={inputClsEmpty(state.techo.kwpDeseado)}
                type="number"
                min="1"
                step="0.1"
                value={state.techo.kwpDeseado ?? ""}
                onChange={(e) =>
                  dispatch({
                    type: "SET_TECHO",
                    techo: { kwpDeseado: Number(e.target.value) || null },
                  })
                }
                placeholder="Otro valor en kWp"
              />
            </FormField>

            <FormField label="Dirección">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  className={`${inputClsEmpty(query)} pl-9`}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar dirección…"
                />
              </div>
              {searching && <p className="mt-1 text-xs text-slate-400">Buscando…</p>}
              {results.length > 0 && (
                <ul className="mt-1 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-md">
                  {results.map((r) => (
                    <li key={r.place_id}>
                      <button
                        type="button"
                        className="flex w-full items-start gap-2 px-3 py-2 text-left text-xs text-slate-700 hover:bg-amber-50"
                        onClick={() => selectAddress(r)}
                      >
                        <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-amber-600" />
                        {r.display_name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </FormField>

            <div className="grid grid-cols-2 gap-3">
              <FormField label="Latitud">
                <input
                  className={inputClsEmpty(cliente.lat)}
                  type="number"
                  step="0.00001"
                  value={cliente.lat}
                  onChange={(e) =>
                    dispatch({ type: "SET_CLIENTE", cliente: { lat: Number(e.target.value) } })
                  }
                />
              </FormField>
              <FormField label="Longitud">
                <input
                  className={inputClsEmpty(cliente.lon)}
                  type="number"
                  step="0.00001"
                  value={cliente.lon}
                  onChange={(e) =>
                    dispatch({ type: "SET_CLIENTE", cliente: { lon: Number(e.target.value) } })
                  }
                />
              </FormField>
            </div>
          </FormCard>

          {!canContinue && (
            <ValidationHint>
              {!cliente.razonSocial.trim() && "Completá la razón social. "}
              {(state.techo.kwpDeseado ?? 0) <= 0 && "Indicá la potencia del proyecto (kWp)."}
            </ValidationHint>
          )}

          <BtnPrimary onClick={onNext} disabled={!canContinue} className="w-full">
            Continuar → Techo
          </BtnPrimary>
          <KeyboardHint />
        </div>
      </div>

      <div className="min-h-[280px] lg:min-h-0">
        <MapAddress
          center={{ lat: cliente.lat, lng: cliente.lon }}
          marker={{ lat: cliente.lat, lng: cliente.lon }}
          onMarkerChange={(lat, lng) =>
            dispatch({ type: "SET_CLIENTE", cliente: { lat, lon: lng } })
          }
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
