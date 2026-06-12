import { NextResponse } from "next/server";
import {
  computeSizing,
  deriveProductionReport,
  fallbackPvgis,
  quote,
  selectInverter,
  systemLosses,
} from "@/lib/cotizador/engine";
import { getCatalog } from "@/lib/cotizador/pricing";
import { getProductionData } from "@/lib/cotizador/pvgis";
import { mountingForTecho } from "@/lib/cotizador/pvgis/client";
import type { PvgisResult, QuoteInput } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";

interface ReportRequestBody {
  proyectoNombre?: string;
  input: QuoteInput;
  pvgisSnapshot?: PvgisResult | null;
}

/**
 * Reporte de Producción end-to-end: catálogo + PVcalc/MRcalc (paralelo,
 * cacheado) + motor + métricas derivadas. Devuelve también result/catalog/
 * pvgis/ghi para que la vista recalcule en vivo ante ajustes técnicos.
 */
export async function POST(request: Request) {
  let body: ReportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const input = body?.input;
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

    // Estimación inicial de kWp (PVcalc es lineal en peakpower, así que el
    // perfil por kWp no depende de esta estimación).
    const sizingEstimado = computeSizing(
      input.techo,
      input.consumo,
      catalog,
      fallbackPvgis().yieldKwhPerKwpYear,
      input.ajustes?.panelModelo ?? null
    );

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

    const { pvgis, ghi } = await getProductionData(
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
      body.pvgisSnapshot ?? null
    );

    const result = quote(input, catalog, pvgis);
    const report = deriveProductionReport({
      proyectoNombre: body.proyectoNombre ?? "",
      input,
      result,
      ghi,
      catalog,
    });

    return NextResponse.json({ report, result, catalog, pvgis, ghi });
  } catch (err) {
    console.error("Error en /api/cotizador/report:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al calcular el reporte." },
      { status: 500 }
    );
  }
}
