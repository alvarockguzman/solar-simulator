import { describe, expect, it } from "vitest";
import { getMockCatalog } from "../pricing/mock";
import type { PvgisResult, QuoteAjustes, QuoteInput } from "../types";
import {
  clippingLoss,
  pickPanel,
  quote,
  selectInverter,
  stringSizing,
  systemLosses,
  vocColdFactor,
} from "./index";

/**
 * Caso de referencia (mismo techo del Tipo A de economics.csv: ~1467 m²
 * brutos, consumo 350.000 kWh/año, tarifa 0.117, yield 1459), recalibrado
 * para el catálogo G2E + modelo de packing (R1):
 * - packing plano 0.50 → área útil 733 m² → 271 paneles Trina 615 ≈ 166.7 kWp
 * - precios G2E más bajos que el mock original → ~630 USD/kWp y payback ~4.0
 * (el original de Helioscope era 150 kWp / 750 USD/kWp / 4.7 años; la
 * validación externa de la etapa pasa a ser el caso TOOLSMANIA).
 */

const PACKING_PLANO = 0.5;

function flatPvgis(yieldYear: number): PvgisResult {
  return {
    yieldKwhPerKwpYear: yieldYear,
    monthlyKwhPerKwp: Array(12).fill(yieldYear / 12),
    irradiationKwhM2Year: null,
    monthlyIrradiationKwhM2: null,
    angleDeg: 35,
    aspectDeg: 180,
    angleOptimal: false,
    aspectOptimal: false,
    internalLosses: { lAoiPct: null, lSpecPct: null, lTgPct: null, lTotalPct: null },
    radiationDb: null,
    source: "pvgis",
  };
}

function defaultAjustes(): QuoteAjustes {
  return {
    panelModelo: null,
    inversorModelo: null,
    margenPct: null,
    descuentoPct: 0,
    lineasOverride: {},
    lineasManuales: [],
    mostrarDetalle: true,
  };
}

function buildInput(overrides?: {
  areasM2?: number[];
  consumoAnual?: number;
  distanciaTableroM?: number | null;
}): QuoteInput {
  const consumoAnual = overrides?.consumoAnual ?? 350_000;
  return {
    cliente: {
      razonSocial: "Industria Test SA",
      contacto: "Juan Pérez",
      email: "Alvaro",
      representanteModo: "alvaro",
      representanteOtro: "",
      direccion: "Córdoba, Argentina",
      lat: -31.4,
      lon: -64.2,
    },
    techo: {
      // Mismo techo del caso Tipo A: ~1466.7 m² brutos
      areasM2: overrides?.areasM2 ?? [1466.7],
      kwpDeseado: null,
      tipoTecho: "plano",
      factorAprovechamiento: PACKING_PLANO,
      sombraPct: null,
      azimutDeg: null,
      inclinacionDeg: null,
      distanciaTableroM: overrides?.distanciaTableroM ?? null,
      snapshotDataUrl: null,
    },
    consumo: {
      mensualKwh: Array(12).fill(consumoAnual / 12),
      tarifaUsdKwh: 0.117,
      pctDiurno: 0.7,
    },
    ajustes: defaultAjustes(),
  };
}

