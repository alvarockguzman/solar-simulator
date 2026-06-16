import { normalizeCliente, representanteComercialNombre } from "../cliente-utils";
import type {
  CotizadorProjectConsumo,
  CotizadorProjectDraft,
  CotizadorProjectSummary,
  EconomicsOverrides,
} from "../types";

/** Subconjunto del estado del wizard que se persiste. */
export interface CotizadorPersistedState {
  projectId: string | null;
  step: number;
  proyectoNombre: string;
  cliente: CotizadorProjectDraft["cliente"];
  techo: CotizadorProjectDraft["techo"] & { snapshotDataUrl: string | null };
  poligonos: CotizadorProjectDraft["poligonos"];
  consumo: CotizadorProjectDraft["consumo"];
  ajustes: CotizadorProjectDraft["ajustes"];
  economicsOverrides: EconomicsOverrides;
}

export function normalizeProjectConsumo(
  consumo: CotizadorProjectConsumo | (Omit<CotizadorProjectConsumo, "tarifaNivel" | "consumoPreset" | "tarifaInyeccionUsdKwh"> & {
    tarifaNivel?: CotizadorProjectConsumo["tarifaNivel"];
    consumoPreset?: CotizadorProjectConsumo["consumoPreset"] | null;
    tarifaInyeccionUsdKwh?: number | null;
  })
): CotizadorProjectConsumo {
  return {
    ...consumo,
    tarifaNivel: consumo.tarifaNivel ?? "T2",
    consumoPreset: consumo.consumoPreset ?? null,
    tarifaInyeccionUsdKwh: consumo.tarifaInyeccionUsdKwh ?? null,
  };
}

/** Normaliza campos opcionales del schema Zod al guardar en store. */
export function normalizeProjectDraftFields(
  draft: Omit<CotizadorProjectDraft, "id" | "createdAt" | "updatedAt" | "snapshotUrl"> & {
    cliente: Parameters<typeof normalizeCliente>[0];
    techo: CotizadorProjectDraft["techo"] & { kwpDeseado?: number | null };
    consumo: Parameters<typeof normalizeProjectConsumo>[0];
  }
): Pick<
  CotizadorProjectDraft,
  "step" | "proyectoNombre" | "cliente" | "techo" | "poligonos" | "consumo" | "ajustes" | "economicsOverrides" | "vendedor" | "flowVersion"
> {
  return {
    step: draft.step,
    proyectoNombre: draft.proyectoNombre,
    cliente: normalizeCliente(draft.cliente),
    techo: { ...draft.techo, kwpDeseado: draft.techo.kwpDeseado ?? null },
    poligonos: draft.poligonos,
    consumo: normalizeProjectConsumo(draft.consumo),
    ajustes: draft.ajustes,
    economicsOverrides: draft.economicsOverrides ?? {},
    vendedor: draft.vendedor,
    flowVersion: draft.flowVersion,
  };
}

export function draftToSummary(
  draft: CotizadorProjectDraft,
  metrics?: { kwp?: number; mwh?: number }
): CotizadorProjectSummary {
  return {
    id: draft.id,
    proyectoNombre: draft.proyectoNombre,
    clienteRazonSocial: draft.cliente.razonSocial,
    direccion: draft.cliente.direccion,
    kwp: metrics?.kwp,
    mwh: metrics?.mwh,
    vendedor: draft.vendedor ?? representanteComercialNombre(normalizeCliente(draft.cliente)),
    updatedAt: draft.updatedAt,
    createdAt: draft.createdAt,
  };
}

export function serializeProject(
  state: CotizadorPersistedState,
  existing?: Pick<CotizadorProjectDraft, "id" | "createdAt" | "snapshotUrl">
): Omit<CotizadorProjectDraft, "updatedAt"> & { updatedAt?: string } {
  const { snapshotDataUrl, ...techoRest } = state.techo;
  const isDataUrl = snapshotDataUrl?.startsWith("data:") ?? false;
  return {
    id: existing?.id ?? state.projectId ?? crypto.randomUUID(),
    step: state.step,
    proyectoNombre: state.proyectoNombre,
    cliente: state.cliente,
    techo: techoRest,
    poligonos: state.poligonos,
    consumo: state.consumo,
    ajustes: state.ajustes,
    economicsOverrides: state.economicsOverrides,
    snapshotUrl: isDataUrl ? existing?.snapshotUrl ?? null : snapshotDataUrl ?? existing?.snapshotUrl ?? null,
    vendedor: representanteComercialNombre(state.cliente) || undefined,
    createdAt: existing?.createdAt ?? new Date().toISOString(),
  };
}

export function hydratePersistedState(draft: CotizadorProjectDraft): CotizadorPersistedState {
  return {
    projectId: draft.id,
    step: draft.step,
    proyectoNombre: draft.proyectoNombre,
    cliente: normalizeCliente(draft.cliente),
    techo: {
      ...draft.techo,
      kwpDeseado: draft.techo.kwpDeseado ?? null,
      snapshotDataUrl: draft.snapshotUrl ?? null,
    },
    poligonos: draft.poligonos,
    consumo: normalizeProjectConsumo(draft.consumo),
    ajustes: draft.ajustes,
    economicsOverrides: draft.economicsOverrides ?? {},
  };
}
