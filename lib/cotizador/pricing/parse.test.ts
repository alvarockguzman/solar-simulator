import { describe, expect, it } from "vitest";
import {
  parseClippingCurve,
  parseInversores,
  parseManoDeObra,
  parseMateriales,
  parsePaneles,
  parseParametros,
  PARAMETROS_DEFAULT,
} from "./parse";

describe("parseo de pestañas del Sheet de precios", () => {
  it("parsea paneles y descarta los inactivos", () => {
    const rows = [
      ["marca", "modelo", "wp", "largo_m", "ancho_m", "precio_usd", "activo"],
      ["JA Solar", "JAM72S30-565", "565", "2.278", "1.134", "108", "TRUE"],
      ["Viejo", "Descontinuado-450", "450", "2.1", "1.05", "80", "FALSE"],
      ["", "", "", "", "", "", ""],
    ];
    const paneles = parsePaneles(rows);
    expect(paneles).toHaveLength(1);
    expect(paneles[0]).toMatchObject({
      marca: "JA Solar",
      wp: 565,
      largoM: 2.278,
      precioUsd: 108,
      activo: true,
    });
  });

  it("acepta números con coma decimal", () => {
    const rows = [
      ["marca", "modelo", "wp", "largo_m", "ancho_m", "precio_usd", "activo"],
      ["Trina", "Vertex-580", "580", "2,384", "1,134", "116", "si"],
    ];
    expect(parsePaneles(rows)[0].largoM).toBeCloseTo(2.384);
  });

  it("parsea inversores", () => {
    const rows = [
      ["marca", "modelo", "kw_ac", "mppt", "precio_usd", "activo"],
      ["SunGrow", "SG110CX", "110", "200-1000 V", "5067", "1"],
    ];
    const inv = parseInversores(rows);
    expect(inv[0].kwAc).toBe(110);
    expect(inv[0].precioUsd).toBe(5067);
  });

  it("specs técnicas del panel con defaults si faltan columnas", () => {
    const rows = [
      ["marca", "modelo", "wp", "largo_m", "ancho_m", "precio_usd", "activo"],
      ["Trina", "Vertex-615", "615", "2.384", "1.134", "107.6", "TRUE"],
    ];
    const p = parsePaneles(rows)[0];
    // Voc ≈ 0.085 × Wp, Vmp ≈ 0.84 × Voc
    expect(p.vocV).toBeCloseTo(52.3, 1);
    expect(p.vmpV).toBeCloseTo(43.9, 1);
    expect(p.bifacial).toBe(false);
  });

  it("specs técnicas del panel desde el Sheet cuando están", () => {
    const rows = [
      ["marca", "modelo", "wp", "largo_m", "ancho_m", "precio_usd", "activo", "voc_v", "vmp_v", "bifacial"],
      ["Trina", "Vertex-615", "615", "2.384", "1.134", "107.6", "TRUE", "51.8", "43.4", "si"],
    ];
    const p = parsePaneles(rows)[0];
    expect(p.vocV).toBe(51.8);
    expect(p.vmpV).toBe(43.4);
    expect(p.bifacial).toBe(true);
  });

  it("specs técnicas del inversor con defaults si faltan columnas", () => {
    const rows = [
      ["marca", "modelo", "kw_ac", "mppt", "precio_usd", "activo"],
      ["GoodWe", "GW25K", "25", "", "1113", "1"],
    ];
    const i = parseInversores(rows)[0];
    expect(i.vdcMaxV).toBe(1100);
    expect(i.mpptCount).toBe(2);
    expect(i.eficienciaEuro).toBe(0.98);
    expect(i.trifasico).toBe(true);
  });

  it("specs técnicas del inversor desde el Sheet", () => {
    const rows = [
      ["marca", "modelo", "kw_ac", "mppt", "precio_usd", "activo", "vdc_max_v", "mppt_count", "eficiencia_euro", "trifasico"],
      ["SunGrow", "SG250HX", "250", "500-1500 V", "9942", "1", "1500", "12", "0.985", "si"],
    ];
    const i = parseInversores(rows)[0];
    expect(i.vdcMaxV).toBe(1500);
    expect(i.mpptCount).toBe(12);
    expect(i.eficienciaEuro).toBe(0.985);
  });

  it("parsea materiales con rangos opcionales", () => {
    const rows = [
      ["item", "regla", "kwp_min", "kwp_max", "valor_usd"],
      ["Cable DC", "por_metro", "", "", "2.8"],
      ["Protecciones y tablero", "por_rango_kwp", "100", "300", "4200"],
    ];
    const mats = parseMateriales(rows);
    expect(mats[0]).toMatchObject({ regla: "por_metro", kwpMin: null, valorUsd: 2.8 });
    expect(mats[1]).toMatchObject({ regla: "por_rango_kwp", kwpMin: 100, kwpMax: 300 });
  });

  it("parsea mano de obra por rango", () => {
    const rows = [
      ["kwp_min", "kwp_max", "usd_por_kwp"],
      ["100", "300", "130"],
    ];
    expect(parseManoDeObra(rows)[0]).toEqual({ kwpMin: 100, kwpMax: 300, usdPorKwp: 130 });
  });

  it("parsea parámetros clave-valor con defaults para los faltantes", () => {
    const rows = [
      ["clave", "valor"],
      ["margen_default", "0.28"],
      ["sombra_pct", "5"],
      ["packing_plano", "0.45"],
      ["clave_desconocida", "99"],
    ];
    const params = parseParametros(rows);
    expect(params.margenDefault).toBe(0.28);
    expect(params.sombraPct).toBe(5);
    expect(params.packingPlano).toBe(0.45);
    expect(params.tasaDescuento).toBe(PARAMETROS_DEFAULT.tasaDescuento);
    expect(params.soilingPct).toBe(PARAMETROS_DEFAULT.soilingPct);
    expect(params.clippingCurve).toEqual(PARAMETROS_DEFAULT.clippingCurve);
  });

  it("parsea la curva de clipping desde el Sheet", () => {
    expect(parseClippingCurve("1.10:0.001;1.25:0.005;1.35:0.015")).toEqual([
      [1.1, 0.001],
      [1.25, 0.005],
      [1.35, 0.015],
    ]);
    expect(parseClippingCurve("basura")).toBeNull();
    const rows = [
      ["clave", "valor"],
      ["clipping_curve", "1.10:0.002;1.30:0.01"],
    ];
    expect(parseParametros(rows).clippingCurve).toEqual([
      [1.1, 0.002],
      [1.3, 0.01],
    ]);
  });

  it("lanza error con filas inválidas", () => {
    const rows = [
      ["marca", "modelo", "wp", "largo_m", "ancho_m", "precio_usd", "activo"],
      ["JA Solar", "X", "no-numero", "2.2", "1.1", "100", "TRUE"],
    ];
    expect(() => parsePaneles(rows)).toThrow();
  });
});
