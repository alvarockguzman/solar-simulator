import type { Catalog } from "../types";
import { PARAMETROS_DEFAULT } from "./parse";

/**
 * Catálogo curado real de G2E (docs/Lista de Precios - G2E.xlsx, mayo 2026).
 * Precios USD nacionalizados. Specs eléctricas tomadas de datasheets de los
 * modelos; los valores marcados ESTIMADO no se pudieron verificar contra el
 * datasheet exacto y usan valores típicos de la familia.
 * El primer panel activo es el default del cotizador (Trina 615 bifacial N).
 */
export function getMockCatalog(): Catalog {
  return {
    paneles: [
      {
        marca: "Trina Solar",
        modelo: "Vertex N 615W bifacial",
        wp: 615,
        largoM: 2.384,
        anchoM: 1.134,
        precioUsd: 107.56,
        activo: true,
        vocV: 51.8,
        vmpV: 43.4,
        bifacial: true,
        betaVocPctC: -0.25,
        specsEstimadas: false,
      },
      {
        marca: "LONGi",
        modelo: "Hi-MO X10 645W N-Type",
        wp: 645,
        largoM: 2.382,
        anchoM: 1.134,
        precioUsd: 123.45,
        activo: true,
        vocV: 49.5,
        vmpV: 42.0,
        bifacial: false,
        betaVocPctC: -0.25,
        specsEstimadas: true,
      },
      {
        marca: "Jinko Solar",
        modelo: "Tiger Neo 725W bifacial",
        wp: 725,
        largoM: 2.384,
        anchoM: 1.134,
        precioUsd: 120.35,
        activo: true,
        vocV: 48.4,
        vmpV: 40.5,
        bifacial: true,
        betaVocPctC: -0.25,
        specsEstimadas: true,
      },
    ],
    inversores: [
      { marca: "GoodWe", modelo: "GW10K-SDT-30", kwAc: 10, mppt: "160-1000 V", precioUsd: 780, activo: true, vdcMaxV: 1100, mpptCount: 2, eficienciaEuro: 0.98, trifasico: true },
      { marca: "GoodWe", modelo: "GW15K-SDT-30", kwAc: 15, mppt: "160-1000 V", precioUsd: 860, activo: true, vdcMaxV: 1100, mpptCount: 2, eficienciaEuro: 0.98, trifasico: true },
      { marca: "GoodWe", modelo: "GW20K-SDT-30", kwAc: 20, mppt: "160-1000 V", precioUsd: 988, activo: true, vdcMaxV: 1100, mpptCount: 2, eficienciaEuro: 0.98, trifasico: true },
      { marca: "GoodWe", modelo: "GW25K-SDT-C30 AFCI", kwAc: 25, mppt: "160-1000 V", precioUsd: 1113, activo: true, vdcMaxV: 1100, mpptCount: 3, eficienciaEuro: 0.98, trifasico: true }, // MPPT ESTIMADO
      { marca: "GoodWe", modelo: "GW30K-SDT-C30 AFCI", kwAc: 30, mppt: "160-1000 V", precioUsd: 1228, activo: true, vdcMaxV: 1100, mpptCount: 3, eficienciaEuro: 0.98, trifasico: true }, // MPPT ESTIMADO
      { marca: "GoodWe", modelo: "GW40K-SDT-C30 AFCI", kwAc: 40, mppt: "200-1000 V", precioUsd: 1461, activo: true, vdcMaxV: 1100, mpptCount: 4, eficienciaEuro: 0.98, trifasico: true }, // MPPT ESTIMADO
      { marca: "GoodWe", modelo: "GW50K-SDT AFCI", kwAc: 50, mppt: "200-1000 V", precioUsd: 1635, activo: true, vdcMaxV: 1100, mpptCount: 4, eficienciaEuro: 0.98, trifasico: true }, // MPPT ESTIMADO
      { marca: "GoodWe", modelo: "GW60KS-MT AFCI", kwAc: 60, mppt: "200-1000 V", precioUsd: 2422, activo: true, vdcMaxV: 1100, mpptCount: 4, eficienciaEuro: 0.98, trifasico: true }, // MPPT ESTIMADO
      // SunGrow trifásicos serie CX/HX — eficiencia euro 0.985
      { marca: "SunGrow", modelo: "SG75 Trifásico 75kW", kwAc: 75, mppt: "200-1000 V", precioUsd: 3824, activo: true, vdcMaxV: 1100, mpptCount: 6, eficienciaEuro: 0.985, trifasico: true }, // MPPT ESTIMADO
      { marca: "SunGrow", modelo: "SG110CX 110kW", kwAc: 110, mppt: "200-1000 V", precioUsd: 5067, activo: true, vdcMaxV: 1100, mpptCount: 9, eficienciaEuro: 0.985, trifasico: true },
      { marca: "SunGrow", modelo: "SG250HX 250kW", kwAc: 250, mppt: "500-1500 V", precioUsd: 9942, activo: true, vdcMaxV: 1500, mpptCount: 12, eficienciaEuro: 0.985, trifasico: true },
      { marca: "SunGrow", modelo: "SG333HX 333kW", kwAc: 333, mppt: "500-1500 V", precioUsd: 12237, activo: true, vdcMaxV: 1500, mpptCount: 12, eficienciaEuro: 0.985, trifasico: true }, // MPPT ESTIMADO
    ],
    estructuras: [
      {
        tipoTecho: "plano",
        descripcion: "Estructura lastrada inclinada 10-15°",
        usdPorPanel: 35,
      },
      {
        tipoTecho: "inclinado",
        descripcion: "Estructura coplanar sobre chapa/teja",
        usdPorPanel: 22,
      },
      {
        tipoTecho: "serrucho",
        descripcion: "Triángulos sobre aguas bien orientadas",
        usdPorPanel: 30,
      },
    ],
    materiales: [
      { item: "Cable DC", regla: "por_metro", kwpMin: null, kwpMax: null, valorUsd: 2.8 },
      { item: "Cable AC", regla: "por_metro", kwpMin: null, kwpMax: null, valorUsd: 4.2 },
      { item: "Cableado DC+AC", regla: "por_rango_kwp", kwpMin: 0, kwpMax: 30, valorUsd: 1200 },
      { item: "Cableado DC+AC", regla: "por_rango_kwp", kwpMin: 30, kwpMax: 100, valorUsd: 3000 },
      { item: "Cableado DC+AC", regla: "por_rango_kwp", kwpMin: 100, kwpMax: 300, valorUsd: 6000 },
      { item: "Cableado DC+AC", regla: "por_rango_kwp", kwpMin: 300, kwpMax: 10000, valorUsd: 12000 },
      { item: "Protecciones y tablero", regla: "por_rango_kwp", kwpMin: 0, kwpMax: 30, valorUsd: 900 },
      { item: "Protecciones y tablero", regla: "por_rango_kwp", kwpMin: 30, kwpMax: 100, valorUsd: 2200 },
      { item: "Protecciones y tablero", regla: "por_rango_kwp", kwpMin: 100, kwpMax: 300, valorUsd: 4200 },
      { item: "Protecciones y tablero", regla: "por_rango_kwp", kwpMin: 300, kwpMax: 10000, valorUsd: 8000 },
    ],
    manoDeObra: [
      { kwpMin: 0, kwpMax: 30, usdPorKwp: 200 },
      { kwpMin: 30, kwpMax: 100, usdPorKwp: 160 },
      { kwpMin: 100, kwpMax: 300, usdPorKwp: 130 },
      { kwpMin: 300, kwpMax: 10000, usdPorKwp: 110 },
    ],
    parametros: { ...PARAMETROS_DEFAULT },
    stale: false,
    source: "mock",
    fetchedAt: new Date().toISOString(),
  };
}
