import { describe, expect, it } from "vitest";
import { getMockCatalog } from "../pricing/mock";
import type { GhiResult, PvgisResult, QuoteInput } from "../types";
import { quote } from "./index";
import { deriveProductionReport, pvgisAspectToUiAzimuth } from "./production";

/**
 * Caso TOOLSMANIA (Av. La Voz del Interior 6608, Córdoba):
 * ~29.5 kWp en techo plano con estructura lastrada 15° al norte.
 * PVGIS SARAH3 real (2026-06): H(i)_y≈2004, l_tg≈−11.4 → ~45.5 MWh, PR ~77%.
 * Helioscope reportó 51.2 MWh (incluye supuestos distintos / posible bifacial).
 */

// Perfil mensual POA Córdoba 15° norte (PVGIS, fracción del anual).
const SHAPE = [0.104, 0.085, 0.085, 0.069, 0.061, 0.059, 0.065, 0.082, 0.089, 0.095, 0.101, 0.107];

const H_POA_ANUAL = 2004;
const L_AOI = -2.85;
const L_TG = -11.39;

/** PVGIS sintético consistente: E_y = nameplate × internas × (1 − loss usuario). */
function toolsmaniaPvgis(kwp: number, userLossTotal: number): PvgisResult {
  const yieldYear =
    H_POA_ANUAL * (1 + L_AOI / 100) * (1 + L_TG / 100) * (1 - userLossTotal);
  return {
    yieldKwhPerKwpYear: yieldYear,
    monthlyKwhPerKwp: SHAPE.map((f) => f * yieldYear),
    irradiationKwhM2Year: H_POA_ANUAL,
    monthlyIrradiationKwhM2: SHAPE.map((f) => f * H_POA_ANUAL),
    angleDeg: 15,
    aspectDeg: -180,
    angleOptimal: false,
    aspectOptimal: false,
    internalLosses: { lAoiPct: L_AOI, lSpecPct: null, lTgPct: L_TG, lTotalPct: null },
    radiationDb: "PVGIS-ERA5",
    source: "pvgis",
  };
}

const GHI_CORDOBA: GhiResult = {
  monthlyGhiKwhM2: SHAPE.map((f) => f * 1830),
  annualGhiKwhM2: 1830,
  source: "pvgis",
};

function toolsmaniaInput(): QuoteInput {
  return {
    cliente: {
      razonSocial: "TOOLSMANIA",
      contacto: "Compras",
      email: "Alvaro",
      representanteModo: "alvaro",
      representanteOtro: "",
      direccion: "Av. La Voz del Interior 6608, Córdoba",
      lat: -31.32,
      lon: -64.21,
    },
    techo: {
      areasM2: [260],
      kwpDeseado: 29.5,
      tipoTecho: "plano",
      factorAprovechamiento: 0.5,
      sombraPct: null,
      azimutDeg: null,
      inclinacionDeg: null,
      distanciaTableroM: 15,
      snapshotDataUrl: null,
    },
    // Sin datos de consumo: reporte de producción puro.
    consumo: { mensualKwh: Array(12).fill(0), tarifaUsdKwh: 0, pctDiurno: 0.7 },
    ajustes: {
      panelModelo: null,
      inversorModelo: null,
      margenPct: null,
      descuentoPct: 0,
      lineasOverride: {},
      lineasManuales: [],
      mostrarDetalle: true,
    },
  };
}

