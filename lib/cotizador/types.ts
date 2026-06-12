/**
 * Tipos compartidos del Cotizador Solar (catálogo de precios, input del wizard
 * y resultado del motor de cálculo). Ver docs/Plan_Cotizador_Solar.md.
 */

// ── Catálogo (Google Sheet "Precios Cotizador") ──────────────────────────────

export type TipoTecho = "plano" | "inclinado" | "serrucho";

export interface Panel {
  marca: string;
  modelo: string;
  wp: number;
  /** Dimensiones del panel en metros. */
  largoM: number;
  anchoM: number;
  precioUsd: number;
  activo: boolean;
  /** Tensión de circuito abierto (V). Default del parser: ≈0.085×Wp. */
  vocV: number;
  /** Tensión en el punto de máxima potencia (V). Default: 0.84×Voc. */
  vmpV: number;
  bifacial: boolean;
  /** Coeficiente de temperatura de Voc (%/°C, negativo). Default -0.25 si falta. */
  betaVocPctC: number;
  /** true si vocV/vmpV no provienen del datasheet (estimados). */
  specsEstimadas?: boolean;
}

export interface Inversor {
  marca: string;
  modelo: string;
  kwAc: number;
  /** Rango de tensión MPPT (informativo). */
  mppt: string;
  precioUsd: number;
  activo: boolean;
  /** Tensión DC máxima de entrada (V). Default 1100. */
  vdcMaxV: number;
  /** Cantidad de entradas MPPT. */
  mpptCount: number;
  /** Eficiencia europea (fracción, ej. 0.98). */
  eficienciaEuro: number;
  trifasico: boolean;
}

export interface Estructura {
  tipoTecho: TipoTecho;
  descripcion: string;
  usdPorPanel: number;
}

export type ReglaMaterial = "por_metro" | "por_rango_kwp";

/**
 * Una fila de la pestaña Materiales. Para regla "por_metro" se usa valorUsd
 * como USD/m; para "por_rango_kwp", el costo fijo valorUsd aplica si el kWp
 * del sistema cae en [kwpMin, kwpMax).
 */
export interface Material {
  item: string;
  regla: ReglaMaterial;
  kwpMin: number | null;
  kwpMax: number | null;
  valorUsd: number;
}

export interface RangoManoDeObra {
  kwpMin: number;
  kwpMax: number;
  usdPorKwp: number;
}

/** Punto de la curva de clipping: [loadRatio, pérdida fracción]. */
export type ClippingPoint = [number, number];

export interface Parametros {
  /** Margen comercial default (fracción, ej. 0.25). */
  margenDefault: number;
  /** Tasa de descuento anual para el VAN (fracción). */
  tasaDescuento: number;
  /** OPEX anual en USD por kWp. */
  opexUsdKwp: number;
  /**
   * Packing por tipo de techo: fracción del área bruta del polígono que
   * ocupan los módulos (incluye pasillos y separación entre filas).
   */
  packingPlano: number;
  packingInclinado: number;
  packingSerrucho: number;
  /** Inclinación default por tipo de techo (grados). Plano usa óptimo PVGIS. */
  tiltInclinadoDefault: number;
  tiltSerruchoDefault: number;
  /** Pérdidas default del sistema (en %, se combinan multiplicativamente). */
  sombraPct: number;
  soilingPct: number;
  mismatchPct: number;
  dcWiringPct: number;
  acPct: number;
  /** Curva de pérdida por clipping en función del load ratio DC/AC. */
  clippingCurve: ClippingPoint[];
  /** Tarifa de inyección de excedentes (USD/kWh, 0 = sin net metering). */
  tarifaInyeccion: number;
  /** Fracción del consumo anual que se busca cubrir (1 = 100%). */
  autoconsumoObjetivo: number;
  /** kg de CO₂ evitado por kWh producido. */
  co2KgKwh: number;
  /** Validez de la cotización en días (para el PDF). */
  validezDiasCotizacion: number;
  /** Ingeniería y trámites: componente fija + % sobre el costo de materiales. */
  ingenieriaFijaUsd: number;
  ingenieriaPct: number;
  /** Degradación anual del panel (fracción, ej. 0.005). */
  degradacionAnual: number;
  /** % default del consumo en horario diurno (fracción). */
  pctDiurnoDefault: number;
  /** Texto de supuestos y exclusiones para el PDF. */
  supuestosTexto: string;
  /** Escalación real anual de tarifas (fracción, ej. 0.05 = 5%/año). Default 0. */
  escalacionTarifaReal: number;
  /** Temperatura mínima de diseño para Voc frío (°C). Default nacional: -10. */
  tminDisenoC: number;
  /** mountingplace PVGIS por tipo de techo. */
  mountingInclinado: "building" | "free";
  mountingPlano: "building" | "free";
  mountingSerrucho: "building" | "free";
  /** Referencia de vigencia de tarifas (informativo en reporte). */
  tarifasFechaFuente: string;
}

