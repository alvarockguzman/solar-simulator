"use client";

import {
  createContext,
  useContext,
  useMemo,
  useReducer,
  type Dispatch,
  type ReactNode,
} from "react";
import { normalizeCliente } from "@/lib/cotizador/cliente-utils";
import { tarifaUsdForNivel } from "@/lib/cotizador/presets";
import { hydratePersistedState } from "@/lib/cotizador/projects/serialize";
import type {
  Catalog,
  ClienteInput,
  CotizadorProjectConsumo,
  CotizadorProjectDraft,
  GhiResult,
  Poligono,
  ProductionReportData,
  PvgisResult,
  QuoteAjustes,
  QuoteInput,
  QuoteResult,
  TechoInput,
  TipoTecho,
} from "@/lib/cotizador/types";

export type { Poligono };

export interface CotizadorState {
  step: number;
  projectId: string | null;
  dirty: boolean;
  lastSavedAt: string | null;
  proyectoNombre: string;
  cliente: ClienteInput;
  techo: Omit<TechoInput, "areasM2">;
  poligonos: Poligono[];
  consumo: CotizadorProjectConsumo;
  ajustes: QuoteAjustes;
  catalog: Catalog | null;
  pvgis: PvgisResult | null;
  ghi: GhiResult | null;
  pvgisKwp: number | null;
  result: QuoteResult | null;
  report: ProductionReportData | null;
  calculando: boolean;
  /** true mientras ProjectLoader hidrata un proyecto desde la API. */
  hydrating: boolean;
  error: string | null;
  /** true si cambiaron inputs de pasos 1–3 desde el último cálculo del reporte. */
  needsRecalc: boolean;
  /** Campo a enfocar tras GO_STEP (p. ej. desde un warning). */
  pendingFocus: string | null;
}

export const FACTORES_TECHO: Record<TipoTecho, number> = {
  plano: 0.5,
  inclinado: 0.85,
  serrucho: 0.5,
};

export const initialState: CotizadorState = {
  step: 1,
  projectId: null,
  dirty: false,
  lastSavedAt: null,
  proyectoNombre: "",
  cliente: {
    razonSocial: "",
    contacto: "",
    email: "Alvaro",
    representanteModo: "alvaro",
    representanteOtro: "",
    direccion: "",
    lat: -31.42,
    lon: -64.19,
  },
  techo: {
    tipoTecho: "plano",
    kwpDeseado: null,
    factorAprovechamiento: FACTORES_TECHO.plano,
    sombraPct: null,
    azimutDeg: 0,
    inclinacionDeg: 15,
    distanciaTableroM: null,
    snapshotDataUrl: null,
  },
  poligonos: [],
  consumo: {
    habilitado: false,
    modo: "promedio",
    promedioKwh: 40_000,
    mensualKwh: Array(12).fill(40_000),
    tarifaModo: "directa",
    tarifaNivel: "T2",
    tarifaUsdKwh: 0.117,
    facturaMensualUsd: 4680,
    pctDiurno: 0.7,
    consumoPreset: null,
    tarifaInyeccionUsdKwh: null,
  },
  ajustes: {
    panelModelo: null,
    inversorModelo: null,
    margenPct: null,
    descuentoPct: 0,
    lineasOverride: {},
    lineasManuales: [],
    mostrarDetalle: true,
  },
  catalog: null,
  pvgis: null,
  ghi: null,
  pvgisKwp: null,
  result: null,
  report: null,
  calculando: false,
  hydrating: false,
  error: null,
  needsRecalc: false,
  pendingFocus: null,
};

