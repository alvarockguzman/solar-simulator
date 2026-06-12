import type { ClienteInput } from "./types";

export type RepresentanteModo = "alvaro" | "otro";

export const REPRESENTANTE_ALVARO = "Alvaro";

/** Extrae ciudad/localidad de una dirección Nominatim (heurística AR). */
export function extractCityFromAddress(displayName: string): string {
  const parts = displayName
    .split(",")
    .map((p) => p.trim())
    .filter(Boolean);
  if (parts.length === 0) return "";
  if (parts.length >= 4) return parts[parts.length - 3];
  if (parts.length >= 2) return parts[parts.length - 2];
  return parts[0];
}

export function suggestProyectoNombre(razonSocial: string, direccion: string): string {
  const ciudad = extractCityFromAddress(direccion);
  const nombre = razonSocial.trim();
  if (!nombre) return ciudad ? `Proyecto — ${ciudad}` : "";
  return ciudad ? `${nombre} — ${ciudad}` : nombre;
}

export function representanteComercialNombre(cliente: ClienteInput): string {
  if (cliente.representanteModo === "otro") {
    return cliente.representanteOtro.trim() || "Otro";
  }
  return REPRESENTANTE_ALVARO;
}

/** Cliente del API/schema Zod (campos de representante opcionales). */
export type ClienteInputDraft = Omit<ClienteInput, "representanteModo" | "representanteOtro"> & {
  representanteModo?: ClienteInput["representanteModo"];
  representanteOtro?: string;
};

/** Normaliza proyectos viejos que guardaban el representante en `email`. */
export function normalizeCliente(cliente: ClienteInputDraft): ClienteInput {
  if (cliente.representanteModo) {
    return {
      ...cliente,
      representanteModo: cliente.representanteModo,
      representanteOtro: cliente.representanteOtro ?? "",
      email: representanteComercialNombre({
        ...cliente,
        representanteModo: cliente.representanteModo,
        representanteOtro: cliente.representanteOtro ?? "",
      }),
    };
  }
  const legacy = cliente.email?.trim() ?? "";
  if (legacy && legacy !== REPRESENTANTE_ALVARO) {
    return {
      ...cliente,
      representanteModo: "otro",
      representanteOtro: legacy,
      email: legacy,
    };
  }
  return {
    ...cliente,
    representanteModo: "alvaro",
    representanteOtro: "",
    email: REPRESENTANTE_ALVARO,
  };
}