export interface Catalog {
  paneles: Panel[];
  inversores: Inversor[];
  estructuras: Estructura[];
  materiales: Material[];
  manoDeObra: RangoManoDeObra[];
  parametros: Parametros;
  /** true si el último refetch falló y se está sirviendo cache viejo. */
  stale: boolean;
  source: "sheets" | "mock";
  fetchedAt: string;
}

// ── Input del wizard ─────────────────────────────────────────────────────────

export interface ClienteInput {
  razonSocial: string;
  contacto: string;
  /** @deprecated Legacy; sincronizado con representante comercial. */
  email: string;
  representanteModo: "alvaro" | "otro";
  representanteOtro: string;
  direccion: string;
  lat: number;
  lon: number;
}

export interface TechoInput {
  /** Áreas brutas de cada polígono dibujado (m²). */
  areasM2: number[];
  /** Potencia objetivo del proyecto (kWp), ingresada manualmente en el wizard. */
  kwpDeseado: number | null;
  tipoTecho: TipoTecho;
  /** Packing: fracción del área bruta con módulos (default según tipo de techo). */
  factorAprovechamiento: number;
  /** % de sombra del sitio declarado por el vendedor (null = default de Parametros). */
  sombraPct: number | null;
  /** Azimut en grados desde el norte (0-360). Solo inclinado/serrucho. */
  azimutDeg: number | null;
  /** Inclinación del techo en grados. Solo inclinado/serrucho. */
  inclinacionDeg: number | null;
  /** Distancia de los paneles al tablero (m). Opcional. */
  distanciaTableroM: number | null;
  /** Snapshot del mapa (data URL) para el PDF. */
  snapshotDataUrl: string | null;
}

export interface ConsumoInput {
  /** Consumo mensual en kWh, siempre 12 valores (si cargó promedio, repetido). */
  mensualKwh: number[];
  /** Tarifa media en USD/kWh. */
  tarifaUsdKwh: number;
  /** Fracción del consumo en horario diurno (0-1). */
  pctDiurno: number;
  /** Tarifa de inyección USD/kWh (null = default del catálogo). */
  tarifaInyeccionUsdKwh?: number | null;
}

export interface QuoteAjustes {
  /** Modelo de panel forzado (default: el más barato por Wp activo). */
  panelModelo: string | null;
  /** Modelo de inversor forzado (anula la selección automática). */
  inversorModelo: string | null;
  margenPct: number | null;
  descuentoPct: number;
  /** Overrides de líneas del BOM: key = id de línea. */
  lineasOverride: Record<string, { cantidad?: number; unitarioUsd?: number }>;
  /** Líneas agregadas a mano. */
  lineasManuales: BomLinea[];
  /** true = el PDF muestra el detalle del BOM; false = precio cerrado. */
  mostrarDetalle: boolean;
}

export interface QuoteInput {
  cliente: ClienteInput;
  techo: TechoInput;
  consumo: ConsumoInput;
  ajustes: QuoteAjustes;
}

// ── PVGIS ────────────────────────────────────────────────────────────────────

/** Pérdidas que PVGIS modela internamente (% negativos, ej. -4.7). */
export interface PvgisInternalLosses {
  /** Reflexión (angle of incidence). */
  lAoiPct: number | null;
  /** Espectral (puede venir como "?(0)" en SARAH → null). */
  lSpecPct: number | null;
  /** Temperatura + baja irradiancia. */
  lTgPct: number | null;
  /** Total PVGIS (incluye el parámetro loss enviado). */
  lTotalPct: number | null;
}

