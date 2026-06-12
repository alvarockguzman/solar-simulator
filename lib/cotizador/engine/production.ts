import type {
  Catalog,
  GhiResult,
  LossDonutSlice,
  MonthlyProductionRow,
  ProductionReportData,
  QuoteInput,
  QuoteResult,
  SupuestoRow,
  TechBomRow,
  WaterfallRow,
} from "../types";

/**
 * Deriva los datos exactos del Reporte de Producción a partir de
 * (pvgis + ghi + sizing + losses). Una sola fuente de verdad: la cascada y la
 * dona usan las mismas pérdidas, y la cascada cierra contra E_y de PVGIS.
 */

export interface ProductionReportArgs {
  proyectoNombre: string;
  input: QuoteInput;
  result: QuoteResult;
  ghi: GhiResult;
  catalog: Catalog;
}

/** Convierte aspect de PVGIS (0 = sur) a azimut UI (0 = norte, horario). */
export function pvgisAspectToUiAzimuth(aspectDeg: number): number {
  let az = (aspectDeg + 180) % 360;
  if (az < 0) az += 360;
  return az;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function deriveProductionReport(args: ProductionReportArgs): ProductionReportData {
  const { proyectoNombre, input, result, ghi, catalog } = args;
  const { sizing, bom, losses, strings, pvgis, economics, warnings } = result;

  const kwpDc = sizing.kwpSistema;
  const energiaAnualKwh = pvgis.yieldKwhPerKwpYear * kwpDc;
  const poaAnual = pvgis.irradiationKwhM2Year;

  // ── Métricas ────────────────────────────────────────────────────────────
  const metrics = {
    kwpDc: Math.round(kwpDc * 100) / 100,
    kwAcTotal: bom.kwAcTotal,
    loadRatio: bom.ratioDcAc,
    energiaAnualMwh: Math.round(energiaAnualKwh / 100) / 10,
    kwhPorKwp: Math.round(pvgis.yieldKwhPerKwpYear),
    prPct:
      poaAnual && poaAnual > 0
        ? round1((energiaAnualKwh / (poaAnual * kwpDc)) * 100)
        : null,
    fuenteClimatica:
      pvgis.source === "pvgis"
        ? pvgis.radiationDb ?? "PVGIS"
        : pvgis.fallbackOrigin === "project_cache"
          ? `cache (${pvgis.radiationDb ?? "PVGIS"})`
          : "estimado",
  };

  // ── Tabla mensual ───────────────────────────────────────────────────────
  const tablaMensual: MonthlyProductionRow[] = Array.from({ length: 12 }, (_, i) => {
    const poa = pvgis.monthlyIrradiationKwhM2?.[i] ?? null;
    return {
      mes: i + 1,
      ghiKwhM2: ghi.monthlyGhiKwhM2[i] !== undefined ? round1(ghi.monthlyGhiKwhM2[i]) : null,
      poaKwhM2: poa !== null ? round1(poa) : null,
      nameplateKwh: poa !== null ? Math.round(poa * kwpDc) : null,
      energiaRedKwh: Math.round(pvgis.monthlyKwhPerKwp[i] * kwpDc),
    };
  });

  // ── Cascada de pérdidas (cierra contra E_y) ─────────────────────────────
  // Nameplate → pérdidas internas PVGIS (reflexión, espectral, temp+irradiancia)
  // → pérdidas parametrizadas nuestras → energía a red. La fila AC absorbe el
  // residuo de redondeo (típicamente <0.5%) para cuadrar exacto con E_y.
  const cascada: WaterfallRow[] = [];
  const nameplate = poaAnual !== null ? poaAnual * kwpDc : energiaAnualKwh / (1 - losses.total);
  let energia = nameplate;
  cascada.push({ etapa: "Nameplate (DC ideal)", energiaKwh: Math.round(energia), deltaPct: 0 });

  const pushEtapa = (etapa: string, lossFrac: number) => {
    if (lossFrac === 0) return;
    const nueva = energia * (1 - lossFrac);
    cascada.push({
      etapa,
      energiaKwh: Math.round(nueva),
      deltaPct: round1(-lossFrac * 100),
    });
    energia = nueva;
  };

  const il = pvgis.internalLosses;
  if (il.lAoiPct !== null) pushEtapa("Reflexión (AOI)", -il.lAoiPct / 100);
  if (il.lSpecPct !== null) pushEtapa("Espectral", -il.lSpecPct / 100);
  if (il.lTgPct !== null) pushEtapa("Temperatura e irradiancia", -il.lTgPct / 100);
  pushEtapa("Sombra del sitio", losses.sombra);
  pushEtapa("Soiling (suciedad)", losses.soiling);
  pushEtapa("Mismatch", losses.mismatch);
  pushEtapa("Cableado DC", losses.dcWiring);
  pushEtapa("Clipping del inversor", losses.clipping);
  pushEtapa("Conversión del inversor", losses.inversor);
  // La etapa AC cierra contra E_y absorbiendo el residuo de redondeo.
  const acImplied = energia > 0 ? 1 - energiaAnualKwh / energia : 0;
  pushEtapa("Cableado AC", acImplied);
  cascada.push({
    etapa: "Energía a red",
    energiaKwh: Math.round(energiaAnualKwh),
    deltaPct: 0,
  });

  // ── Dona de pérdidas (misma fuente que la cascada) ──────────────────────
  const dona: LossDonutSlice[] = cascada
    .filter((r) => r.deltaPct < 0)
    .map((r) => ({ etiqueta: r.etapa, pct: round1(-r.deltaPct) }));

  // ── BOM técnico sin precios ─────────────────────────────────────────────
  const estructura = catalog.estructuras.find((e) => e.tipoTecho === input.techo.tipoTecho);
  const bomTecnico: TechBomRow[] = [
    {
      item: "Paneles",
      detalle: `${sizing.panel.marca} ${sizing.panel.modelo} (${sizing.panel.wp} Wp${sizing.panel.bifacial ? ", bifacial" : ""})`,
      cantidad: `${sizing.nPaneles} u`,
    },
    ...bom.inversores.map((c) => ({
      item: "Inversor",
      detalle: `${c.inversor.marca} ${c.inversor.modelo} (${c.inversor.kwAc} kW AC, ${c.inversor.mpptCount} MPPT)`,
      cantidad: `${c.cantidad} u`,
    })),
    {
      item: "Estructura",
      detalle: estructura?.descripcion ?? `Estructura para techo ${input.techo.tipoTecho}`,
      cantidad: `${sizing.nPaneles} u`,
    },
  ];
  if (strings) {
    const tmin = strings.tminDisenoC ?? catalog.parametros.tminDisenoC;
    bomTecnico.push({
      item: "Strings",
      detalle: `${strings.modulesPerString} módulos en serie (Voc frío a ${tmin}°C: ${strings.vocStringFrioV} V)${strings.exacto ? "" : ", último string más corto"}`,
      cantidad: `${strings.nStrings} strings`,
    });
  }

  // ── Field segment ───────────────────────────────────────────────────────
  const optimizadoPvgis = pvgis.angleOptimal || pvgis.aspectOptimal;
  const azimutSitio =
    input.techo.azimutDeg ??
    (input.techo.tipoTecho === "plano" ? 0 : null);
  const fieldSegment = {
    tiltDeg: pvgis.angleDeg,
    azimutDeg: optimizadoPvgis
      ? pvgis.aspectDeg !== null
        ? pvgisAspectToUiAzimuth(pvgis.aspectDeg)
        : null
      : azimutSitio,
    optimizadoPvgis,
    nPaneles: sizing.nPaneles,
    packing: input.techo.factorAprovechamiento,
    areaBrutaM2: Math.round(sizing.areaBrutaM2),
    tipoTecho: input.techo.tipoTecho,
  };

  // ── Supuestos ───────────────────────────────────────────────────────────
  const pct = (f: number) => `${round1(f * 100)}%`;
  const supuestos: SupuestoRow[] = [
    { nombre: "Fuente climática", valor: metrics.fuenteClimatica },
    { nombre: "Sombra del sitio", valor: pct(losses.sombra) },
    { nombre: "Soiling", valor: pct(losses.soiling) },
    { nombre: "Mismatch", valor: pct(losses.mismatch) },
    { nombre: "Cableado DC", valor: pct(losses.dcWiring) },
    { nombre: "Clipping", valor: pct(losses.clipping) },
    { nombre: "Eficiencia del inversor", valor: pct(1 - losses.inversor) },
    { nombre: "Cableado AC", valor: pct(losses.ac) },
    { nombre: "Pérdidas totales parametrizadas", valor: pct(losses.total) },
    {
      nombre: "Packing (área módulos / área techo)",
      valor: pct(input.techo.factorAprovechamiento),
    },
    {
      nombre: "Load ratio DC/AC",
      valor: bom.ratioDcAc ? bom.ratioDcAc.toFixed(2) : "—",
    },
    {
      nombre: "Degradación anual",
      valor: pct(catalog.parametros.degradacionAnual),
    },
  ];
  if (catalog.parametros.tarifasFechaFuente.trim()) {
    supuestos.unshift({
      nombre: "Vigencia tarifas",
      valor: catalog.parametros.tarifasFechaFuente,
    });
  }
  if (il.lTgPct !== null) {
    supuestos.push({
      nombre: "Temperatura e irradiancia (PVGIS)",
      valor: `${round1(-il.lTgPct)}%`,
    });
  }

  const tieneConsumo = input.consumo.mensualKwh.some((v) => v > 0);

  return {
    proyecto: {
      nombre: proyectoNombre || input.cliente.razonSocial,
      direccion: input.cliente.direccion,
      fecha: new Date().toISOString().slice(0, 10),
      lat: input.cliente.lat,
      lon: input.cliente.lon,
    },
    metrics,
    tablaMensual,
    cascada,
    dona,
    bomTecnico,
    fieldSegment,
    supuestos,
    produccionMensualKwh: economics.produccionMensualKwh,
    consumoMensualKwh: tieneConsumo ? input.consumo.mensualKwh : null,
    warnings,
  };
}
