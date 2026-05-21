/** Board Leads Solar — https://renovatio812485.monday.com/boards/18414300841 */
export const MONDAY_COLUMNS = {
  empresa: "text_mm3jp15b",
  email: "email_mm3j9ybp",
  telefono: "phone_mm3j1azc",
  origen: "color_mm3jqxh8",
  fecha: "date_mm3j3ct6",
  direccion: "text_mm3jz3qn",
  latitud: "numeric_mm3j64z1",
  longitud: "numeric_mm3jqttb",
  superficie: "numeric_mm3jq261",
  tarifa: "color_mm3j9qj3",
  consumo: "numeric_mm3jjay5",
  potencia: "numeric_mm3j92n4",
  energia: "numeric_mm3j32nd",
  ahorro: "numeric_mm3j91z0",
  repago: "numeric_mm3jn908",
  inversion: "numeric_mm3jtpaw",
  estadoComercial: "color_mm3j1x9q",
} as const;

const ORIGEN_APP_TO_MONDAY: Record<string, string> = {
  básica: "calculadora",
  avanzada: "calculadora",
  relevamiento: "relevamiento",
};

const TARIFA_LABELS = new Set(["T1", "T2", "T3"]);

export function mapOrigenToMondayLabel(origen: string): string {
  return ORIGEN_APP_TO_MONDAY[origen] ?? "otros";
}

export function mapTarifaToMondayLabel(tarifa: string | undefined): string | null {
  if (!tarifa || !TARIFA_LABELS.has(tarifa)) return null;
  return tarifa;
}
