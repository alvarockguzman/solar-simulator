import { z } from "zod";
import type {
  Catalog,
  ClippingPoint,
  Estructura,
  Inversor,
  Material,
  Panel,
  Parametros,
  RangoManoDeObra,
} from "../types";

/**
 * Parseo y validación de las pestañas del Google Sheet "Precios Cotizador".
 * Cada pestaña llega como una matriz de strings (primera fila = encabezados).
 * Separado de sheets.ts para poder testearlo sin credenciales.
 */

const numberFromCell = z.preprocess((v) => {
  if (typeof v === "number") return v;
  if (typeof v !== "string") return v;
  const cleaned = v.trim().replace(/\s/g, "").replace(/,/g, ".");
  if (cleaned === "") return undefined;
  return Number(cleaned);
}, z.number().finite());

const optionalNumberFromCell = z.preprocess((v) => {
  if (v === undefined || v === null) return null;
  if (typeof v === "string" && v.trim() === "") return null;
  const cleaned = String(v).trim().replace(/\s/g, "").replace(/,/g, ".");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}, z.number().finite().nullable());

const booleanFromCell = z.preprocess((v) => {
  const s = String(v ?? "").trim().toLowerCase();
  return ["true", "1", "si", "sí", "x", "yes", "verdadero"].includes(s);
}, z.boolean());

const tipoTechoCell = z.preprocess(
  (v) => String(v ?? "").trim().toLowerCase(),
  z.enum(["plano", "inclinado", "serrucho"])
);

const panelSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  wp: numberFromCell,
  largo_m: numberFromCell,
  ancho_m: numberFromCell,
  precio_usd: numberFromCell,
  activo: booleanFromCell,
  // Specs técnicas opcionales en el Sheet, con defaults sensatos.
  voc_v: optionalNumberFromCell.optional().default(null),
  vmp_v: optionalNumberFromCell.optional().default(null),
  beta_voc_pct_c: optionalNumberFromCell.optional().default(null),
  specs_estimadas: booleanFromCell.optional().default(false),
  bifacial: booleanFromCell.optional().default(false),
});

const inversorSchema = z.object({
  marca: z.string().min(1),
  modelo: z.string().min(1),
  kw_ac: numberFromCell,
  mppt: z.string().optional().default(""),
  precio_usd: numberFromCell,
  activo: booleanFromCell,
  vdc_max_v: optionalNumberFromCell.optional().default(null),
  mppt_count: optionalNumberFromCell.optional().default(null),
  eficiencia_euro: optionalNumberFromCell.optional().default(null),
  trifasico: booleanFromCell.optional().default(true),
});

const estructuraSchema = z.object({
  tipo_techo: tipoTechoCell,
  descripcion: z.string().optional().default(""),
  usd_por_panel: numberFromCell,
});

const materialSchema = z.object({
  item: z.string().min(1),
  regla: z.preprocess(
    (v) => String(v ?? "").trim().toLowerCase(),
    z.enum(["por_metro", "por_rango_kwp"])
  ),
  kwp_min: optionalNumberFromCell,
  kwp_max: optionalNumberFromCell,
  valor_usd: numberFromCell,
});

const manoDeObraSchema = z.object({
  kwp_min: numberFromCell,
  kwp_max: numberFromCell,
  usd_por_kwp: numberFromCell,
});

/** Convierte la matriz cruda (fila 0 = encabezados) en objetos por encabezado. */
export function rowsToObjects(rows: string[][]): Record<string, string>[] {
  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase().replace(/\s+/g, "_"));
  return rows.slice(1).flatMap((row) => {
    if (row.every((cell) => String(cell ?? "").trim() === "")) return [];
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = row[i] ?? "";
    });
    return [obj];
  });
}