type Action =
  | { type: "GO_STEP"; step: number; focusField?: string }
  | { type: "CLEAR_FOCUS" }
  | { type: "SET_PROYECTO"; proyectoNombre: string }
  | { type: "SET_CLIENTE"; cliente: Partial<ClienteInput> }
  | { type: "SET_TECHO"; techo: Partial<CotizadorState["techo"]> }
  | { type: "SET_SNAPSHOT_URL"; snapshotDataUrl: string }
  | { type: "SET_TIPO_TECHO"; tipoTecho: TipoTecho }
  | { type: "ADD_POLIGONO"; poligono: Poligono }
  | { type: "REMOVE_POLIGONO"; id: string }
  | { type: "SET_CONSUMO"; consumo: Partial<CotizadorState["consumo"]> }
  | { type: "SET_AJUSTES"; ajustes: Partial<QuoteAjustes> }
  | { type: "SET_CATALOG"; catalog: Catalog }
  | { type: "SET_PVGIS"; pvgis: PvgisResult; kwp: number }
  | { type: "SET_GHI"; ghi: GhiResult }
  | { type: "SET_RESULT"; result: QuoteResult }
  | { type: "SET_REPORT"; report: ProductionReportData }
  | { type: "SET_LIVE_REPORT"; report: ProductionReportData }
  | { type: "CLEAR_REPORT" }
  | { type: "SET_CALCULANDO"; calculando: boolean }
  | { type: "SET_HYDRATING"; hydrating: boolean }
  | { type: "SET_ERROR"; error: string | null }
  | { type: "LOAD_PROJECT"; draft: CotizadorProjectDraft }
  | { type: "SET_PROJECT_ID"; projectId: string }
  | { type: "MARK_SAVED"; updatedAt: string }
  | { type: "RESET" };

function markDirty(state: CotizadorState, invalidateReport = true): CotizadorState {
  return {
    ...state,
    dirty: true,
    needsRecalc: invalidateReport && state.report !== null ? true : state.needsRecalc,
    result: invalidateReport ? null : state.result,
  };
}

/** Cambios que no invalidan el reporte (p. ej. ajustes en vivo en paso 4). */
function markDirtyOnly(state: CotizadorState): CotizadorState {
  return { ...state, dirty: true };
}

