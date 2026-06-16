"use client";

import { useCallback, useState } from "react";
import { buildQuoteInput, useCotizador } from "../context/CotizadorContext";

export function usePvgisRetry() {
  const { state, dispatch } = useCotizador();
  const [retrying, setRetrying] = useState(false);

  const retryPvgis = useCallback(async () => {
    const kwp = state.result?.sizing.kwpSistema ?? state.pvgisKwp;
    if (!kwp || retrying) return;

    setRetrying(true);
    try {
      const lossPct = state.result
        ? Math.round(state.result.losses.total * 1000) / 10
        : 10;
      const res = await fetch("/api/cotizador/pvgis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          lat: state.cliente.lat,
          lon: state.cliente.lon,
          kwp,
          tipoTecho: state.techo.tipoTecho,
          azimutDeg: state.techo.azimutDeg,
          inclinacionDeg: state.techo.inclinacionDeg,
          lossPct,
        }),
      });
      if (!res.ok) return;
      const nuevo = await res.json();
      dispatch({ type: "SET_PVGIS", pvgis: nuevo, kwp });

      if (state.step >= 6 && state.report) {
        const reportRes = await fetch("/api/cotizador/report", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            proyectoNombre: state.proyectoNombre,
            input: buildQuoteInput(state),
          }),
        });
        if (reportRes.ok) {
          const reportData = await reportRes.json();
          dispatch({ type: "SET_RESULT", result: reportData.result });
          dispatch({ type: "SET_REPORT", report: reportData.report });
        }
      }
    } finally {
      setRetrying(false);
    }
  }, [
    dispatch,
    retrying,
    state.cliente.lat,
    state.cliente.lon,
    state.techo.tipoTecho,
    state.techo.azimutDeg,
    state.techo.inclinacionDeg,
    state.result,
    state.pvgisKwp,
    state.step,
    state.report,
    state.proyectoNombre,
    state.techo,
    state.poligonos,
    state.consumo,
    state.ajustes,
  ]);

  return { retryPvgis, retrying };
}
