"use client";

import { useEffect, useMemo, useRef } from "react";
import { quote } from "@/lib/cotizador/engine";
import type { QuoteResult } from "@/lib/cotizador/types";
import { buildQuoteInput, useCotizador } from "../context/CotizadorContext";

function resultFingerprint(r: QuoteResult): string {
  return JSON.stringify({
    kwp: r.sizing.kwpSistema,
    panel: r.sizing.panel.modelo,
    nPaneles: r.sizing.nPaneles,
    inv: r.bom.inversores.map((i) => `${i.inversor.modelo}:${i.cantidad}`),
    lineas: r.bom.lineas.map((l) => `${l.id}:${l.cantidad}`),
  });
}

function pvgisFingerprint(
  kwp: number,
  lossPct: number,
  tipoTecho: string,
  azimutDeg: number | null,
  inclinacionDeg: number | null
): string {
  return [
    kwp.toFixed(2),
    lossPct.toFixed(1),
    tipoTecho,
    azimutDeg ?? "auto",
    inclinacionDeg ?? "auto",
  ].join("|");
}

/**
 * Recalcula quote() en memoria (sin re-render global por cada tecla).
 * Sincroniza result al contexto con debounce solo si cambió el dimensionamiento.
 */
export function useLiveQuote(): {
  result: QuoteResult | null;
  catalog: ReturnType<typeof useCotizador>["state"]["catalog"];
  pvgis: ReturnType<typeof useCotizador>["state"]["pvgis"];
} {
  const { state, dispatch } = useCotizador();
  const { catalog, pvgis, pvgisKwp, techo, consumo, ajustes, poligonos } = state;
  const refetchingPvgis = useRef(false);
  const syncTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedKey = useRef<string | null>(null);
  const lastFetchedFingerprint = useRef<string | null>(null);
  const pvgisDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  const input = useMemo(
    () => buildQuoteInput(state),
    // quote() no usa campos de cliente; evita recomputar al tipear razón social, etc.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [techo, poligonos, consumo, ajustes]
  );

  const computed = useMemo(() => {
    if (!catalog || !pvgis) return null;
    try {
      return quote(input, catalog, pvgis);
    } catch {
      return null;
    }
  }, [catalog, pvgis, input]);

  const result = computed ?? state.result;
  const kwp = result?.sizing.kwpSistema;
  const lossPct = result ? Math.round(result.losses.total * 1000) / 10 : 10;

  const fingerprint = useMemo(() => {
    if (!kwp) return null;
    return pvgisFingerprint(
      kwp,
      lossPct,
      techo.tipoTecho,
      techo.azimutDeg,
      techo.inclinacionDeg
    );
  }, [kwp, lossPct, techo.tipoTecho, techo.azimutDeg, techo.inclinacionDeg]);

  useEffect(() => {
    if (!fingerprint || !pvgis || !pvgisKwp) return;
    if (lastFetchedFingerprint.current === null) {
      lastFetchedFingerprint.current = fingerprint;
    }
  }, [fingerprint, pvgis, pvgisKwp]);

  useEffect(() => {
    if (!fingerprint || !catalog || !pvgis || !kwp || !pvgisKwp) return;

    const kwpDrift = Math.abs(kwp - pvgisKwp) / pvgisKwp > 0.05;
    const paramsChanged = lastFetchedFingerprint.current !== fingerprint;
    if ((!kwpDrift && !paramsChanged) || refetchingPvgis.current) return;

    if (pvgisDebounce.current) clearTimeout(pvgisDebounce.current);
    pvgisDebounce.current = setTimeout(() => {
      refetchingPvgis.current = true;
      fetch("/api/cotizador/pvgis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: state.cliente.lat,
          lon: state.cliente.lon,
          kwp,
          tipoTecho: techo.tipoTecho,
          azimutDeg: techo.azimutDeg,
          inclinacionDeg: techo.inclinacionDeg,
          lossPct,
        }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((nuevo) => {
          if (nuevo) {
            dispatch({ type: "SET_PVGIS", pvgis: nuevo, kwp });
            lastFetchedFingerprint.current = fingerprint;
          }
        })
        .finally(() => {
          refetchingPvgis.current = false;
        });
    }, 800);

    return () => {
      if (pvgisDebounce.current) clearTimeout(pvgisDebounce.current);
    };
  }, [
    fingerprint,
    kwp,
    pvgisKwp,
    catalog,
    pvgis,
    dispatch,
    state.cliente.lat,
    state.cliente.lon,
    techo.tipoTecho,
    techo.azimutDeg,
    techo.inclinacionDeg,
    lossPct,
  ]);

  useEffect(() => {
    if (!computed) return;
    const key = resultFingerprint(computed);
    if (key === lastSyncedKey.current) return;

    if (syncTimer.current) clearTimeout(syncTimer.current);
    syncTimer.current = setTimeout(() => {
      lastSyncedKey.current = key;
      dispatch({ type: "SET_RESULT", result: computed });
    }, 300);

    return () => {
      if (syncTimer.current) clearTimeout(syncTimer.current);
    };
  }, [computed, dispatch]);

  return { result, catalog, pvgis };
}
