"use client";

import dynamic from "next/dynamic";
import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { CotizadorAutosave, autosaveAfterReport } from "./components/CotizadorAutosave";
import { CotizadorContextBar } from "./components/CotizadorContextBar";
import { CotizadorErrorBanner } from "./components/CotizadorErrorBanner";
import { CotizadorHeader } from "./components/CotizadorHeader";
import { CotizadorStepper } from "./components/CotizadorStepper";
import { StepCliente } from "./components/StepCliente";
import { StepConsumo } from "./components/StepConsumo";
import { StepEconomics } from "./components/StepEconomics";
import { StepEquipos } from "./components/StepEquipos";
import { StepTecho } from "./components/StepTecho";
import { buildQuoteInput, useCotizador, type CotizadorState } from "./context/CotizadorContext";
import type { CotizadorProjectDraft } from "@/lib/cotizador/types";

const StepReporte = dynamic(
  () => import("./components/StepReporte").then((m) => m.StepReporte),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-full items-center justify-center text-slate-500">
        Cargando reporte…
      </div>
    ),
  }
);

/** Migra pasos guardados con flowVersion anterior al wizard de 6 pasos. */
function normalizeLoadedStep(step: number, flowVersion: number): number {
  if (flowVersion >= 3) return step;
  if (flowVersion < 2 && step === 4) return 6;
  if (flowVersion < 3 && step >= 5) return step + 1;
  return step;
}

function quoteInputFromDraft(project: CotizadorProjectDraft) {
  return {
    proyectoNombre: project.proyectoNombre,
    input: {
      cliente: project.cliente,
      techo: {
        ...project.techo,
        kwpDeseado: project.techo.kwpDeseado ?? null,
        areasM2: project.poligonos.map((p) => p.areaM2),
        snapshotDataUrl: project.snapshotUrl ?? null,
      },
      consumo: project.consumo.habilitado
        ? {
            mensualKwh: project.consumo.mensualKwh,
            tarifaUsdKwh: project.consumo.tarifaUsdKwh,
            pctDiurno: project.consumo.pctDiurno,
            tarifaInyeccionUsdKwh: project.consumo.tarifaInyeccionUsdKwh,
          }
        : {
            mensualKwh: Array(12).fill(0),
            tarifaUsdKwh: 0,
            pctDiurno: project.consumo.pctDiurno,
            tarifaInyeccionUsdKwh: project.consumo.tarifaInyeccionUsdKwh,
          },
      ajustes: project.ajustes,
    },
    economicsOverrides: project.economicsOverrides ?? {},
  };
}

