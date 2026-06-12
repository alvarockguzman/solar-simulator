import { NextResponse } from "next/server";
import { isResendConfigured } from "@/lib/cotizador/email/sendReportEmail";
import { hasSheetsCredentials, getSheetsClient } from "@/lib/cotizador/pricing/sheets";
import { getMockCatalog } from "@/lib/cotizador/pricing/mock";

export const dynamic = "force-dynamic";

/**
 * Health check del cotizador: Sheets, PVGIS (PVcalc + MRcalc), Resend, Blob, auth.
 * GET /api/cotizador/health
 */
export async function GET() {
  const checks: Record<string, { ok: boolean; detail: string }> = {};

  // Google Sheets / catálogo mock
  if (!hasSheetsCredentials()) {
    const mock = getMockCatalog();
    checks.sheets = {
      ok: true,
      detail: `Sin Sheet de precios: catálogo mock G2E (${mock.paneles.length} paneles, ${mock.inversores.length} inversores).`,
    };
  } else {
    try {
      const sheets = getSheetsClient();
      await sheets.spreadsheets.get({
        spreadsheetId: process.env.PRICING_SHEET_ID!,
        fields: "spreadsheetId",
      });
      checks.sheets = { ok: true, detail: "Acceso al Sheet de precios OK." };
    } catch (err) {
      checks.sheets = {
        ok: false,
        detail: `Error accediendo al Sheet: ${err instanceof Error ? err.message : "desconocido"}`,
      };
    }
  }

  // PVGIS PVcalc
  try {
    const res = await fetch(
      "https://re.jrc.ec.europa.eu/api/v5_2/PVcalc?lat=-31.4&lon=-64.2&peakpower=1&loss=14&optimalangles=1&outputformat=json",
      { signal: AbortSignal.timeout(9000), next: { revalidate: 3600 } }
    );
    checks.pvgis_pvcalc = res.ok
      ? { ok: true, detail: "PVGIS PVcalc responde OK." }
      : { ok: false, detail: `PVGIS PVcalc respondió ${res.status}.` };
  } catch {
    checks.pvgis_pvcalc = { ok: false, detail: "PVGIS PVcalc no responde." };
  }

  // PVGIS MRcalc (GHI)
  try {
    const res = await fetch(
      "https://re.jrc.ec.europa.eu/api/v5_2/MRcalc?lat=-31.4&lon=-64.2&horirrad=1&outputformat=json",
      { signal: AbortSignal.timeout(9000), next: { revalidate: 3600 } }
    );
    checks.pvgis_mrcalc = res.ok
      ? { ok: true, detail: "PVGIS MRcalc (GHI) responde OK." }
      : { ok: false, detail: `PVGIS MRcalc respondió ${res.status}.` };
  } catch {
    checks.pvgis_mrcalc = { ok: false, detail: "PVGIS MRcalc no responde." };
  }

  checks.resend = isResendConfigured()
    ? { ok: true, detail: "Resend configurado (RESEND_API_KEY + MAIL_FROM)." }
    : { ok: false, detail: "Resend no configurado: el botón de mail mostrará aviso." };

  checks.blob = process.env.BLOB_READ_WRITE_TOKEN
    ? { ok: true, detail: "Token de Blob configurado (PDF cotización etapa 2)." }
    : { ok: false, detail: "BLOB_READ_WRITE_TOKEN no configurado." };

  checks.auth = process.env.APP_PASSWORD
    ? { ok: true, detail: "APP_PASSWORD configurada." }
    : { ok: false, detail: "APP_PASSWORD vacía: /cotizador queda sin protección." };

  // Resend y mock catalog son opcionales; solo fallan checks críticos de red.
  const critical = ["pvgis_pvcalc", "pvgis_mrcalc"];
  const ok = critical.every((k) => checks[k]?.ok);
  return NextResponse.json({ ok, checks }, { status: ok ? 200 : 503 });
}