function reducer(state: CotizadorState, action: Action): CotizadorState {
  switch (action.type) {
    case "GO_STEP":
      return {
        ...state,
        step: action.step,
        pendingFocus: action.focusField ?? null,
      };
    case "CLEAR_FOCUS":
      return { ...state, pendingFocus: null };
    case "SET_PROYECTO":
      return markDirty({ ...state, proyectoNombre: action.proyectoNombre });
    case "SET_CLIENTE": {
      const merged = { ...state.cliente, ...action.cliente };
      const cliente = normalizeCliente(merged);
      return markDirty({ ...state, cliente });
    }
    case "SET_TECHO":
      return markDirty({ ...state, techo: { ...state.techo, ...action.techo } });
    case "SET_SNAPSHOT_URL":
      return {
        ...state,
        techo: { ...state.techo, snapshotDataUrl: action.snapshotDataUrl },
      };
    case "SET_TIPO_TECHO":
      return markDirty({
        ...state,
        techo: {
          ...state.techo,
          tipoTecho: action.tipoTecho,
          factorAprovechamiento: FACTORES_TECHO[action.tipoTecho],
        },
      });
    case "ADD_POLIGONO":
      return markDirty({ ...state, poligonos: [...state.poligonos, action.poligono] });
    case "REMOVE_POLIGONO":
      return markDirty({
        ...state,
        poligonos: state.poligonos.filter((p) => p.id !== action.id),
      });
    case "SET_CONSUMO": {
      const consumo = { ...state.consumo, ...action.consumo };
      if (action.consumo.tarifaNivel !== undefined) {
        consumo.tarifaUsdKwh = tarifaUsdForNivel(consumo.tarifaNivel);
        if (consumo.tarifaModo === "factura") {
          const consumoMedio = consumo.mensualKwh.reduce((a, b) => a + b, 0) / 12;
          if (consumoMedio > 0) {
            consumo.facturaMensualUsd =
              Math.round(consumoMedio * consumo.tarifaUsdKwh * 100) / 100;
          }
        }
      }
      if (action.consumo.promedioKwh !== undefined && consumo.modo === "promedio") {
        consumo.mensualKwh = Array(12).fill(action.consumo.promedioKwh);
      }
      if (action.consumo.modo === "promedio") {
        consumo.mensualKwh = Array(12).fill(consumo.promedioKwh);
      }
      if (
        consumo.tarifaModo === "factura" &&
        (action.consumo.facturaMensualUsd !== undefined ||
          action.consumo.promedioKwh !== undefined ||
          action.consumo.tarifaModo !== undefined)
      ) {
        const consumoMedio = consumo.mensualKwh.reduce((a, b) => a + b, 0) / 12;
        if (consumoMedio > 0) {
          consumo.tarifaUsdKwh =
            Math.round((consumo.facturaMensualUsd / consumoMedio) * 10000) / 10000;
        }
      }
      return markDirty({ ...state, consumo });
    }
    case "SET_AJUSTES":
      return markDirtyOnly({ ...state, ajustes: { ...state.ajustes, ...action.ajustes } });
    case "SET_CATALOG":
      return { ...state, catalog: action.catalog };
    case "SET_PVGIS":
      return { ...state, pvgis: action.pvgis, pvgisKwp: action.kwp };
    case "SET_GHI":
      return { ...state, ghi: action.ghi };
    case "SET_RESULT":
      return { ...state, result: action.result, error: null };
    case "SET_REPORT":
      return { ...state, report: action.report, needsRecalc: false };
    case "SET_LIVE_REPORT":
      return { ...state, report: action.report };
    case "CLEAR_REPORT":
      return { ...state, report: null };
    case "SET_CALCULANDO":
      return { ...state, calculando: action.calculando };
    case "SET_HYDRATING":
      return { ...state, hydrating: action.hydrating };
    case "SET_ERROR":
      return { ...state, error: action.error, calculando: false };
    case "LOAD_PROJECT": {
      const hydrated = hydratePersistedState(action.draft);
      return {
        ...initialState,
        ...hydrated,
        cliente: normalizeCliente(hydrated.cliente),
        projectId: action.draft.id,
        dirty: false,
        needsRecalc: false,
        lastSavedAt: action.draft.updatedAt,
        catalog: state.catalog,
      };
    }
    case "SET_PROJECT_ID":
      return { ...state, projectId: action.projectId };
    case "MARK_SAVED":
      return { ...state, dirty: false, lastSavedAt: action.updatedAt };
    case "RESET":
      return { ...initialState };
    default:
      return state;
  }
}

export function buildQuoteInput(state: CotizadorState): QuoteInput {
  return {
    cliente: state.cliente,
    techo: {
      ...state.techo,
      areasM2: state.poligonos.map((p) => p.areaM2),
    },
    consumo: state.consumo.habilitado
      ? {
          mensualKwh: state.consumo.mensualKwh,
          tarifaUsdKwh: state.consumo.tarifaUsdKwh,
          pctDiurno: state.consumo.pctDiurno,
          tarifaInyeccionUsdKwh: state.consumo.tarifaInyeccionUsdKwh,
        }
      : {
          mensualKwh: Array(12).fill(0),
          tarifaUsdKwh: 0,
          pctDiurno: state.consumo.pctDiurno,
          tarifaInyeccionUsdKwh: state.consumo.tarifaInyeccionUsdKwh,
        },
    ajustes: state.ajustes,
  };
}

const CotizadorContext = createContext<{
  state: CotizadorState;
  dispatch: Dispatch<Action>;
} | null>(null);

export function CotizadorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const value = useMemo(() => ({ state, dispatch }), [state, dispatch]);
  return (
    <CotizadorContext.Provider value={value}>
      {children}
    </CotizadorContext.Provider>
  );
}

export function useCotizador() {
  const ctx = useContext(CotizadorContext);
  if (!ctx) throw new Error("useCotizador debe usarse dentro de CotizadorProvider");
  return ctx;
}
