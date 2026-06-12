import { promises as fs } from "fs";
import path from "path";
import { Resend } from "resend";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React from "react";
import { ProductionReportPdf } from "@/lib/cotizador/pdf/ProductionReportPdf";
import { nextReportNumber } from "@/lib/cotizador/pdf/reportNumber";
import type { ProductionReportData } from "@/lib/cotizador/types";

const LOG_PATH = path.join(process.cwd(), "data", "sent-log.json");

export interface SendReportEmailArgs {
  report: ProductionReportData;
  to: string;
  snapshotDataUrl?: string | null;
  cliente?: string;
  mensaje?: string;
}

export function isResendConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);
}

async function appendSentLog(entry: {
  fecha: string;
  proyecto: string;
  destinatario: string;
  kwp: number;
  mwh: number;
  numero: string;
}) {
  let log: typeof entry[] = [];
  try {
    const raw = await fs.readFile(LOG_PATH, "utf-8");
    log = JSON.parse(raw);
  } catch {
    /* vacío */
  }
  log.push(entry);
  await fs.mkdir(path.dirname(LOG_PATH), { recursive: true });
  await fs.writeFile(LOG_PATH, JSON.stringify(log.slice(-500), null, 2), "utf-8");
}

export async function sendReportEmail(args: SendReportEmailArgs): Promise<{ numero: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.MAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("Envío de mail no configurado (RESEND_API_KEY / MAIL_FROM).");
  }

  const numero = await nextReportNumber();
  const buffer = await renderToBuffer(
    React.createElement(ProductionReportPdf, {
      report: args.report,
      numero,
      snapshotDataUrl: args.snapshotDataUrl ?? null,
    }) as React.ReactElement<DocumentProps>
  );

  const { report, to, mensaje } = args;
  const proyecto = report.proyecto.nombre;
  const safeName = (args.cliente || proyecto || "proyecto")
    .replace(/[^a-zA-Z0-9-]/g, "_")
    .slice(0, 50);

  const resend = new Resend(apiKey);
  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;color:#1c1917">
      <p style="color:#d97706;font-weight:bold;margin-bottom:4px">RENOVATIO</p>
      <h2 style="margin:0 0 12px">Reporte de Producción Solar</h2>
      <p>Hola,</p>
      <p>Adjuntamos el reporte preliminar de producción para <strong>${proyecto}</strong>.</p>
      <table style="border-collapse:collapse;margin:16px 0">
        <tr><td style="padding:4px 12px 4px 0;color:#78716c">Potencia</td><td><strong>${report.metrics.kwpDc.toFixed(1)} kWp</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#78716c">Producción anual</td><td><strong>${report.metrics.energiaAnualMwh.toFixed(1)} MWh</strong></td></tr>
        <tr><td style="padding:4px 12px 4px 0;color:#78716c">Rendimiento</td><td><strong>${Math.round(report.metrics.kwhPorKwp)} kWh/kWp</strong></td></tr>
      </table>
      ${mensaje ? `<p style="border-left:3px solid #d97706;padding-left:12px;color:#444">${mensaje.replace(/</g, "&lt;")}</p>` : ""}
      <p style="color:#78716c;font-size:13px;margin-top:24px">Saludos,<br/>Equipo Renovatio<br/><a href="https://www.renovatio.lat">www.renovatio.lat</a></p>
    </div>`;

  const bcc = process.env.MAIL_BCC_INTERNO?.trim();

  const { error } = await resend.emails.send({
    from,
    to: [to],
    bcc: bcc ? [bcc] : undefined,
    subject: `Reporte de Producción Solar — ${proyecto}`,
    html,
    attachments: [
      {
        filename: `Reporte de Produccion - ${safeName}.pdf`,
        content: Buffer.from(buffer),
      },
    ],
  });

  if (error) {
    throw new Error(error.message ?? "Resend rechazó el envío.");
  }

  await appendSentLog({
    fecha: new Date().toISOString(),
    proyecto,
    destinatario: to,
    kwp: report.metrics.kwpDc,
    mwh: report.metrics.energiaAnualMwh,
    numero,
  });

  return { numero };
}
