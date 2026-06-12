"use client";

import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef } from "react";
import { saveProject } from "../lib/saveProject";
import { useCotizador } from "../context/CotizadorContext";

/**
 * Autoguardado silencioso al cambiar de paso y aviso al cerrar pestaña con cambios.
 */
export function CotizadorAutosave() {
  const router = useRouter();
  const { state, dispatch } = useCotizador();
  const prevStepRef = useRef(state.step);
  const skipNextAutosave = useRef(true);
  const savingRef = useRef(false);

  const metrics = state.report
    ? { kwp: state.report.metrics.kwpDc, mwh: state.report.metrics.energiaAnualMwh }
    : state.result
    ? {
        kwp: state.result.sizing.kwpSistema,
        mwh: state.result.economics.produccionAnualKwh / 1000,
      }
    : undefined;

  const runAutosave = useCallback(async () => {
    if (savingRef.current || state.calculando || state.hydrating || !state.dirty) return;
    savingRef.current = true;
    try {
      const result = await saveProject(state, metrics);
      if (!result.ok) {
        console.warn("[autosave]", result.error);
        return;
      }
      if (result.created) {
        dispatch({ type: "SET_PROJECT_ID", projectId: result.projectId });
        router.replace(`/cotizador?proyecto=${result.projectId}`, { scroll: false });
      }
      if (result.snapshotUrl) {
        dispatch({ type: "SET_SNAPSHOT_URL", snapshotDataUrl: result.snapshotUrl });
      }
      dispatch({ type: "MARK_SAVED", updatedAt: result.updatedAt });
    } catch (err) {
      console.warn("[autosave]", err);
    } finally {
      savingRef.current = false;
    }
  }, [state, dispatch, metrics, router]);

  useEffect(() => {
    if (!state.dirty) return;
    function onBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [state.dirty]);

  useEffect(() => {
    if (skipNextAutosave.current) {
      skipNextAutosave.current = false;
      prevStepRef.current = state.step;
      return;
    }
    if (prevStepRef.current === state.step) return;
    prevStepRef.current = state.step;
    if (state.dirty && !state.calculando) {
      void runAutosave();
    }
  }, [state.step, state.dirty, state.calculando, runAutosave]);

  return null;
}

/** Llamar tras calcular reporte para persistir el borrador completo. */
export async function autosaveAfterReport(
  state: Parameters<typeof saveProject>[0],
  dispatch: ReturnType<typeof useCotizador>["dispatch"],
  router: ReturnType<typeof useRouter>,
  metrics: { kwp: number; mwh: number },
  opts?: { skipNavigate?: boolean }
): Promise<void> {
  const result = await saveProject(state, metrics);
  if (!result.ok) {
    console.warn("[autosave post-reporte]", result.error);
    dispatch({ type: "SET_ERROR", error: result.error });
    return;
  }
  if (result.created && !opts?.skipNavigate) {
    dispatch({ type: "SET_PROJECT_ID", projectId: result.projectId });
    router.replace(`/cotizador?proyecto=${result.projectId}`, { scroll: false });
  } else if (result.created) {
    dispatch({ type: "SET_PROJECT_ID", projectId: result.projectId });
  }
  if (result.snapshotUrl) {
    dispatch({ type: "SET_SNAPSHOT_URL", snapshotDataUrl: result.snapshotUrl });
  }
  dispatch({ type: "MARK_SAVED", updatedAt: result.updatedAt });
}
