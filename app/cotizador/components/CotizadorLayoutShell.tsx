"use client";

import { Suspense, useEffect, useRef, type ReactNode } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useCotizador } from "../context/CotizadorContext";
import { CotizadorFeedbackOverlay } from "./CotizadorFeedbackOverlay";
import { useCotizadorPending } from "./CotizadorPendingNavigation";

function RoutePendingSync() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { state } = useCotizador();
  const { clearPending } = useCotizadorPending();
  const wasHydrating = useRef(false);

  useEffect(() => {
    if (state.hydrating) wasHydrating.current = true;
  }, [state.hydrating]);

  useEffect(() => {
    const proyectoId = searchParams.get("proyecto");
    const openingProject = pathname === "/cotizador" && Boolean(proyectoId);

    if (openingProject) {
      if (wasHydrating.current && !state.hydrating && !state.calculando) {
        clearPending();
        wasHydrating.current = false;
      }
      return;
    }

    wasHydrating.current = false;
    if (!state.hydrating && !state.calculando) {
      clearPending();
    }
  }, [
    pathname,
    searchParams,
    state.hydrating,
    state.calculando,
    clearPending,
  ]);

  return null;
}

export function CotizadorLayoutShell({ children }: { children: ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <RoutePendingSync />
      </Suspense>
      {children}
      <CotizadorFeedbackOverlay />
    </>
  );
}
