import { google } from "googleapis";
import type { Catalog } from "../types";
import { parseCatalog, type RawTabs } from "./parse";

/**
 * Lectura del Google Sheet "Precios Cotizador" con service account.
 * Env: GOOGLE_SERVICE_ACCOUNT_JSON (JSON completo en una línea) y PRICING_SHEET_ID.
 * El Sheet debe estar compartido (lector) con el email del service account.
 */

const TAB_RANGES = {
  paneles: "Paneles!A1:Z200",
  inversores: "Inversores!A1:Z200",
  estructuras: "Estructuras!A1:Z200",
  materiales: "Materiales!A1:Z200",
  manoDeObra: "ManoDeObra!A1:Z200",
  parametros: "Parametros!A1:Z200",
} as const;

export function hasSheetsCredentials(): boolean {
  return Boolean(process.env.GOOGLE_SERVICE_ACCOUNT_JSON && process.env.PRICING_SHEET_ID);
}

export function getSheetsClient() {
  const credentials = JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_JSON!);
  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
  return google.sheets({ version: "v4", auth });
}

/** Lee todas las pestañas de precios y devuelve el catálogo validado. */
export async function fetchCatalogFromSheets(): Promise<Catalog> {
  const sheets = getSheetsClient();
  const spreadsheetId = process.env.PRICING_SHEET_ID!;

  const res = await sheets.spreadsheets.values.batchGet({
    spreadsheetId,
    ranges: Object.values(TAB_RANGES),
  });

  const ranges = res.data.valueRanges ?? [];
  const keys = Object.keys(TAB_RANGES) as (keyof typeof TAB_RANGES)[];
  const raw = {} as RawTabs;
  keys.forEach((key, i) => {
    raw[key] = (ranges[i]?.values ?? []) as string[][];
  });

  return parseCatalog(raw, {
    stale: false,
    source: "sheets",
    fetchedAt: new Date().toISOString(),
  });
}