describe("caso de referencia (techo Tipo A, catálogo G2E + packing)", () => {
  const catalog = getMockCatalog();
  const result = quote(buildInput(), catalog, flatPvgis(1459));

  it("dimensiona ~196 kWp limitado por techo con panel automático Jinko 725", () => {
    expect(result.sizing.kwpSistema).toBeGreaterThan(190);
    expect(result.sizing.kwpSistema).toBeLessThan(205);
    expect(result.sizing.limitadoPor).toBe("techo");
    expect(result.sizing.areaUtilM2).toBeCloseTo(1466.7 * PACKING_PLANO, 0);
    expect(result.sizing.panel.modelo).toContain("725");
  });

  it("capex por kWp razonable para el catálogo G2E (570-700 USD/kWp)", () => {
    const usdPorKwp = result.bom.capexUsd / result.sizing.kwpSistema;
    expect(usdPorKwp).toBeGreaterThan(570);
    expect(usdPorKwp).toBeLessThan(700);
  });

  it("payback ~4 años (3.5-4.5)", () => {
    expect(result.economics.paybackAnos).not.toBeNull();
    expect(result.economics.paybackAnos!).toBeGreaterThan(3.5);
    expect(result.economics.paybackAnos!).toBeLessThan(4.5);
  });

  it("producción anual ≈ kWp × yield; autoconsumo limitado por consumo diurno", () => {
    const esperado = result.sizing.kwpSistema * 1459;
    expect(result.economics.produccionAnualKwh).toBeCloseTo(esperado, -3);
    const consumoDiurnoAnual = 350_000 * 0.7;
    expect(result.economics.autoconsumoAnualKwh).toBeCloseTo(consumoDiurnoAnual, 0);
    expect(result.economics.autoconsumoAnualKwh).toBeLessThan(
      result.economics.produccionAnualKwh
    );
  });

  it("inversores con load ratio DC/AC entre 1.10 y 1.30", () => {
    expect(result.bom.ratioDcAc).toBeGreaterThanOrEqual(1.1);
    expect(result.bom.ratioDcAc).toBeLessThanOrEqual(1.3);
    expect(result.bom.inversores.length).toBeGreaterThan(0);
    // N unidades del mismo modelo
    expect(result.bom.inversores).toHaveLength(1);
  });

  it("expone pérdidas y string sizing en el resultado", () => {
    expect(result.losses.total).toBeGreaterThan(0.1);
    expect(result.losses.total).toBeLessThan(0.11);
    expect(result.strings).not.toBeNull();
    expect(result.strings!.modulesPerString).toBeGreaterThanOrEqual(15);
    expect(result.strings!.modulesPerString).toBeLessThanOrEqual(22);
    expect(result.strings!.vocStringFrioV).toBeLessThan(
      result.bom.inversores[0].inversor.vdcMaxV
    );
  });

  it("VAN positivo y TIR mayor a la tasa de descuento", () => {
    expect(result.economics.vanUsd).toBeGreaterThan(0);
    expect(result.economics.tirPct).not.toBeNull();
    expect(result.economics.tirPct!).toBeGreaterThan(
      catalog.parametros.tasaDescuento * 100
    );
  });

  it("proyección a 25 años con degradación", () => {
    expect(result.economics.proyeccion).toHaveLength(25);
    const p1 = result.economics.proyeccion[0].produccionKwh;
    const p25 = result.economics.proyeccion[24].produccionKwh;
    expect(p25 / p1).toBeCloseTo(Math.pow(1 - catalog.parametros.degradacionAnual, 24), 2);
  });
});

