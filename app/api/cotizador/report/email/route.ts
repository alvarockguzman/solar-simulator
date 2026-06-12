import { NextResponse } from "next/server";
import { isResendConfigured, sendReportEmail } from "@/lib/cotizador/email/sendReportEmail";
import type { ProductionReportData } from "@/lib/cotizador/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailBody {
  report: ProductionReportData;
  to: string;
  snapshotDataUrl?: string | null;
  cliente?: string;
  mensaje?: string;
}

export async function POST(request: Request) {
  if (!isResendConfigured()) {
    return NextResponse.json(
      { error: "Envío de mail no configurado (RESEND_API_KEY / MAIL_FROM)." },
      { status: 503 }
    );
  }

  let body: EmailBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const to = body.to?.trim();
  if (!to || !EMAIL_RE.test(to)) {
    return NextResponse.json({ error: "Email destinatario inválido." }, { status: 400 });
  }
  if (!body?.report?.metrics) {
    return NextResponse.json({ error: "Falta report en el body." }, { status: 400 });
  }

  try {
    const { numero } = await sendReportEmail({
      report: body.report,
      to,
      snapshotDataUrl: body.snapshotDataUrl,
      cliente: body.cliente,
      mensaje: body.mensaje,
    });
    return NextResponse.json({ ok: true, numero });
  } catch (err) {
    console.error("Error enviando reporte por mail:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al enviar el mail." },
      { status: 500 }
    );
  }
}
