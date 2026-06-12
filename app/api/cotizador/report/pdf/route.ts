import { NextResponse } from "next/server";
import { nextReportNumber } from "@/lib/cotizador/pdf/reportNumber";
import type { ProductionReportData } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export const maxDuration = 60;

interface PdfBody {
  report: ProductionReportData;
  snapshotDataUrl?: string | null;
  cliente?: string;
  borrador?: boolean;
  /** Si se pasa, no incrementa el contador (re-descarga del mismo reporte). */
  numero?: string;
}

/** Genera el PDF del Reporte de Producción y lo devuelve como attachment. */
export async function POST(request: Request) {
  let body: PdfBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (!body?.report?.metrics || !body?.report?.proyecto) {
    return NextResponse.json({ error: "Falta report en el body." }, { status: 400 });
  }

  try {
    const numero = body.numero ?? (await nextReportNumber());
    const { renderProductionReportBuffer } = await import(
      "@/lib/cotizador/pdf/renderProductionReportBuffer"
    );
    const buffer = await renderProductionReportBuffer({
      report: body.report,
      numero,
      snapshotDataUrl: body.snapshotDataUrl ?? null,
      borrador: body.borrador ?? body.report.metrics.fuenteClimatica === "estimado",
    });

    const safeName = (body.cliente || body.report.proyecto.nombre || "proyecto")
      .replace(/[^a-zA-Z0-9-]/g, "_")
      .slice(0, 50);
    const borrador = body.borrador ?? body.report.metrics.fuenteClimatica === "estimado";
    const filename = `Reporte de Produccion${borrador ? " BORRADOR" : ""} - ${safeName}.pdf`;

    return new NextResponse(Buffer.from(buffer), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "X-Report-Number": numero,
      },
    });
  } catch (err) {
    console.error("Error generando PDF de reporte:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar el PDF." },
      { status: 500 }
    );
  }
}
