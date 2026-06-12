import type { Catalog } from "../types";
import { getMockCatalog } from "./mock";
import { fetchCatalogFromSheets, hasSheetsCredentials } from "./sheets";

/**
 * Catálogo de precios con cache en memoria de 1 hora.
 * - Sin credenciales de Google → catálogo mock (desarrollo local).
 * - Si el refetch falla y hay cache previo → se sirve el cache con stale: true.
 */

const CACHE_TTL_MS = 60 * 60 * 1000;

let cached: Catalog | null = null;
let cachedAt = 0;

export async function getCatalog(): Promise<Catalog> {
  if (!hasSheetsCredentials()) {
    return getMockCatalog();
  }

  const fresh = cached && Date.now() - cachedAt < CACHE_TTL_MS;
  if (cached && fresh) return cached;

  try {
    const catalog = await fetchCatalogFromSheets();
    cached = catalog;
    cachedAt = Date.now();
    return catalog;
  } catch (err) {
    console.error("Error leyendo precios de Google Sheets:", err);
    if (cached) {
      return { ...cached, stale: true };
    }
    throw new Error(
      "No se pudo leer el Sheet de precios y no hay cache previo. Verificá GOOGLE_SERVICE_ACCOUNT_JSON y PRICING_SHEET_ID."
    );
  }
}

/** Solo para tests. */
export function clearCatalogCache() {
  cached = null;
  cachedAt = 0;
}
