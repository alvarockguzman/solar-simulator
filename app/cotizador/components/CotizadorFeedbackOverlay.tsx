"use client";

import { useCotizador } from "../context/CotizadorContext";
import { useCotizadorPending } from "./CotizadorPendingNavigation";
import { CotizadorPageLoader } from "./CotizadorPageLoader";

function workloadMessage(step: number, hydrating: boolean): { title: string; subtitle: string } {
  if (hydrating) {
    return {
      title: "Cargando proyecto",
      subtitle: "Restaurando datos y recalculando resultados…",
    };
  }
  if (step === 3) {
    return {
      title: "Preparando equipos",
      subtitle: "Cargando catálogo y dimensionando el sistema…",
    };
  }
  if (step === 4) {
    return {
      title: "Revisando equipos",
      subtitle: "Actualizando dimensionamiento y precios…",
    };
  }
  if (step === 5) {
    return {
      title: "Generando reporte",
      subtitle: "Consultando PVGIS y armando el reporte. Puede tardar unos segundos…",
    };
  }
  return {
    title: "Calculando",
    subtitle: "Procesando la cotización…",
  };
}

/** Overlay global: navegación pendiente, hidratación de proyecto o cálculos del wizard. */
export function CotizadorFeedbackOverlay() {
  const { state } = useCotizador();
  const { pending } = useCotizadorPending();

  const busy = state.calculando || state.hydrating;
  const show = busy || pending.active;
  if (!show) return null;

  if (busy) {
    const { title, subtitle } = workloadMessage(state.step, state.hydrating);
    return <CotizadorPageLoader title={title} subtitle={subtitle} />;
  }

  return (
    <CotizadorPageLoader
      title={pending.title}
      subtitle={
        pending.subtitle ??
        "La primera vez en desarrollo puede tardar un poco más mientras compila."
      }
    />
  );
}