export function parsePaneles(rows: string[][]): Panel[] {
  return rowsToObjects(rows)
    .map((r) => panelSchema.parse(r))
    .filter((p) => p.activo)
    .map((p) => {
      // Aproximación si el Sheet no trae Voc: ~0.085 V por Wp (módulos TOPCon
      // 66-78 celdas quedan en 48-55 V). Vmp ≈ 0.84 × Voc.
      const vocV = p.voc_v ?? Math.round(p.wp * 0.085 * 10) / 10;
      return {
        marca: p.marca,
        modelo: p.modelo,
        wp: p.wp,
        largoM: p.largo_m,
        anchoM: p.ancho_m,
        precioUsd: p.precio_usd,
        activo: p.activo,
        vocV,
        vmpV: p.vmp_v ?? Math.round(vocV * 0.84 * 10) / 10,
        bifacial: p.bifacial,
        betaVocPctC: p.beta_voc_pct_c ?? -0.25,
        specsEstimadas: p.specs_estimadas || p.voc_v == null,
      };
    });
}

export function parseInversores(rows: string[][]): Inversor[] {
  return rowsToObjects(rows)
    .map((r) => inversorSchema.parse(r))
    .filter((i) => i.activo)
    .map((i) => ({
      marca: i.marca,
      modelo: i.modelo,
      kwAc: i.kw_ac,
      mppt: i.mppt,
      precioUsd: i.precio_usd,
      activo: i.activo,
      vdcMaxV: i.vdc_max_v ?? 1100,
      mpptCount: i.mppt_count ?? 2,
      eficienciaEuro: i.eficiencia_euro ?? 0.98,
      trifasico: i.trifasico,
    }));
}

export function parseEstructuras(rows: string[][]): Estructura[] {
  return rowsToObjects(rows)
    .map((r) => estructuraSchema.parse(r))
    .map((e) => ({
      tipoTecho: e.tipo_techo,
      descripcion: e.descripcion,
      usdPorPanel: e.usd_por_panel,
    }));
}

export function parseMateriales(rows: string[][]): Material[] {
  return rowsToObjects(rows)
    .map((r) => materialSchema.parse(r))
    .map((m) => ({
      item: m.item,
      regla: m.regla,
      kwpMin: m.kwp_min,
      kwpMax: m.kwp_max,
      valorUsd: m.valor_usd,
    }));
}

export function parseManoDeObra(rows: string[][]): RangoManoDeObra[] {
  return rowsToObjects(rows)
    .map((r) => manoDeObraSchema.parse(r))
    .map((m) => ({ kwpMin: m.kwp_min, kwpMax: m.kwp_max, usdPorKwp: m.usd_por_kwp }));
}

export const CLIPPING_CURVE_DEFAULT: ClippingPoint[] = [
  [1.1, 0.001],
  [1.15, 0.001],
  [1.25, 0.005],
  [1.35, 0.015],
];

/**
 * Defaults nacionales Argentina (jun 2026).
 * - tarifaInyeccion 0.035 USD/kWh: Ley 27.424 net billing (~mayorista 2025-26).
 * - co2KgKwh 0.30: factor medio red argentina (Secretaría de Energía / CAMMESA).
 * - degradacionAnual 0.004: catálogo n-type, garantía típica 0.4%/año.
 */
export const PARAMETROS_DEFAULT: Parametros = {
  margenDefault: 0.35,
  tasaDescuento: 0.1,
  opexUsdKwp: 11,
  packingPlano: 0.5,
  packingInclinado: 0.85,
  packingSerrucho: 0.5,
  tiltInclinadoDefault: 8,
  tiltSerruchoDefault: 20,
  sombraPct: 3,
  soilingPct: 2.5,
  mismatchPct: 2,
  dcWiringPct: 1,
  acPct: 0.5,
  clippingCurve: CLIPPING_CURVE_DEFAULT,
  tarifaInyeccion: 0.035,
  autoconsumoObjetivo: 1,
  co2KgKwh: 0.3,
  validezDiasCotizacion: 15,
  ingenieriaFijaUsd: 1500,
  ingenieriaPct: 0.02,
  degradacionAnual: 0.004,
  pctDiurnoDefault: 0.7,
  escalacionTarifaReal: 0,
  tminDisenoC: -10,
  mountingInclinado: "building",
  mountingPlano: "free",
  mountingSerrucho: "free",
  tarifasFechaFuente: "Promedios nacionales — actualizar por distribuidora",
  supuestosTexto:
    "Cotización preliminar sujeta a visita técnica. No incluye obras civiles, refuerzos estructurales, adecuaciones del tablero general ni trámites ante la distribuidora fuera de los indicados. Precios en USD sin IVA.",
};