function ProjectLoader() {
  const searchParams = useSearchParams();
  const { dispatch } = useCotizador();

  useEffect(() => {
    const id = searchParams.get("proyecto");
    if (!id) return;

    let cancelled = false;
    const controller = new AbortController();

    (async () => {
      dispatch({ type: "SET_HYDRATING", hydrating: true });
      dispatch({ type: "SET_CALCULANDO", calculando: true });
      dispatch({ type: "SET_ERROR", error: null });
      try {
        const res = await fetch(`/api/cotizador/projects/${id}`, {
          signal: controller.signal,
        });
        const data = await res.json();
        if (cancelled) return;
        if (!res.ok) throw new Error(data?.error ?? "Proyecto no encontrado.");

        const project = data.project as CotizadorProjectDraft;
        const flowVersion = project.flowVersion ?? 1;
        const step = normalizeLoadedStep(project.step, flowVersion);

        dispatch({ type: "LOAD_PROJECT", draft: { ...project, step } });

        const kwpOk = (project.techo?.kwpDeseado ?? 0) > 0;
        if (!kwpOk) return;

        const body = quoteInputFromDraft(project);
        const needReport = step >= 6;
        const needQuote = step >= 4 && step < 6;

        if (needReport) {
          const reportRes = await fetch("/api/cotizador/report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
            signal: controller.signal,
          });
          const reportData = await reportRes.json();
          if (cancelled) return;
          if (!reportRes.ok) {
            throw new Error(reportData?.error ?? "Error al restaurar el reporte.");
          }
          dispatch({ type: "SET_CATALOG", catalog: reportData.catalog });
          dispatch({
            type: "SET_PVGIS",
            pvgis: reportData.pvgis,
            kwp: reportData.result.sizing.kwpSistema,
          });
          dispatch({ type: "SET_GHI", ghi: reportData.ghi });
          dispatch({ type: "SET_RESULT", result: reportData.result });
          dispatch({ type: "SET_REPORT", report: reportData.report });
        } else if (needQuote) {
          const quoteRes = await fetch("/api/cotizador/quote", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body.input),
            signal: controller.signal,
          });
          const quoteData = await quoteRes.json();
          if (cancelled) return;
          if (!quoteRes.ok) {
            throw new Error(quoteData?.error ?? "Error al restaurar equipos.");
          }
          dispatch({ type: "SET_CATALOG", catalog: quoteData.catalog });
          dispatch({
            type: "SET_PVGIS",
            pvgis: quoteData.pvgis,
            kwp: quoteData.result.sizing.kwpSistema,
          });
          dispatch({ type: "SET_RESULT", result: quoteData.result });
        }
      } catch (err) {
        if (cancelled || controller.signal.aborted) return;
        dispatch({
          type: "SET_ERROR",
          error: err instanceof Error ? err.message : "Error al cargar proyecto.",
        });
      } finally {
        if (!cancelled) {
          dispatch({ type: "SET_HYDRATING", hydrating: false });
          dispatch({ type: "SET_CALCULANDO", calculando: false });
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchParams, dispatch]);

  return null;
}

function pvgisSnapshotFromState(state: CotizadorState) {
  return state.pvgis?.source === "pvgis" ? state.pvgis : undefined;
}

function Wizard() {
  const router = useRouter();
  const { state, dispatch } = useCotizador();

  async function continuarEquipos() {
    dispatch({ type: "SET_CALCULANDO", calculando: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const res = await fetch("/api/cotizador/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...buildQuoteInput(state),
          pvgisSnapshot: pvgisSnapshotFromState(state),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al dimensionar.");
      dispatch({ type: "SET_CATALOG", catalog: data.catalog });
      dispatch({
        type: "SET_PVGIS",
        pvgis: data.pvgis,
        kwp: data.result.sizing.kwpSistema,
      });
      dispatch({ type: "SET_RESULT", result: data.result });
      dispatch({ type: "CLEAR_REPORT" });
      dispatch({ type: "GO_STEP", step: 4 });
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        error: err instanceof Error ? err.message : "Error al dimensionar.",
      });
    } finally {
      dispatch({ type: "SET_CALCULANDO", calculando: false });
    }
  }

  async function generarReporte() {
    dispatch({ type: "SET_CALCULANDO", calculando: true });
    dispatch({ type: "SET_ERROR", error: null });
    try {
      const res = await fetch("/api/cotizador/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          proyectoNombre: state.proyectoNombre,
          input: buildQuoteInput(state),
          pvgisSnapshot: pvgisSnapshotFromState(state),
          economicsOverrides: state.economicsOverrides,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error ?? "Error al calcular.");
      dispatch({ type: "SET_CATALOG", catalog: data.catalog });
      dispatch({
        type: "SET_PVGIS",
        pvgis: data.pvgis,
        kwp: data.result.sizing.kwpSistema,
      });
      dispatch({ type: "SET_GHI", ghi: data.ghi });
      dispatch({ type: "SET_RESULT", result: data.result });
      dispatch({ type: "SET_REPORT", report: data.report });
      dispatch({ type: "GO_STEP", step: 6 });

      await autosaveAfterReport(
        {
          ...state,
          step: 6,
          result: data.result,
          report: data.report,
          needsRecalc: false,
        },
        dispatch,
        router,
        {
          kwp: data.report.metrics.kwpDc,
          mwh: data.report.metrics.energiaAnualMwh,
        },
        { skipNavigate: Boolean(state.projectId) }
      );
    } catch (err) {
      dispatch({
        type: "SET_ERROR",
        error: err instanceof Error ? err.message : "Error al calcular.",
      });
    } finally {
      dispatch({ type: "SET_CALCULANDO", calculando: false });
    }
  }

  return (
    <div
      className="flex h-[100dvh] flex-col overflow-hidden"
      data-testid="cotizador-wizard"
    >
      <Suspense fallback={null}>
        <ProjectLoader />
      </Suspense>
      <CotizadorHeader />
      <CotizadorStepper />
      <CotizadorContextBar />
      <CotizadorErrorBanner />
      <CotizadorAutosave />

      <main className="min-h-0 flex-1 overflow-hidden bg-white">
        {state.step === 1 && (
          <StepCliente onNext={() => dispatch({ type: "GO_STEP", step: 2 })} />
        )}
        {state.step === 2 && (
          <StepTecho
            onNext={() => dispatch({ type: "GO_STEP", step: 3 })}
            onBack={() => dispatch({ type: "GO_STEP", step: 1 })}
          />
        )}
        {state.step === 3 && (
          <StepConsumo
            onContinuar={continuarEquipos}
            onBack={() => dispatch({ type: "GO_STEP", step: 2 })}
            calculando={state.calculando}
          />
        )}
        {state.step === 4 && (
          <StepEquipos
            onBack={() => dispatch({ type: "GO_STEP", step: 3 })}
            onContinuar={() => dispatch({ type: "GO_STEP", step: 5 })}
          />
        )}
        {state.step === 5 && (
          <StepEconomics
            onBack={() => dispatch({ type: "GO_STEP", step: 4 })}
            onGenerarReporte={generarReporte}
            calculando={state.calculando}
          />
        )}
        {state.step === 6 && (
          <StepReporte
            onBack={() => dispatch({ type: "GO_STEP", step: 5 })}
            onRecalcular={() => dispatch({ type: "GO_STEP", step: 3 })}
          />
        )}
      </main>
    </div>
  );
}

export default function CotizadorPage() {
  return <Wizard />;
}
