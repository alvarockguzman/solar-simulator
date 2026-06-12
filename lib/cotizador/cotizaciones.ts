import { getSheetsClient, hasSheetsCredentials } from "./pricing/sheets";

/**
 * Registro de cotizaciones en la pestaña "Cotizaciones" del mismo Sheet de
 * precios, y numeración AAAA-NNN (contador = filas del año actual + 1).
 * Sin credenciales de Google, la numeración usa un fallback con timestamp
 * y el registro se omite.
 */

const TAB = "Cotizaciones";

export interface RegistroCotizacion {
  numero: string;
  cliente: string;
  kwp: number;
  capexUsd: number;
  paybackAnos: number | null;
  pdfUrl: string;
  vendedor: string;
}

export async function nextNumeroCotizacion(): Promise<string> {
  const year = new Date().getFullYear();
  if (!hasSheetsCredentials()) {
    // Fallback sin Sheet: pseudo-único basado en timestamp.
    return `${year}-${String(Date.now()).slice(-4)}`;
  }
  const sheets = getSheetsClient();
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.PRICING_SHEET_ID!,
    range: `${TAB}!B2:B10000`,
  });
  const numeros = (res.data.values ?? [])
    .map((r) => String(r[0] ?? ""))
    .filter((n) => n.startsWith(`${year}-`));
  return `${year}-${String(numeros.length + 1).padStart(3, "0")}`;
}

export async function logCotizacion(registro: RegistroCotizacion): Promise<void> {
  if (!hasSheetsCredentials()) return;
  const sheets = getSheetsClient();
  await sheets.spreadsheets.values.append({
    spreadsheetId: process.env.PRICING_SHEET_ID!,
    range: `${TAB}!A1`,
    valueInputOption: "USER_ENTERED",
    requestBody: {
      values: [
        [
          new Date().toISOString().slice(0, 10),
          registro.numero,
          registro.cliente,
          registro.kwp,
          registro.capexUsd,
          registro.paybackAnos ?? "",
          registro.pdfUrl,
          registro.vendedor,
        ],
      ],
    },
  });
}
