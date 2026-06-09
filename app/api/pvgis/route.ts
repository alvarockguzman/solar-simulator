import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy a PVGIS PVcalc (la API de PVGIS no permite llamadas AJAX directas desde el navegador).
 * Devuelve el rendimiento específico del sistema (kWh/kWp·año) para una ubicación,
 * calculado con peakpower=1 kWp e inclinación/orientación óptimas.
 * Docs: https://joint-research-centre.ec.europa.eu/photovoltaic-geographical-information-system-pvgis/using-pvgis-5/api-non-interactive-service_en
 */

const PVGIS_BASE_URL = "https://re.jrc.ec.europa.eu/api/v5_3/PVcalc";

/** Pérdidas totales del sistema en % (cableado, inversor, suciedad, temperatura ya la modela PVGIS aparte). */
const SYSTEM_LOSS_PERCENT = 14;

const PVGIS_TIMEOUT_MS = 9000;

/** La radiación de un punto no cambia: cachear 30 días por URL. */
const REVALIDATE_SECONDS = 60 * 60 * 24 * 30;

export async function GET(request: NextRequest) {
  const lat = Number(request.nextUrl.searchParams.get("lat"));
  const lon = Number(request.nextUrl.searchParams.get("lon"));

  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return NextResponse.json(
      { error: "Parámetros lat y lon inválidos." },
      { status: 400 }
    );
  }

  const params = new URLSearchParams({
    lat: lat.toFixed(5),
    lon: lon.toFixed(5),
    // 1 kWp para obtener el rendimiento específico (kWh/kWp·año) y escalar después.
    peakpower: "1",
    loss: String(SYSTEM_LOSS_PERCENT),
    // Optimiza inclinación y orientación (necesario en hemisferio sur: el default aspect=0 mira al sur).
    optimalangles: "1",
    outputformat: "json",
  });

  try {
    const res = await fetch(`${PVGIS_BASE_URL}?${params.toString()}`, {
      signal: AbortSignal.timeout(PVGIS_TIMEOUT_MS),
      next: { revalidate: REVALIDATE_SECONDS },
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: `PVGIS respondió con estado ${res.status}.` },
        { status: 502 }
      );
    }

    const data = await res.json();
    const fixed = data?.outputs?.totals?.fixed;
    const yieldKwhPerKwpYear = fixed?.E_y;

    if (typeof yieldKwhPerKwpYear !== "number" || yieldKwhPerKwpYear <= 0) {
      return NextResponse.json(
        { error: "Respuesta de PVGIS sin dato de energía anual (E_y)." },
        { status: 502 }
      );
    }

    return NextResponse.json({
      yieldKwhPerKwpYear,
      irradiationKwhM2Year: typeof fixed?.["H(i)_y"] === "number" ? fixed["H(i)_y"] : null,
      radiationDb: data?.inputs?.meteo_data?.radiation_db ?? null,
      lossPercent: SYSTEM_LOSS_PERCENT,
    });
  } catch {
    return NextResponse.json(
      { error: "No se pudo consultar PVGIS (timeout o error de red)." },
      { status: 502 }
    );
  }
}
