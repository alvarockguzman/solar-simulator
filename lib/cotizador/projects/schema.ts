import { z } from "zod";

const poligonoSchema = z.object({
  id: z.string(),
  points: z.array(z.tuple([z.number(), z.number()])),
  areaM2: z.number(),
});

const clienteSchema = z.object({
  razonSocial: z.string(),
  contacto: z.string(),
  email: z.string(),
  representanteModo: z.enum(["alvaro", "otro"]).optional(),
  representanteOtro: z.string().optional(),
  direccion: z.string(),
  lat: z.number(),
  lon: z.number(),
});

const techoSchema = z.object({
  tipoTecho: z.enum(["plano", "inclinado", "serrucho"]),
  kwpDeseado: z.number().nullable().optional(),
  factorAprovechamiento: z.number(),
  sombraPct: z.number().nullable(),
  azimutDeg: z.number().nullable(),
  inclinacionDeg: z.number().nullable(),
  distanciaTableroM: z.number().nullable(),
});

const consumoSchema = z.object({
  habilitado: z.boolean(),
  modo: z.enum(["promedio", "doce"]),
  promedioKwh: z.number(),
  mensualKwh: z.array(z.number()).length(12),
  tarifaModo: z.enum(["directa", "factura"]),
  tarifaNivel: z.enum(["T1", "T2", "T3"]).optional(),
  tarifaUsdKwh: z.number(),
  facturaMensualUsd: z.number(),
  pctDiurno: z.number(),
  consumoPreset: z.enum(["pequeno", "mediano", "grande"]).nullable().optional(),
  tarifaInyeccionUsdKwh: z.number().nullable().optional(),
});

const ajustesSchema = z.object({
  panelModelo: z.string().nullable(),
  inversorModelo: z.string().nullable(),
  margenPct: z.number().nullable(),
  descuentoPct: z.number(),
  lineasOverride: z.record(
    z.string(),
    z.object({
      cantidad: z.number().optional(),
      unitarioUsd: z.number().optional(),
    })
  ),
  lineasManuales: z.array(z.any()),
  mostrarDetalle: z.boolean(),
});

export const projectDraftSchema = z.object({
  id: z.string().uuid().optional(),
  step: z.number().int().min(1).max(5),
  proyectoNombre: z.string(),
  cliente: clienteSchema,
  techo: techoSchema,
  poligonos: z.array(poligonoSchema),
  consumo: consumoSchema,
  ajustes: ajustesSchema,
  snapshotDataUrl: z.string().nullable().optional(),
  vendedor: z.string().optional(),
  flowVersion: z.number().int().optional(),
  pvgisSnapshot: z.any().nullable().optional(),
  kwp: z.number().optional(),
  mwh: z.number().optional(),
});

export const projectPatchSchema = projectDraftSchema.partial().extend({
  step: z.number().int().min(1).max(5).optional(),
});

export type ProjectDraftInput = z.infer<typeof projectDraftSchema>;
export type ProjectPatchInput = z.infer<typeof projectPatchSchema>;