describe("casos borde", () => {
  const catalog = getMockCatalog();

  it("techo chico limita el sistema", () => {
    const result = quote(
      buildInput({ areasM2: [100] }),
      catalog,
      flatPvgis(1459)
    );
    expect(result.sizing.limitadoPor).toBe("techo");
    expect(result.sizing.kwpSistema).toBeLessThan(15);
    expect(result.warnings.some((w) => w.code === "limitado_por_techo")).toBe(true);
  });

  it("consumo chico limita el sistema", () => {
    const result = quote(
      buildInput({ consumoAnual: 12_000 }),
      catalog,
      flatPvgis(1459)
    );
    expect(result.sizing.limitadoPor).toBe("consumo");
    expect(result.sizing.kwpSistema).toBeLessThan(10);
    expect(result.warnings.some((w) => w.code === "limitado_por_consumo")).toBe(true);
  });

  it("sin distancia al tablero usa rango de kWp y avisa", () => {
    const result = quote(
      buildInput({ distanciaTableroM: null }),
      catalog,
      flatPvgis(1459)
    );
    expect(result.warnings.some((w) => w.code === "sin_distancia_tablero")).toBe(true);
    const cableado = result.bom.lineas.find((l) => l.id === "cableado");
    expect(cableado?.unidad).toBe("gl");
  });

  it("con distancia al tablero cablea por metro", () => {
    const result = quote(
      buildInput({ distanciaTableroM: 40 }),
      catalog,
      flatPvgis(1459)
    );
    expect(result.warnings.some((w) => w.code === "sin_distancia_tablero")).toBe(false);
    const cableado = result.bom.lineas.find((l) => l.id === "cableado");
    expect(cableado?.unidad).toBe("m");
  });

  it("29.43 kWp → GoodWe 25 kW con load ratio ~1.18", () => {
    const sel = selectInverter(29.43, catalog.inversores);
    expect(sel).not.toBeNull();
    expect(sel!.combo).toHaveLength(1);
    expect(sel!.combo[0].cantidad).toBe(1);
    expect(sel!.combo[0].inversor.kwAc).toBe(25);
    expect(sel!.loadRatio).toBeCloseTo(1.18, 2);
    expect(sel!.enRango).toBe(true);
  });

  it("selección de inversor único para sistema chico", () => {
    // 11.5 kWp → 1× GoodWe 10 kW (ratio 1.15)
    const sel = selectInverter(11.5, catalog.inversores);
    expect(sel).not.toBeNull();
    expect(sel!.combo[0].cantidad).toBe(1);
    expect(sel!.combo[0].inversor.kwAc).toBe(10);
  });

  it("selección de N unidades iguales para sistema grande", () => {
    const sel = selectInverter(150, catalog.inversores);
    expect(sel).not.toBeNull();
    expect(sel!.enRango).toBe(true);
    expect(sel!.combo).toHaveLength(1);
    expect(sel!.combo[0].cantidad).toBeGreaterThan(1);
    expect(sel!.loadRatio).toBeGreaterThanOrEqual(1.1);
    expect(sel!.loadRatio).toBeLessThanOrEqual(1.3);
  });

  it("modelo de inversor forzado", () => {
    // 120 kWp → 2× GoodWe 50 kW (ratio 1.2)
    const sel = selectInverter(120, catalog.inversores, "GW50K-SDT AFCI");
    expect(sel).not.toBeNull();
    expect(sel!.combo[0].inversor.modelo).toBe("GW50K-SDT AFCI");
    expect(sel!.combo[0].cantidad).toBe(2);
    expect(sel!.enRango).toBe(true);
  });

  it("inversor forzado fuera de rango elige el más cercano y el quote avisa", () => {
    // 150 kWp con solo 50 kW: 2×50→1.5 y 3×50→1.0, nada en [1.10, 1.30]
    const sel = selectInverter(150, catalog.inversores, "GW50K-SDT AFCI");
    expect(sel).not.toBeNull();
    expect(sel!.enRango).toBe(false);
    // En el quote (~167 kWp), un SG333HX forzado queda con ratio ~0.5.
    const input = buildInput();
    input.ajustes.inversorModelo = "SG333HX 333kW";
    const result = quote(input, catalog, flatPvgis(1459));
    expect(result.warnings.some((w) => w.code === "load_ratio_fuera_rango")).toBe(true);
  });

  it("pérdidas default totalizan 10-11% y clipping(1.18) ≈ 0.2%", () => {
    const params = catalog.parametros;
    expect(clippingLoss(1.18, params.clippingCurve)).toBeCloseTo(0.0022, 3);
    expect(clippingLoss(1.0, params.clippingCurve)).toBe(0);
    expect(clippingLoss(2.0, params.clippingCurve)).toBe(0.015);
    const losses = systemLosses(params, {
      eficienciaEuroInversor: 0.98,
      loadRatio: 1.18,
    });
    expect(losses.total).toBeGreaterThan(0.1);
    expect(losses.total).toBeLessThan(0.11);
    // Total multiplicativo, no suma simple.
    const suma =
      losses.sombra + losses.soiling + losses.mismatch + losses.dcWiring +
      losses.clipping + losses.inversor + losses.ac;
    expect(losses.total).toBeLessThan(suma);
  });

  it("sombra del sitio overridea el default de parámetros", () => {
    const input = buildInput();
    input.techo.sombraPct = 8;
    const result = quote(input, catalog, flatPvgis(1459));
    expect(result.losses.sombra).toBeCloseTo(0.08, 5);
  });

  it("vocColdFactor a tmin -10 °C permite 19 módulos/string Trina 615 @ 1100 V", () => {
    const panel = { ...catalog.paneles[0], vocV: 51.8, betaVocPctC: -0.25 };
    const inversor = catalog.inversores.find((i) => i.vdcMaxV === 1100)!;
    const factor = vocColdFactor(panel, -10);
    expect(Math.floor(inversor.vdcMaxV / (panel.vocV * factor))).toBeGreaterThanOrEqual(19);
    const s = stringSizing(57, panel, inversor, -10);
    expect(s).not.toBeNull();
    expect(s!.modulesPerString).toBe(19);
    expect(s!.nStrings).toBe(3);
    expect(s!.exacto).toBe(true);
    expect(s!.vocStringFrioV).toBeLessThan(1100);
  });

  it("pickPanel elige el panel activo con menor USD/Wp (Jinko 725)", () => {
    const panel = pickPanel(catalog, null);
    expect(panel.modelo).toContain("725");
  });

  it("string sizing devuelve null si la tensión no cierra", () => {
    const panel = { ...catalog.paneles[0], vocV: 52 };
    const inversor = { ...catalog.inversores[0], vdcMaxV: 800 };
    // floor(800 / 59.8) = 13 < 15 módulos mínimos → no cierra
    expect(stringSizing(54, panel, inversor)).toBeNull();
  });

  it("PVGIS fallback genera warning", () => {
    const fallback: PvgisResult = {
      yieldKwhPerKwpYear: 1400,
      monthlyKwhPerKwp: Array(12).fill(1400 / 12),
      irradiationKwhM2Year: null,
      monthlyIrradiationKwhM2: null,
      angleDeg: null,
      aspectDeg: null,
      angleOptimal: false,
      aspectOptimal: false,
      internalLosses: { lAoiPct: null, lSpecPct: null, lTgPct: null, lTotalPct: null },
      radiationDb: null,
      fallbackOrigin: "generic",
      source: "fallback",
    };
    const result = quote(buildInput(), catalog, fallback);
    expect(result.warnings.some((w) => w.code === "pvgis_fallback")).toBe(true);
  });

  it("escalación tarifaria 0 no infla ahorros futuros respecto de tarifa constante", () => {
    const input = buildInput();
    const cat0 = {
      ...catalog,
      parametros: { ...catalog.parametros, escalacionTarifaReal: 0 },
    };
    const cat3 = {
      ...catalog,
      parametros: { ...catalog.parametros, escalacionTarifaReal: 0.03 },
    };
    const r0 = quote(input, cat0, flatPvgis(1459));
    const r3 = quote(input, cat3, flatPvgis(1459));
    expect(r0.economics.ahorroAnualUsd).toBe(r3.economics.ahorroAnualUsd);
    expect(r3.economics.proyeccion[24].ahorroUsd).toBeGreaterThan(
      r0.economics.proyeccion[24].ahorroUsd
    );
  });

  it("margen y descuento ajustan el capex", () => {
    const input = buildInput();
    input.ajustes.margenPct = 0.2;
    input.ajustes.descuentoPct = 0.05;
    const result = quote(input, catalog, flatPvgis(1459));
    const esperado = result.bom.costoUsd * 1.2 * 0.95;
    expect(result.bom.capexUsd).toBeCloseTo(esperado, 0);
  });
});