export interface PvgisResult {
  /** Rendimiento específico anual (kWh por kWp por año). */
  yieldKwhPerKwpYear: number;
  /** Producción mensual por kWp instalado (12 valores, kWh/kWp). */
  monthlyKwhPerKwp: number[];
  /** Irradiación anual sobre el plano (kWh/m²·año), si está disponible. */
  irradiationKwhM2Year: number | null;
  /** Irradiación mensual sobre el plano H(i)_m (kWh/m², 12 valores). */
  monthlyIrradiationKwhM2: number[] | null;
  /** Ángulo e "aspect" efectivamente usados (convención PVGIS). */
  angleDeg: number | null;
  aspectDeg: number | null;
  /** true si PVGIS los optimizó (techo plano con optimalangles=1). */
  angleOptimal: boolean;
  aspectOptimal: boolean;
  /** Pérdidas internas modeladas por PVGIS. */
  internalLosses: PvgisInternalLosses;
  /** Base de radiación usada por PVGIS (ej. PVGIS-ERA5). */
  radiationDb: string | null;
  /** Origen del dato cuando source === fallback. */
  fallbackOrigin?: "generic" | "project_cache";
  source: "pvgis" | "fallback";
}

/** Irradiación global horizontal (MRcalc, promedio multianual). */
export interface GhiResult {
  /** GHI mensual (kWh/m², 12 valores). */
  monthlyGhiKwhM2: number[];
  /** GHI anual (kWh/m²·año). */
  annualGhiKwhM2: number;
  source: "pvgis" | "fallback";
}

// ── Resultado del motor ──────────────────────────────────────────────────────

export interface SizingResult {
  areaBrutaM2: number;
  areaUtilM2: number;
  kwpMaxTecho: number;
  kwpObjetivo: number;
  kwpSistema: number;
  nPaneles: number;
  panel: Panel;
  /** Qué limitó el sistema. */
  limitadoPor: "techo" | "consumo" | "potencia";
}

export interface BomLinea {
  id: string;
  item: string;
  detalle: string;
  cantidad: number;
  unidad: string;
  unitarioUsd: number;
  subtotalUsd: number;
  /** true si la línea fue editada o agregada a mano. */
  manual?: boolean;
}

export interface BomResult {
  lineas: BomLinea[];
  inversores: { inversor: Inversor; cantidad: number }[];
  kwAcTotal: number;
  ratioDcAc: number;
  costoUsd: number;
  margenPct: number;
  descuentoPct: number;
  capexUsd: number;
}

export interface EconomicsAnual {
  ano: number;
  produccionKwh: number;
  autoconsumoKwh: number;
  excedenteKwh: number;
  ahorroUsd: number;
  opexUsd: number;
  flujoNetoUsd: number;
  flujoAcumuladoUsd: number;
}

export interface EconomicsResult {
  produccionAnualKwh: number;
  consumoAnualKwh: number;
  autoconsumoAnualKwh: number;
  ahorroAnualUsd: number;
  opexAnualUsd: number;
  paybackAnos: number | null;
  vanUsd: number;
  tirPct: number | null;
  co2EvitadoTonAno: number;
  proyeccion: EconomicsAnual[];
  /** Producción mensual del año 1 (kWh). */
  produccionMensualKwh: number[];
  consumoMensualKwh: number[];
}

/** Desglose de pérdidas del sistema (todas fracciones, ej. 0.03 = 3%). */
export interface SystemLosses {
  sombra: number;
  soiling: number;
  mismatch: number;
  dcWiring: number;
  clipping: number;
  inversor: number;
  ac: number;
  /** Total multiplicativo: 1 − Π(1 − li). */
  total: number;
}

/** Resultado del string sizing (módulos en serie por string). */
export interface StringSizingResult {
  nStrings: number;
  modulesPerString: number;
  /** Voc del string con margen de frío (V): Voc × N × 1.15. */
  vocStringFrioV: number;
  /** false si el último string queda más corto (nPaneles no divisible). */
  exacto: boolean;
  /** Temperatura mínima de diseño usada para Voc frío (°C). */
  tminDisenoC?: number;
}

export interface QuoteWarning {
  code:
    | "pvgis_fallback"
    | "precios_stale"
    | "limitado_por_techo"
    | "limitado_por_consumo"
    | "sin_distancia_tablero"
    | "sin_inversor"
    | "load_ratio_fuera_rango"
    | "strings_no_cierran"
    | "potencia_manual"
    | "supera_techo"
    | "techo_justo"
    | "specs_estimadas";
  message: string;
}

export interface QuoteResult {
  sizing: SizingResult;
  bom: BomResult;
  economics: EconomicsResult;
  pvgis: PvgisResult;
  losses: SystemLosses;
  strings: StringSizingResult | null;
  warnings: QuoteWarning[];
}

// ── Reporte de Producción ────────────────────────────────────────────────────

