import type { GhiResult, Parametros, PvgisResult, TipoTecho } from "../types";
import { serverFetch } from "@/app/lib/serverFetch";

/**
 * Cliente de PVGIS PVcalc v5.2 (sección 3.2 del plan).
 * https://re.jrc.ec.europa.eu/api/v5_2/PVcalc
 *
 * Convención de azimut:
 * - UI: grados desde el norte, horario (0 = N, 90 = E, 180 = S, 270 = O).
 * - PVGIS ("aspect"): 0 = SUR, -90 = Este, 90 = Oeste, ±180 = Norte.
 * En el hemisferio sur la orientación óptima es el norte → aspect = ±180.
 *
 * Techo plano: no usamos optimalangles=1 (devuelve ~0° BIPV). Modelamos la
 * estructura lastrada comercial: 15° al norte por defecto (ver BOM G2E).
 */

/** Inclinación default de estructura lastrada en losa (°). */
export const PLANO_TILT_DEFAULT = 15;
/** Azimut UI default para plano en hemisferio sur (norte). */
export const PLANO_AZIMUT_DEFAULT = 0;

const PVGIS_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc";
const MRCALC_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_2/MRcalc";
const PVGIS_TIMEOUT_MS = 25_000;

/** Convierte azimut de la UI (desde el norte, horario) a aspect de PVGIS (0 = sur). */
export function uiAzimuthToPvgisAspect(azimutDeg: number): number {
  // Restar 180 mueve el origen del norte al sur manteniendo el sentido horario.
  let aspect = (azimutDeg % 360) - 180;
  if (aspect <= -180) aspect += 360;
  if (aspect > 180) aspect -= 360;
  return aspect;
}

export interface PvgisRequest {
  lat: number;
  lon: number;
  kwp: number;
  tipoTecho: TipoTecho;
  /** Azimut UI (desde el norte). Requerido para inclinado/serrucho. */
  azimutDeg: number | null;
  /** Inclinación del techo en grados. Requerido para inclinado/serrucho. */
  inclinacionDeg: number | null;
  /** Pérdidas del sistema en % (parámetro del Sheet). */
  lossPct: number;
  /** mountingplace PVGIS (building = poco ventilado, free = ventilado). */
  mountingplace?: "building" | "free" | "ground";
}

export function mountingForTecho(
  tipoTecho: TipoTecho,
  params: Parametros
): "building" | "free" {
  switch (tipoTecho) {
    case "inclinado":
      return params.mountingInclinado;
    case "plano":
      return params.mountingPlano;
    case "serrucho":
      return params.mountingSerrucho;
  }
}

/** Clave de cache server-side para requests PVGIS (TTL en la ruta API). */
export function pvgisCacheKey(req: PvgisRequest): string {
  return [
    req.lat.toFixed(4),
    req.lon.toFixed(4),
    req.kwp.toFixed(2),
    req.tipoTecho,
    req.azimutDeg ?? "auto",
    req.inclinacionDeg ?? "auto",
    req.lossPct,
    req.mountingplace ?? "building",
  ].join("|");
}

interface PvgisApiMonthly {
  month: number;
  E_m: number;
  "H(i)_m"?: number;
}

export interface PvgisApiResponse {
  inputs?: {
    meteo_data?: { radiation_db?: string };
    mounting_system?: {
      fixed?: {
        slope?: { value: number; optimal?: boolean };
        azimuth?: { value: number; optimal?: boolean };
      };
    };
  };
  outputs?: {
    monthly?: { fixed?: PvgisApiMonthly[] };
    totals?: {
      fixed?: {
        E_y?: number;
        "H(i)_y"?: number;
        // Pérdidas internas de PVGIS. l_spec puede venir como "?(0)".
        l_aoi?: number | string;
        l_spec?: number | string;
        l_tg?: number | string;
        l_total?: number | string;
      };
    };
  };
}

export interface MrcalcApiResponse {
  outputs?: {
    monthly?: { year: number; month: number; "H(h)_m"?: number }[];
  };
}

export class PvgisError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PvgisError";
  }
}

/** Convierte un valor de pérdida de PVGIS ("-4.7" o "?(0)") a número o null. */
function lossNumber(v: number | string | undefined): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

