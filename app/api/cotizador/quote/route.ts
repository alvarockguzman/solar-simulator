import { NextResponse } from "next/server";
import {
  computeSizing,
  fallbackPvgis,
  quote,
  selectInverter,
  systemLosses,
} from "@/lib/cotizador/engine";
import { getCatalog } from "@/lib/cotizador/pricing";
import { mountingForTecho } from "@/lib/cotizador/pvgis/client";
import { getCachedPvgis } from "@/lib/cotizador/pvgis";
import type { PvgisResult, QuoteInput } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";

/**
 * Cálculo end-to-end: catálogo de precios + PVGIS + motor.
 * Devuelve también catalog y pvgis para que la UI de revisión recalcule
 * en vivo client-side sin re-llamar al servidor.
 */
export async function POST(request: Request) {
  let body: QuoteInput & { pvgisSnapshot?: PvgisResult | null };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { pvgisSnapshot, ...input } = body;

  const kwpManual = input?.techo?.kwpDeseado ?? 0;
  if (!input?.techo?.areasM2?.length && kwpManual <= 0) {
    return NextResponse.json(
      { error: "Indicá la potencia del proyecto (kWp) o dibujá el techo en el mapa." },
      { status: 400 }
    );
  }
  if (!input.techo.areasM2) {
    input.techo.areasM2 = [];
  }
  if (!input.consumo?.mensualKwh?.length) {
    input.consumo = {
      mensualKwh: Array(12).fill(0),
      tarifaUsdKwh: input.consumo?.tarifaUsdKwh ?? 0,
      pctDiurno: input.consumo?.pctDiurno ?? 0.7,
    };
  }

  try {
    const catalog = await getCatalog();

    // PVGIS necesita un kWp de referencia, pero el sizing necesita el yield:
    // se estima primero con el yield de fallback. Como PVcalc es lineal en
    // peakpower, el perfil normalizado por kWp no depende de esta estimación.
    const sizingEstimado = computeSizing(
      input.techo,
      input.consumo,
      catalog,
      fallbackPvgis().yieldKwhPerKwpYear,
      input.ajustes?.panelModelo ?? null
    );

    // Pérdidas parametrizadas (sombra del sitio, soiling, clipping según el
    // load ratio del inversor preseleccionado, etc.) → parámetro loss de PVGIS.
    const preseleccion = selectInverter(
      sizingEstimado.kwpSistema,
      catalog.inversores,
      input.ajustes?.inversorModelo ?? null
    );
    const losses = systemLosses(catalog.parametros, {
      eficienciaEuroInversor: preseleccion?.combo[0]?.inversor.eficienciaEuro ?? 0.98,
      loadRatio: preseleccion?.loadRatio ?? 1.2,
      sombraPctSitio: input.techo.sombraPct ?? null,
    });

    let pvgis: PvgisResult;
    try {
      pvgis = await getCachedPvgis(
        {
          lat: input.cliente.lat,
          lon: input.cliente.lon,
          kwp: Math.max(1, Math.round(sizingEstimado.kwpSistema * 100) / 100),
          tipoTecho: input.techo.tipoTecho,
          azimutDeg: input.techo.azimutDeg,
          inclinacionDeg: input.techo.inclinacionDeg,
          lossPct: Math.round(losses.total * 1000) / 10,
          mountingplace: mountingForTecho(input.techo.tipoTecho, catalog.parametros),
        },
        pvgisSnapshot ?? null
      );
    } catch (err) {
      console.error("PVGIS falló, usando fallback:", err);
      pvgis = fallbackPvgis();
    }

    const result = quote(input, catalog, pvgis);
    return NextResponse.json({ result, catalog, pvgis });
  } catch (err) {
    console.error("Error en /api/cotizador/quote:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al calcular." },
      { status: 500 }
    );
  }
}