export interface ProductionMetrics {
  kwpDc: number;
  kwAcTotal: number;
  loadRatio: number;
  energiaAnualMwh: number;
  /** Rendimiento específico: E_y / kWp DC. */
  kwhPorKwp: number;
  /** Performance ratio: E_y / (H(i)_y × kWp DC), en %. */
  prPct: number | null;
  fuenteClimatica: string;
}

export interface MonthlyProductionRow {
  /** 1-12. */
  mes: number;
  ghiKwhM2: number | null;
  /** Irradiación sobre el plano H(i)_m. */
  poaKwhM2: number | null;
  /** Producción ideal sin pérdidas: H(i)_m × kWp. */
  nameplateKwh: number | null;
  /** Energía entregada a red E_m. */
  energiaRedKwh: number;
}

export interface WaterfallRow {
  etapa: string;
  /** Energía anual (kWh) después de esta etapa. */
  energiaKwh: number;
  /** Delta % respecto de la etapa anterior (negativo; 0 en la primera fila). */
  deltaPct: number;
}

export interface LossDonutSlice {
  etiqueta: string;
  /** Pérdida en % (positivo). */
  pct: number;
}

export interface TechBomRow {
  item: string;
  detalle: string;
  cantidad: string;
}

export interface SupuestoRow {
  nombre: string;
  valor: string;
}

export interface FieldSegment {
  tiltDeg: number | null;
  /** Azimut convención UI (desde el norte) o null si lo optimizó PVGIS. */
  azimutDeg: number | null;
  /** true si tilt/azimut fueron optimizados por PVGIS (techo plano). */
  optimizadoPvgis: boolean;
  nPaneles: number;
  packing: number;
  areaBrutaM2: number;
  tipoTecho: TipoTecho;
}

export interface ProductionReportData {
  proyecto: {
    nombre: string;
    direccion: string;
    fecha: string;
    lat: number;
    lon: number;
  };
  metrics: ProductionMetrics;
  tablaMensual: MonthlyProductionRow[];
  cascada: WaterfallRow[];
  dona: LossDonutSlice[];
  bomTecnico: TechBomRow[];
  fieldSegment: FieldSegment;
  supuestos: SupuestoRow[];
  /** Producción mensual a red (kWh), para el gráfico de barras. */
  produccionMensualKwh: number[];
  /** Consumo mensual (kWh) si fue cargado, para superponer en el gráfico. */
  consumoMensualKwh: number[] | null;
  warnings: QuoteWarning[];
}

// ── Proyectos persistidos (borradores del wizard) ────────────────────────────

/** Polígono dibujado sobre el mapa satelital. */
export interface Poligono {
  id: string;
  points: [number, number][];
  areaM2: number;
}

/** Consumo extendido del wizard (UI + motor). */
export interface CotizadorProjectConsumo {
  habilitado: boolean;
  modo: "promedio" | "doce";
  promedioKwh: number;
  mensualKwh: number[];
  tarifaModo: "directa" | "factura";
  /** Nivel tarifario AR (T1/T2/T3) para preset de USD/kWh. */
  tarifaNivel: "T1" | "T2" | "T3";
  tarifaUsdKwh: number;
  facturaMensualUsd: number;
  pctDiurno: number;
  /** Preset de consumo seleccionado (null = personalizado). */
  consumoPreset: "pequeno" | "mediano" | "grande" | null;
  /** Tarifa de inyección USD/kWh (null = default del catálogo). */
  tarifaInyeccionUsdKwh: number | null;
}

export interface CotizadorProjectSummary {
  id: string;
  proyectoNombre: string;
  clienteRazonSocial: string;
  direccion: string;
  kwp?: number;
  mwh?: number;
  vendedor?: string;
  updatedAt: string;
  createdAt: string;
}

export interface CotizadorProjectDraft {
  id: string;
  step: number;
  proyectoNombre: string;
  cliente: ClienteInput;
  techo: Omit<TechoInput, "areasM2" | "snapshotDataUrl">;
  poligonos: Poligono[];
  consumo: CotizadorProjectConsumo;
  ajustes: QuoteAjustes;
  snapshotUrl?: string | null;
  vendedor?: string;
  /** 2 = wizard con paso Equipos (5 pasos). Ausente o 1 = flujo anterior (reporte en paso 4). */
  flowVersion?: number;
  /** Última respuesta PVGIS exitosa del proyecto (cache offline). */
  pvgisSnapshot?: PvgisResult | null;
  createdAt: string;
  updatedAt: string;
}