/** Parsea la respuesta de PVcalc a PvgisResult normalizado por kWp. */
export function parsePvgisResponse(data: PvgisApiResponse, kwp: number): PvgisResult {
  const totals = data.outputs?.totals?.fixed;
  const eY = totals?.E_y;
  const monthly = data.outputs?.monthly?.fixed;

  if (typeof eY !== "number" || eY <= 0) {
    throw new PvgisError("Respuesta de PVGIS sin dato de energía anual (E_y).");
  }
  if (!Array.isArray(monthly) || monthly.length !== 12) {
    throw new PvgisError("Respuesta de PVGIS sin perfil mensual (E_m).");
  }

  const ordered = [...monthly].sort((a, b) => a.month - b.month);
  const fixed = data.inputs?.mounting_system?.fixed;
  const monthlyPoa = ordered.every((m) => typeof m["H(i)_m"] === "number")
    ? ordered.map((m) => m["H(i)_m"] as number)
    : null;

  return {
    yieldKwhPerKwpYear: eY / kwp,
    monthlyKwhPerKwp: ordered.map((m) => m.E_m / kwp),
    irradiationKwhM2Year:
      typeof totals?.["H(i)_y"] === "number" ? totals["H(i)_y"]! : null,
    monthlyIrradiationKwhM2: monthlyPoa,
    angleDeg: typeof fixed?.slope?.value === "number" ? fixed.slope.value : null,
    aspectDeg: typeof fixed?.azimuth?.value === "number" ? fixed.azimuth.value : null,
    angleOptimal: fixed?.slope?.optimal === true,
    aspectOptimal: fixed?.azimuth?.optimal === true,
    internalLosses: {
      lAoiPct: lossNumber(totals?.l_aoi),
      lSpecPct: lossNumber(totals?.l_spec),
      lTgPct: lossNumber(totals?.l_tg),
      lTotalPct: lossNumber(totals?.l_total),
    },
    radiationDb: data.inputs?.meteo_data?.radiation_db ?? null,
    source: "pvgis",
  };
}

/** Parsea MRcalc: promedia los años disponibles → GHI mensual y anual. */
export function parseMrcalcResponse(data: MrcalcApiResponse): GhiResult {
  const rows = data.outputs?.monthly;
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new PvgisError("Respuesta de MRcalc sin datos mensuales.");
  }
  const sums = Array(12).fill(0);
  const counts = Array(12).fill(0);
  for (const r of rows) {
    const ghi = r["H(h)_m"];
    if (r.month >= 1 && r.month <= 12 && typeof ghi === "number") {
      sums[r.month - 1] += ghi;
      counts[r.month - 1] += 1;
    }
  }
  if (counts.some((c) => c === 0)) {
    throw new PvgisError("MRcalc no devolvió datos para todos los meses.");
  }
  const monthly = sums.map((s, i) => s / counts[i]);
  return {
    monthlyGhiKwhM2: monthly,
    annualGhiKwhM2: monthly.reduce((a, b) => a + b, 0),
    source: "pvgis",
  };
}

export function buildPvgisParams(req: PvgisRequest): URLSearchParams {
  const params = new URLSearchParams({
    lat: req.lat.toFixed(5),
    lon: req.lon.toFixed(5),
    peakpower: String(req.kwp),
    loss: String(req.lossPct),
    mountingplace: req.mountingplace ?? "building",
    outputformat: "json",
  });

  const azimut =
    req.tipoTecho === "plano"
      ? (req.azimutDeg ?? PLANO_AZIMUT_DEFAULT)
      : (req.azimutDeg ?? 0);
  const inclinacion =
    req.tipoTecho === "plano"
      ? (req.inclinacionDeg ?? PLANO_TILT_DEFAULT)
      : (req.inclinacionDeg ?? 15);
  params.set("angle", String(inclinacion));
  params.set("aspect", String(uiAzimuthToPvgisAspect(azimut)));
  return params;
}

function fetchErrorMessage(err: unknown): string {
  const cause = err instanceof Error ? err.cause : undefined;
  const code =
    cause && typeof cause === "object" && "code" in cause
      ? String((cause as { code: string }).code)
      : "";
  if (code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE" || code === "CERT_HAS_EXPIRED") {
    return (
      "Error de certificado SSL al conectar con PVGIS (común en Windows en local). " +
      "Reiniciá con `npm run dev` (usa certificados del sistema) o agregá LEAD_SKIP_TLS_VERIFY=true en .env.local."
    );
  }
  if (err instanceof Error && err.name === "TimeoutError") {
    return "PVGIS no respondió a tiempo (timeout). El servicio puede estar lento; reintentá en unos segundos.";
  }
  return "PVGIS no respondió (error de red).";
}

async function fetchJson<T>(url: string): Promise<T> {
  let res: Response;
  try {
    res = await serverFetch(url, { signal: AbortSignal.timeout(PVGIS_TIMEOUT_MS) });
  } catch (err) {
    throw new PvgisError(fetchErrorMessage(err));
  }
  if (!res.ok) {
    throw new PvgisError(`PVGIS respondió con estado ${res.status}.`);
  }
  try {
    return (await res.json()) as T;
  } catch {
    throw new PvgisError("Respuesta de PVGIS no es JSON válido.");
  }
}

/** Llama a PVcalc. Lanza PvgisError ante timeout, HTTP != 200 o respuesta inválida. */
export async function fetchPvgis(req: PvgisRequest): Promise<PvgisResult> {
  const params = buildPvgisParams(req);
  const data = await fetchJson<PvgisApiResponse>(`${PVGIS_BASE_URL}?${params.toString()}`);
  return parsePvgisResponse(data, req.kwp);
}

/** Llama a MRcalc (irradiación horizontal mensual, promedio multianual). */
export async function fetchGhi(lat: number, lon: number): Promise<GhiResult> {
  const params = new URLSearchParams({
    lat: lat.toFixed(5),
    lon: lon.toFixed(5),
    horirrad: "1",
    outputformat: "json",
  });
  const data = await fetchJson<MrcalcApiResponse>(`${MRCALC_BASE_URL}?${params.toString()}`);
  return parseMrcalcResponse(data);
}
