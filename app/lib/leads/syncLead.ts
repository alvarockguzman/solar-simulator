import { createLeadInMonday } from "../monday/createLeadItem";
import type { LeadMondayPayload } from "../monday/types";
import { submitToGoogleSheet } from "./submitToGoogleSheet";

export function sheetPayloadToMondayLead(
  sheetPayload: Record<string, unknown>
): LeadMondayPayload {
  return {
    nombre: String(sheetPayload.nombre ?? ""),
    apellido: String(sheetPayload.apellido ?? ""),
    empresa: String(sheetPayload.empresa ?? ""),
    mail: String(sheetPayload.mail ?? ""),
    telefono: sheetPayload.telefono ? String(sheetPayload.telefono) : undefined,
    origen: String(sheetPayload.origen ?? "básica"),
    direccion: sheetPayload.direccion
      ? String(sheetPayload.direccion)
      : undefined,
    lat: sheetPayload.lat as number | string | undefined,
    lng: sheetPayload.lng as number | string | undefined,
    superficie_m2: sheetPayload.superficie_m2 as number | string | undefined,
    tarifa: sheetPayload.tarifa ? String(sheetPayload.tarifa) : undefined,
    consumo_kwh_año: sheetPayload.consumo_kwh_año as
      | number
      | string
      | undefined,
    potencia_kwp: sheetPayload.potencia_kwp as number | string | undefined,
    energia_kwh_año: sheetPayload.energia_kwh_año as
      | number
      | string
      | undefined,
    ahorro_usd_año: sheetPayload.ahorro_usd_año as number | string | undefined,
    repago_años: sheetPayload.repago_años as number | string | null | undefined,
    inversion_usd: sheetPayload.inversion_usd as number | string | undefined,
  };
}

export async function syncLeadToSheetAndMonday(
  sheetPayload: Record<string, unknown>
): Promise<
  | { ok: true; mondaySynced: boolean; mondayItemId?: string }
  | { ok: false; error: string; details?: string }
> {
  let sheetResult: Awaited<ReturnType<typeof submitToGoogleSheet>>;
  try {
    sheetResult = await submitToGoogleSheet(sheetPayload);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Error al guardar el lead: ${message}` };
  }

  if (!sheetResult.ok) {
    return {
      ok: false,
      error: sheetResult.error,
      details: sheetResult.details,
    };
  }

  const mondayLead = sheetPayloadToMondayLead(sheetPayload);
  let mondayResult: Awaited<ReturnType<typeof createLeadInMonday>>;
  try {
    mondayResult = await createLeadInMonday(mondayLead);
  } catch (err) {
    console.error("[Monday] Excepción al crear lead:", err);
    return { ok: true, mondaySynced: false };
  }

  if (!mondayResult.ok) {
    console.error("[Monday] No se pudo crear el lead:", mondayResult.error, {
      origen: mondayLead.origen,
      mail: mondayLead.mail,
    });
    return { ok: true, mondaySynced: false };
  }

  return {
    ok: true,
    mondaySynced: true,
    mondayItemId: mondayResult.itemId,
  };
}
