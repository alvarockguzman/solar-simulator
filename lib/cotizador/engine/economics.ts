import type {
  ConsumoInput,
  EconomicsAnual,
  EconomicsResult,
  Parametros,
  PvgisResult,
} from "../types";

/**
 * Economics (sección 3.4 del plan):
 * - Autoconsumo con criterio mensual: min(producción_mes, consumo_diurno_mes).
 * - Ahorro = autoconsumo × tarifa + excedente × tarifa_inyección.
 * - Payback simple, VAN a 25 años con tasa parametrizada, TIR (Newton),
 *   degradación 0.5%/año, CO₂ evitado.
 */

const HORIZONTE_ANOS = 25;

/** TIR por Newton-Raphson con fallback de bisección. Devuelve fracción anual o null. */
export function tir(cashflows: number[]): number | null {
  const npv = (rate: number) =>
    cashflows.reduce((acc, cf, t) => acc + cf / Math.pow(1 + rate, t), 0);

  let rate = 0.1;
  for (let i = 0; i < 50; i++) {
    const f = npv(rate);
    const h = 1e-6;
    const df = (npv(rate + h) - f) / h;
    if (Math.abs(df) < 1e-12) break;
    const next = rate - f / df;
    if (!Number.isFinite(next) || next <= -0.99) break;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }

  // Bisección entre -90% y 200% si Newton no convergió.
  let lo = -0.9;
  let hi = 2;
  if (npv(lo) * npv(hi) > 0) return null;
  for (let i = 0; i < 100; i++) {
    const mid = (lo + hi) / 2;
    if (npv(lo) * npv(mid) <= 0) hi = mid;
    else lo = mid;
  }
  return (lo + hi) / 2;
}

export function computeEconomics(
  kwpSistema: number,
  capexUsd: number,
  consumo: ConsumoInput,
  pvgis: PvgisResult,
  params: Parametros
): EconomicsResult {
  const consumoMensual = consumo.mensualKwh;
  const consumoAnual = consumoMensual.reduce((a, b) => a + b, 0);

  // Producción mensual año 1 (kWh) escalando el perfil por kWp de PVGIS.
  const produccionMensual = pvgis.monthlyKwhPerKwp.map((m) => m * kwpSistema);
  const opexAnual = params.opexUsdKwp * kwpSistema;

  const tarifaInyeccion =
    consumo.tarifaInyeccionUsdKwh ?? params.tarifaInyeccion;

  const computeYear = (degradFactor: number, tarifaMult: number) => {
    let autoconsumo = 0;
    let produccion = 0;
    let excedente = 0;
    for (let m = 0; m < 12; m++) {
      const prod = produccionMensual[m] * degradFactor;
      const consDiurno = consumoMensual[m] * consumo.pctDiurno;
      const auto = Math.min(prod, consDiurno);
      autoconsumo += auto;
      excedente += prod - auto;
      produccion += prod;
    }
    const tarifaCompra = consumo.tarifaUsdKwh * tarifaMult;
    const tarifaIny = tarifaInyeccion * tarifaMult;
    const ahorro = autoconsumo * tarifaCompra + excedente * tarifaIny;
    return { produccion, autoconsumo, excedente, ahorro };
  };

  const proyeccion: EconomicsAnual[] = [];
  const cashflows: number[] = [-capexUsd];
  let acumulado = -capexUsd;

  for (let ano = 1; ano <= HORIZONTE_ANOS; ano++) {
    const degradFactor = Math.pow(1 - params.degradacionAnual, ano - 1);
    const tarifaMult = Math.pow(1 + params.escalacionTarifaReal, ano - 1);
    const { produccion, autoconsumo, excedente, ahorro } = computeYear(
      degradFactor,
      tarifaMult
    );
    const flujoNeto = ahorro - opexAnual;
    acumulado += flujoNeto;
    cashflows.push(flujoNeto);
    proyeccion.push({
      ano,
      produccionKwh: Math.round(produccion),
      autoconsumoKwh: Math.round(autoconsumo),
      excedenteKwh: Math.round(excedente),
      ahorroUsd: Math.round(ahorro),
      opexUsd: Math.round(opexAnual),
      flujoNetoUsd: Math.round(flujoNeto),
      flujoAcumuladoUsd: Math.round(acumulado),
    });
  }

  const ano1 = proyeccion[0];
  const flujoNetoAno1 = ano1.ahorroUsd - ano1.opexUsd;
  const paybackAnos =
    flujoNetoAno1 > 0 ? Math.round((capexUsd / flujoNetoAno1) * 10) / 10 : null;

  const van = cashflows.reduce(
    (acc, cf, t) => acc + cf / Math.pow(1 + params.tasaDescuento, t),
    0
  );
  const tirValor = tir(cashflows);

  return {
    produccionAnualKwh: ano1.produccionKwh,
    consumoAnualKwh: Math.round(consumoAnual),
    autoconsumoAnualKwh: ano1.autoconsumoKwh,
    ahorroAnualUsd: ano1.ahorroUsd,
    opexAnualUsd: Math.round(opexAnual),
    paybackAnos,
    vanUsd: Math.round(van),
    tirPct: tirValor !== null ? Math.round(tirValor * 1000) / 10 : null,
    co2EvitadoTonAno: Math.round((ano1.produccionKwh * params.co2KgKwh) / 100) / 10,
    proyeccion,
    produccionMensualKwh: produccionMensual.map((v) => Math.round(v)),
    consumoMensualKwh: consumoMensual.map((v) => Math.round(v)),
  };
}
