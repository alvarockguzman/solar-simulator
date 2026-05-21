import {
  MONDAY_COLUMNS,
  mapOrigenToMondayLabel,
  mapTarifaToMondayLabel,
} from "./config";
import { isMondayConfigured, mondayQuery } from "./client";
import type { LeadMondayPayload } from "./types";

function formatDateYmd(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function toNumberString(value: number | string | undefined | null): string | null {
  if (value === undefined || value === null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return null;
  return String(n);
}

function buildItemName(lead: LeadMondayPayload): string {
  const fullName = `${lead.nombre} ${lead.apellido}`.trim();
  return lead.empresa ? `${fullName} — ${lead.empresa}` : fullName;
}

function buildColumnValues(lead: LeadMondayPayload): Record<string, unknown> {
  const cols: Record<string, unknown> = {
    [MONDAY_COLUMNS.empresa]: lead.empresa,
    [MONDAY_COLUMNS.email]: { email: lead.mail, text: lead.mail },
    [MONDAY_COLUMNS.origen]: { label: mapOrigenToMondayLabel(lead.origen) },
    [MONDAY_COLUMNS.fecha]: { date: formatDateYmd(new Date()) },
    [MONDAY_COLUMNS.estadoComercial]: { label: "Nuevo" },
  };

  if (lead.telefono?.trim()) {
    cols[MONDAY_COLUMNS.telefono] = {
      phone: lead.telefono.trim(),
      countryShortName: "AR",
    };
  }

  if (lead.direccion) cols[MONDAY_COLUMNS.direccion] = lead.direccion;

  const lat = toNumberString(lead.lat);
  if (lat !== null) cols[MONDAY_COLUMNS.latitud] = lat;

  const lng = toNumberString(lead.lng);
  if (lng !== null) cols[MONDAY_COLUMNS.longitud] = lng;

  const superficie = toNumberString(lead.superficie_m2);
  if (superficie !== null) cols[MONDAY_COLUMNS.superficie] = superficie;

  const tarifaLabel = mapTarifaToMondayLabel(lead.tarifa);
  if (tarifaLabel) cols[MONDAY_COLUMNS.tarifa] = { label: tarifaLabel };

  const consumo = toNumberString(lead.consumo_kwh_año);
  if (consumo !== null) cols[MONDAY_COLUMNS.consumo] = consumo;

  const potencia = toNumberString(lead.potencia_kwp);
  if (potencia !== null) cols[MONDAY_COLUMNS.potencia] = potencia;

  const energia = toNumberString(lead.energia_kwh_año);
  if (energia !== null) cols[MONDAY_COLUMNS.energia] = energia;

  const ahorro = toNumberString(lead.ahorro_usd_año);
  if (ahorro !== null) cols[MONDAY_COLUMNS.ahorro] = ahorro;

  const repago = toNumberString(lead.repago_años);
  if (repago !== null) cols[MONDAY_COLUMNS.repago] = repago;

  const inversion = toNumberString(lead.inversion_usd);
  if (inversion !== null) cols[MONDAY_COLUMNS.inversion] = inversion;

  return cols;
}

const CREATE_ITEM_MUTATION = `
  mutation CreateLeadItem($boardId: ID!, $itemName: String!, $columnValues: JSON!) {
    create_item(
      board_id: $boardId,
      item_name: $itemName,
      column_values: $columnValues
    ) {
      id
    }
  }
`;

export async function createLeadInMonday(
  lead: LeadMondayPayload
): Promise<{ ok: true; itemId: string } | { ok: false; error: string }> {
  if (!isMondayConfigured()) {
    return { ok: false, error: "Monday no configurado (faltan variables de entorno)" };
  }

  const boardId = process.env.MONDAY_BOARD_ID!;
  const itemName = buildItemName(lead);
  const columnValues = JSON.stringify(buildColumnValues(lead));

  const result = await mondayQuery<{
    create_item: { id: string };
  }>(CREATE_ITEM_MUTATION, {
    boardId,
    itemName,
    columnValues,
  });

  if ("error" in result) {
    return { ok: false, error: result.error };
  }

  const itemId = result.data.create_item?.id;
  if (!itemId) {
    return { ok: false, error: "Monday no devolvió id del item" };
  }

  return { ok: true, itemId };
}
