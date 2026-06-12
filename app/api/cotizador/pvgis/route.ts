import { NextResponse } from "next/server";
import { fallbackPvgis } from "@/lib/cotizador/engine";
import { getCatalog } from "@/lib/cotizador/pricing";
import {
  fetchPvgis,
  mountingForTecho,
  pvgisCacheKey,
  type PvgisRequest,
} from "@/lib/cotizador/pvgis/client";
import type { PvgisResult, TipoTecho } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";

/**
 * Proxy de PVGIS con cache en memoria (TTL 24 h).
 * Clave: lat/lon + kwp + techo + ángulos + pérdidas + mountingplace.
 * Si PVGIS falla, devuelve el fallback (yield 1400) con source: "fallback".
 */

const CACHE_TTL_MS = 24 * 60 * 60 * 1000;
const cache = new Map<string, { result: PvgisResult; at: number }>();

const TIPOS_TECHO: TipoTecho[] = ["plano", "inclinado", "serrucho"];

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const lat = Number(body.lat);
  const lon = Number(body.lon);
  const kwp = Number(body.kwp);
  const tipoTecho = body.tipoTecho as TipoTecho;

  if (
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180 ||
    !Number.isFinite(kwp) ||
    kwp <= 0 ||
    !TIPOS_TECHO.includes(tipoTecho)
  ) {
    return NextResponse.json(
      { error: "Parámetros lat, lon, kwp o tipoTecho inválidos." },
      { status: 400 }
    );
  }

  const catalog = await getCatalog();
  const mountingplace = mountingForTecho(tipoTecho, catalog.parametros);

  const req: PvgisRequest = {
    lat,
    lon,
    kwp,
    tipoTecho,
    azimutDeg: Number.isFinite(Number(body.azimutDeg)) ? Number(body.azimutDeg) : null,
    inclinacionDeg: Number.isFinite(Number(body.inclinacionDeg))
      ? Number(body.inclinacionDeg)
      : null,
    lossPct: Number.isFinite(Number(body.lossPct)) ? Number(body.lossPct) : 14,
    mountingplace,
  };

  const key = pvgisCacheKey(req);
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) {
    return NextResponse.json(hit.result);
  }

  try {
    const result = await fetchPvgis(req);
    cache.set(key, { result, at: Date.now() });
    return NextResponse.json(result);
  } catch (err) {
    console.error("PVGIS error:", err);
    return NextResponse.json(fallbackPvgis());
  }
}
