import { representanteComercialNombre } from "@/lib/cotizador/cliente-utils";
import type { CotizadorState } from "../context/CotizadorContext";

export function canSaveProject(state: CotizadorState): boolean {
  return (
    state.cliente.razonSocial.trim().length > 0 && (state.techo.kwpDeseado ?? 0) > 0
  );
}

/** Payload para POST/PATCH de proyectos (sin depender del bundle del contexto React). */
export function buildProjectPayload(
  state: CotizadorState,
  metrics?: { kwp?: number; mwh?: number }
) {
  const { snapshotDataUrl, ...techoRest } = state.techo;
  const snap = state.techo.snapshotDataUrl;
  const snapshotPayload = snap?.startsWith("data:") ? snap : undefined;

  return {
    step: state.step,
    proyectoNombre: state.proyectoNombre,
    cliente: state.cliente,
    techo: techoRest,
    poligonos: state.poligonos,
    consumo: state.consumo,
    ajustes: state.ajustes,
    economicsOverrides: state.economicsOverrides,
    ...(snapshotPayload !== undefined ? { snapshotDataUrl: snapshotPayload } : {}),
    vendedor: representanteComercialNombre(state.cliente) || undefined,
    flowVersion: 3 as const,
    kwp: metrics?.kwp,
    mwh: metrics?.mwh,
    ...(state.pvgis?.source === "pvgis" ? { pvgisSnapshot: state.pvgis } : {}),
  };
}

export type SaveProjectResult =
  | {
      ok: true;
      projectId: string;
      updatedAt: string;
      snapshotUrl?: string | null;
      created: boolean;
    }
  | { ok: false; error: string };

export async function saveProject(
  state: CotizadorState,
  metrics?: { kwp?: number; mwh?: number }
): Promise<SaveProjectResult> {
  if (!canSaveProject(state)) {
    return { ok: false, error: "Faltan razón social o potencia (kWp)." };
  }

  const payload = buildProjectPayload(state, metrics);
  const url = state.projectId
    ? `/api/cotizador/projects/${state.projectId}`
    : "/api/cotizador/projects";

  try {
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45_000);
    const res = await fetch(url, {
      method: state.projectId ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    window.clearTimeout(timeout);
    const data = await res.json();
    if (!res.ok) {
      return { ok: false, error: (data?.error as string) ?? "Error al guardar." };
    }
    return {
      ok: true,
      projectId: data.project.id as string,
      updatedAt: data.project.updatedAt as string,
      snapshotUrl: data.project.snapshotUrl as string | null | undefined,
      created: !state.projectId,
    };
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      return {
        ok: false,
        error: "El guardado tardó demasiado. Revisá la consola del servidor o probá de nuevo.",
      };
    }
    return { ok: false, error: "Error de red al guardar." };
  }
}
