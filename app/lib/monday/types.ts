export interface LeadMondayPayload {
  nombre: string;
  apellido: string;
  empresa: string;
  mail: string;
  telefono?: string;
  origen: "básica" | "avanzada" | string;
  direccion?: string;
  lat?: number | string;
  lng?: number | string;
  superficie_m2?: number | string;
  tarifa?: string;
  consumo_kwh_año?: number | string;
  potencia_kwp?: number | string;
  energia_kwh_año?: number | string;
  ahorro_usd_año?: number | string;
  repago_años?: number | string | null;
  inversion_usd?: number | string;
}
