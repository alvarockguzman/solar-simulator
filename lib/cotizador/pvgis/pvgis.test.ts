import { describe, expect, it } from "vitest";
import fixture from "./__fixtures__/pvcalc-cordoba-100kwp.json";
import mrcalcFixture from "./__fixtures__/mrcalc-cordoba.json";
import {
  buildPvgisParams,
  mountingForTecho,
  parseMrcalcResponse,
  parsePvgisResponse,
  pvgisCacheKey,
  uiAzimuthToPvgisAspect,
  type MrcalcApiResponse,
  type PvgisApiResponse,
} from "./client";
import { PARAMETROS_DEFAULT } from "../pricing/parse";

describe("conversión de azimut UI → aspect PVGIS", () => {
  it("norte (0°) → ±180 (óptimo en hemisferio sur)", () => {
    expect(Math.abs(uiAzimuthToPvgisAspect(0))).toBe(180);
  });

  it("este (90°) → -90", () => {
    expect(uiAzimuthToPvgisAspect(90)).toBe(-90);
  });

  it("sur (180°) → 0", () => {
    expect(uiAzimuthToPvgisAspect(180)).toBe(0);
  });

  it("oeste (270°) → 90", () => {
    expect(uiAzimuthToPvgisAspect(270)).toBe(90);
  });

  it("noreste (45°) → -135", () => {
    expect(uiAzimuthToPvgisAspect(45)).toBe(-135);
  });

  it("360° equivale a 0°", () => {
    expect(uiAzimuthToPvgisAspect(360)).toBe(uiAzimuthToPvgisAspect(0));
  });
});

describe("parámetros de la llamada a PVGIS", () => {
  const base = {
    lat: -31.4,
    lon: -64.2,
    kwp: 100,
    azimutDeg: null,
    inclinacionDeg: null,
    lossPct: 14,
  };

  it("techo plano usa estructura lastrada 15° al norte", () => {
    const params = buildPvgisParams({ ...base, tipoTecho: "plano" });
    expect(params.get("optimalangles")).toBeNull();
    expect(params.get("angle")).toBe("15");
    expect(Math.abs(Number(params.get("aspect")))).toBe(180);
  });

  it("techo plano respeta inclinación y azimut del usuario", () => {
    const params = buildPvgisParams({
      ...base,
      tipoTecho: "plano",
      inclinacionDeg: 12,
      azimutDeg: 10,
    });
    expect(params.get("angle")).toBe("12");
    expect(params.get("aspect")).toBe(String(uiAzimuthToPvgisAspect(10)));
  });

  it("buildPvgisParams respeta mountingplace", () => {
    const params = buildPvgisParams({ ...base, tipoTecho: "plano", mountingplace: "free" });
    expect(params.get("mountingplace")).toBe("free");
  });

  it("mountingForTecho mapea tipo → building/free", () => {
    expect(mountingForTecho("inclinado", PARAMETROS_DEFAULT)).toBe("building");
    expect(mountingForTecho("plano", PARAMETROS_DEFAULT)).toBe("free");
  });

  it("pvgisCacheKey distingue mountingplace", () => {
    const base = {
      lat: -31.4,
      lon: -64.2,
      kwp: 100,
      tipoTecho: "plano" as const,
      azimutDeg: null,
      inclinacionDeg: null,
      lossPct: 14,
    };
    const building = pvgisCacheKey({ ...base, mountingplace: "building" });
    const free = pvgisCacheKey({ ...base, mountingplace: "free" });
    expect(building).not.toBe(free);
    expect(free).toContain("free");
  });
});

describe("parseo de respuesta real de PVGIS (fixture Córdoba, 100 kWp)", () => {
  const result = parsePvgisResponse(fixture as PvgisApiResponse, 100);

  it("yield anual por kWp correcto", () => {
    // E_y del fixture: 134529.87 kWh para 100 kWp
    expect(result.yieldKwhPerKwpYear).toBeCloseTo(1345.3, 0);
  });

  it("perfil mensual de 12 valores que suma el anual", () => {
    expect(result.monthlyKwhPerKwp).toHaveLength(12);
    const suma = result.monthlyKwhPerKwp.reduce((a, b) => a + b, 0);
    expect(suma).toBeCloseTo(result.yieldKwhPerKwpYear, 0);
  });

  it("verano produce más que invierno (hemisferio sur)", () => {
    const enero = result.monthlyKwhPerKwp[0];
    const junio = result.monthlyKwhPerKwp[5];
    expect(enero).toBeGreaterThan(junio * 1.5);
  });

  it("PVGIS eligió orientación norte (aspect ±180) como óptima", () => {
    expect(Math.abs(result.aspectDeg!)).toBe(180);
  });

  it("expone la base de radiación (PVGIS-ERA5 en Argentina)", () => {
    expect(result.radiationDb).toBe("PVGIS-ERA5");
  });

  it("lanza error si falta E_y", () => {
    expect(() => parsePvgisResponse({}, 100)).toThrow();
  });

  it("parsea las pérdidas internas de PVGIS (l_aoi, l_spec, l_tg, l_total)", () => {
    // Fixture: l_aoi=-3.5, l_spec="?(0)" (string → null), l_tg=-11.16, l_total=-26.27
    expect(result.internalLosses.lAoiPct).toBeCloseTo(-3.5, 2);
    expect(result.internalLosses.lSpecPct).toBeNull();
    expect(result.internalLosses.lTgPct).toBeCloseTo(-11.16, 2);
    expect(result.internalLosses.lTotalPct).toBeCloseTo(-26.27, 2);
  });

  it("marca slope/azimuth como óptimos cuando se usó optimalangles", () => {
    expect(result.angleOptimal).toBe(true);
    expect(result.aspectOptimal).toBe(true);
  });

  it("expone la irradiación mensual sobre el plano (H(i)_m)", () => {
    expect(result.monthlyIrradiationKwhM2).toHaveLength(12);
    const suma = result.monthlyIrradiationKwhM2!.reduce((a, b) => a + b, 0);
    expect(suma).toBeCloseTo(result.irradiationKwhM2Year!, 0);
  });
});

describe("parseo de MRcalc (fixture Córdoba 2016-2020)", () => {
  const ghi = parseMrcalcResponse(mrcalcFixture as MrcalcApiResponse);

  it("promedia los años → 12 valores mensuales", () => {
    expect(ghi.monthlyGhiKwhM2).toHaveLength(12);
    // Enero 2016 = 209.08; el promedio multianual debe estar en un rango razonable.
    expect(ghi.monthlyGhiKwhM2[0]).toBeGreaterThan(180);
    expect(ghi.monthlyGhiKwhM2[0]).toBeLessThan(230);
  });

  it("GHI anual de Córdoba ≈ 1830 kWh/m²", () => {
    expect(ghi.annualGhiKwhM2).toBeGreaterThan(1700);
    expect(ghi.annualGhiKwhM2).toBeLessThan(1950);
  });

  it("verano > invierno", () => {
    expect(ghi.monthlyGhiKwhM2[0]).toBeGreaterThan(ghi.monthlyGhiKwhM2[5] * 1.5);
  });

  it("lanza error con respuesta vacía", () => {
    expect(() => parseMrcalcResponse({})).toThrow();
  });
});