/** Mapeo clave del Sheet → campo de Parametros. */
const PARAM_KEYS: Record<string, keyof Parametros> = {
  margen_default: "margenDefault",
  tasa_descuento: "tasaDescuento",
  opex_usd_kwp: "opexUsdKwp",
  packing_plano: "packingPlano",
  packing_inclinado: "packingInclinado",
  packing_serrucho: "packingSerrucho",
  tilt_inclinado_default: "tiltInclinadoDefault",
  tilt_serrucho_default: "tiltSerruchoDefault",
  sombra_pct: "sombraPct",
  soiling_pct: "soilingPct",
  mismatch_pct: "mismatchPct",
  dc_wiring_pct: "dcWiringPct",
  ac_pct: "acPct",
  clipping_curve: "clippingCurve",
  tarifa_inyeccion: "tarifaInyeccion",
  autoconsumo_objetivo: "autoconsumoObjetivo",
  co2_kg_kwh: "co2KgKwh",
  validez_dias_cotizacion: "validezDiasCotizacion",
  ingenieria_fija_usd: "ingenieriaFijaUsd",
  ingenieria_pct: "ingenieriaPct",
  degradacion_anual: "degradacionAnual",
  pct_diurno_default: "pctDiurnoDefault",
  supuestos_texto: "supuestosTexto",
  escalacion_tarifa_real: "escalacionTarifaReal",
  tmin_diseno_c: "tminDisenoC",
  mounting_inclinado: "mountingInclinado",
  mounting_plano: "mountingPlano",
  mounting_serrucho: "mountingSerrucho",
  tarifas_fecha_fuente: "tarifasFechaFuente",
};

/** Formato en el Sheet: "1.10:0.001;1.15:0.001;1.25:0.005;1.35:0.015" */
export function parseClippingCurve(valor: string): ClippingPoint[] | null {
  const points = valor
    .split(";")
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => {
      const [ratio, loss] = p.split(":").map((v) => Number(v.trim().replace(",", ".")));
      return [ratio, loss] as ClippingPoint;
    });
  if (points.length === 0 || points.some(([r, l]) => !Number.isFinite(r) || !Number.isFinite(l))) {
    return null;
  }
  return points.sort((a, b) => a[0] - b[0]);
}

export function parseParametros(rows: string[][]): Parametros {
  const result: Parametros = { ...PARAMETROS_DEFAULT };
  for (const r of rowsToObjects(rows)) {
    const clave = (r.clave ?? "").trim().toLowerCase();
    const campo = PARAM_KEYS[clave];
    if (!campo) continue;
    const valor = r.valor ?? "";
    if (campo === "supuestosTexto" || campo === "tarifasFechaFuente") {
      if (valor.trim()) result[campo] = valor.trim();
    } else if (
      campo === "mountingInclinado" ||
      campo === "mountingPlano" ||
      campo === "mountingSerrucho"
    ) {
      const m = valor.trim().toLowerCase();
      if (m === "building" || m === "free" || m === "ground") {
        result[campo] = m as "building" | "free";
      }
    } else if (campo === "clippingCurve") {
      const curve = parseClippingCurve(valor);
      if (curve) result.clippingCurve = curve;
    } else {
      const n = Number(String(valor).trim().replace(/\s/g, "").replace(/,/g, "."));
      if (Number.isFinite(n)) {
        (result[campo] as number) = n;
      }
    }
  }
  return result;
}

export interface RawTabs {
  paneles: string[][];
  inversores: string[][];
  estructuras: string[][];
  materiales: string[][];
  manoDeObra: string[][];
  parametros: string[][];
}

export function parseCatalog(
  raw: RawTabs,
  meta: { stale: boolean; source: Catalog["source"]; fetchedAt: string }
): Catalog {
  return {
    paneles: parsePaneles(raw.paneles),
    inversores: parseInversores(raw.inversores),
    estructuras: parseEstructuras(raw.estructuras),
    materiales: parseMateriales(raw.materiales),
    manoDeObra: parseManoDeObra(raw.manoDeObra),
    parametros: parseParametros(raw.parametros),
    ...meta,
  };
}
