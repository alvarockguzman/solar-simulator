import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { logCotizacion, nextNumeroCotizacion } from "@/lib/cotizador/cotizaciones";
import { QuotePdf } from "@/lib/cotizador/pdf/QuotePdf";
import { getCatalog } from "@/lib/cotizador/pricing";
import type { QuoteInput, QuoteResult } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * Genera el PDF de la cotización server-side, lo sube a Vercel Blob y
 * registra la cotización en la pestaña "Cotizaciones" del Sheet.
 */
export async function POST(request: Request) {
  let body: { input: QuoteInput; result: QuoteResult };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const { input, result } = body;
  if (!input?.cliente || !result?.bom || !result?.economics) {
    return NextResponse.json(
      { error: "Faltan input o result de la cotización." },
      { status: 400 }
    );
  }

  const token = process.env.BLOB_READ_WRITE_TOKEN;
  if (!token) {
    return NextResponse.json(
      {
        error:
          "BLOB_READ_WRITE_TOKEN no configurado: no se puede guardar el PDF. Crear un Blob store en Vercel (ver CONECTAR_VERCEL_BLOB.md).",
      },
      { status: 503 }
    );
  }

  try {
    const catalog = await getCatalog();
    const numero = await nextNumeroCotizacion();
    const fecha = new Date().toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });

    const buffer = await renderToBuffer(
      React.createElement(QuotePdf, {
        input,
        result,
        numero,
        fecha,
        validezDias: catalog.parametros.validezDiasCotizacion,
        supuestos: catalog.parametros.supuestosTexto,
      }) as React.ReactElement<DocumentProps>
    );

    const safeCliente = input.cliente.razonSocial
      .replace(/[^a-zA-Z0-9-]/g, "_")
      .slice(0, 40);
    const blob = await put(
      `cotizador/${numero}-${safeCliente}.pdf`,
      Buffer.from(buffer),
      {
        access: "public",
        contentType: "application/pdf",
        allowOverwrite: true,
      }
    );

    try {
      await logCotizacion({
        numero,
        cliente: input.cliente.razonSocial,
        kwp: Math.round(result.sizing.kwpSistema * 10) / 10,
        capexUsd: result.bom.capexUsd,
        paybackAnos: result.economics.paybackAnos,
        pdfUrl: blob.url,
        vendedor: input.cliente.contacto || "",
      });
    } catch (err) {
      // El PDF ya existe: no fallar la request por el log.
      console.error("No se pudo registrar la cotización en el Sheet:", err);
    }

    return NextResponse.json({ url: blob.url, numero });
  } catch (err) {
    console.error("Error generando PDF:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al generar el PDF." },
      { status: 500 }
    );
  }
}