describe("caso TOOLSMANIA (reporte de producción)", () => {
  const catalog = getMockCatalog();
  const input = toolsmaniaInput();

  // Dos pasadas como hace la ruta: primero estimar kwp/losses, después PVGIS.
  const draft = quote(input, catalog, toolsmaniaPvgis(29.5, 0.107));
  const pvgis = toolsmaniaPvgis(draft.sizing.kwpSistema, draft.losses.total);
  const result = quote(input, catalog, pvgis);
  const report = deriveProductionReport({
    proyectoNombre: "TOOLSMANIA",
    input,
    result,
    ghi: GHI_CORDOBA,
    catalog,
  });

  it("dimensiona ~29.5 kWp por potencia indicada", () => {
    expect(result.sizing.kwpSistema).toBeGreaterThan(28);
    expect(result.sizing.kwpSistema).toBeLessThan(31);
    expect(result.sizing.limitadoPor).toBe("potencia");
  });

  it("energía anual ~45.5 MWh (PVGIS 15° norte, loss ~10.7%)", () => {
    expect(report.metrics.energiaAnualMwh).toBeGreaterThan(45.5 * 0.92);
    expect(report.metrics.energiaAnualMwh).toBeLessThan(45.5 * 1.08);
  });

  it("PR entre 74 y 80% (PVGIS SARAH3 real)", () => {
    expect(report.metrics.prPct).not.toBeNull();
    expect(report.metrics.prPct!).toBeGreaterThan(74);
    expect(report.metrics.prPct!).toBeLessThan(80);
  });

  it("kWh/kWp entre 1480 y 1600", () => {
    expect(report.metrics.kwhPorKwp).toBeGreaterThan(1480);
    expect(report.metrics.kwhPorKwp).toBeLessThan(1600);
  });

  it("la cascada cierra contra E_y de PVGIS", () => {
    const ultima = report.cascada[report.cascada.length - 1];
    expect(ultima.etapa).toBe("Energía a red");
    const eY = pvgis.yieldKwhPerKwpYear * result.sizing.kwpSistema;
    expect(ultima.energiaKwh).toBeCloseTo(eY, -1);
    // La fila AC (ajuste de cierre) no se aleja más de 0.5% del parámetro.
    const filaAc = report.cascada.find((r) => r.etapa === "Cableado AC");
    expect(filaAc).toBeDefined();
    expect(Math.abs(-filaAc!.deltaPct / 100 - result.losses.ac)).toBeLessThan(0.005);
  });

  it("nameplate mensual consistente con POA × kWp", () => {
    for (const row of report.tablaMensual) {
      expect(row.nameplateKwh).not.toBeNull();
      expect(row.nameplateKwh!).toBeCloseTo(
        row.poaKwhM2! * result.sizing.kwpSistema,
        -1
      );
      expect(row.energiaRedKwh).toBeLessThan(row.nameplateKwh!);
    }
    const sumaRed = report.tablaMensual.reduce((a, r) => a + r.energiaRedKwh, 0);
    expect(sumaRed / 1000).toBeCloseTo(report.metrics.energiaAnualMwh, 0);
  });

  it("la dona usa las mismas pérdidas que la cascada", () => {
    const etapasCascada = report.cascada.filter((r) => r.deltaPct < 0);
    expect(report.dona).toHaveLength(etapasCascada.length);
    for (let i = 0; i < report.dona.length; i++) {
      expect(report.dona[i].pct).toBeCloseTo(-etapasCascada[i].deltaPct, 5);
    }
  });

  it("BOM técnico sin precios con paneles, inversor, estructura y strings", () => {
    const items = report.bomTecnico.map((r) => r.item);
    expect(items).toContain("Paneles");
    expect(items).toContain("Inversor");
    expect(items).toContain("Estructura");
    expect(items).toContain("Strings");
    // 29.5 kWp → 1× GoodWe 25 kW (load ratio ~1.18)
    const inversor = report.bomTecnico.find((r) => r.item === "Inversor");
    expect(inversor!.detalle).toContain("25");
  });

  it("field segment con estructura lastrada 15° al norte", () => {
    expect(report.fieldSegment.optimizadoPvgis).toBe(false);
    expect(report.fieldSegment.tiltDeg).toBe(15);
    expect(report.fieldSegment.azimutDeg).toBe(0);
  });

  it("supuestos incluyen las pérdidas y la fuente climática", () => {
    const nombres = report.supuestos.map((s) => s.nombre);
    expect(nombres).toContain("Fuente climática");
    expect(nombres).toContain("Sombra del sitio");
    expect(nombres).toContain("Pérdidas totales parametrizadas");
    expect(
      report.supuestos.find((s) => s.nombre === "Fuente climática")!.valor
    ).toBe("PVGIS-ERA5");
  });

  it("sin consumo cargado no hay serie de consumo en el gráfico", () => {
    expect(report.consumoMensualKwh).toBeNull();
    expect(report.produccionMensualKwh).toHaveLength(12);
  });
});

describe("pvgisAspectToUiAzimuth", () => {
  it("convierte aspect PVGIS a azimut UI", () => {
    expect(pvgisAspectToUiAzimuth(-180)).toBe(0); // norte
    expect(pvgisAspectToUiAzimuth(180)).toBe(0);
    expect(pvgisAspectToUiAzimuth(0)).toBe(180); // sur
    expect(pvgisAspectToUiAzimuth(-90)).toBe(90); // este
    expect(pvgisAspectToUiAzimuth(90)).toBe(270); // oeste
  });
});
