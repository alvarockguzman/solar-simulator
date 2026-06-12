import type { GhiResult, PvgisResult } from "../types";
import { fallbackPvgis, FALLBACK_MONTHLY_SHAPE, pvgisFromProjectCache } from "../engine";
import { fetchGhi, fetchPvgis, type PvgisRequest } from "./client";

/**
 * Wrapper de datos climáticos para el Reporte de Producción:
 * PVcalc (producción + POA) y MRcalc (GHI) en paralelo, con cache en memoria
 * de 24 h por clave redondeada y fallbacks documentados (source: "fallback").
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const pvCache = new Map<string, { result: PvgisResult; at: number }>();
const ghiCache = new Map<string, { result: GhiResult; at: number }>();

/** GHI genérico para Argentina central si MRcalc no responde. */
export function fallbackGhi(annualGhiKwhM2 = 1800): GhiResult {
  return {
    monthlyGhiKwhM2: FALLBACK_MONTHLY_SHAPE.map((f) => f * annualGhiKwhM2),
    annualGhiKwhM2,
    source: "fallback",
  };
}

function pvKey(req: PvgisRequest): string {
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

export interface ProductionData {
  pvgis: PvgisResult;
  ghi: GhiResult;
}

export async function getCachedPvgis(
  req: PvgisRequest,
  projectFallback?: PvgisResult | null
): Promise<PvgisResult> {
  const now = Date.now();
  const pKey = pvKey(req);
  const hit = pvCache.get(pKey);
  if (hit && now - hit.at < CACHE_TTL_MS) return hit.result;
  try {
    const r = await fetchPvgis(req);
    pvCache.set(pKey, { result: r, at: Date.now() });
    return r;
  } catch (err) {
    console.error("PVcalc falló:", err);
    if (projectFallback && projectFallback.source === "pvgis") {
      return pvgisFromProjectCache(projectFallback);
    }
    return fallbackPvgis();
  }
}

export async function getProductionData(
  req: PvgisRequest,
  projectFallback?: PvgisResult | null
): Promise<ProductionData> {
  const now = Date.now();
  const gKey = `${req.lat.toFixed(4)}|${req.lon.toFixed(4)}`;

  const ghiHit = ghiCache.get(gKey);

  const [pvgis, ghi] = await Promise.all([
    getCachedPvgis(req, projectFallback),
    ghiHit && now - ghiHit.at < CACHE_TTL_MS
      ? Promise.resolve(ghiHit.result)
      : fetchGhi(req.lat, req.lon)
          .then((r) => {
            ghiCache.set(gKey, { result: r, at: Date.now() });
            return r;
          })
          .catch((err) => {
            console.error("MRcalc falló, usando fallback:", err);
            return fallbackGhi();
          }),
  ]);

  return { pvgis, ghi };
}
