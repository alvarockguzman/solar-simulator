import type {
  BomLinea,
  BomResult,
  Catalog,
  QuoteAjustes,
  QuoteWarning,
  SizingResult,
  TechoInput,
} from "../types";
import {
  LOAD_RATIO_MAX,
  LOAD_RATIO_MIN,
  selectInverter,
  type InverterSelection,
} from "./inverterSelect";

/**
 * Generación del BOM: paneles, inversores seleccionados por load ratio
 * (ver inverterSelect.ts), estructura por panel según techo, cableado por
 * distancia (o rango de kWp si falta el dato), protecciones, mano de obra
 * por rango, ingeniería y margen.
 */

function materialPorRango(catalog: Catalog, item: string, kwp: number): number | null {
  const filas = catalog.materiales.filter(
    (m) =>
      m.regla === "por_rango_kwp" &&
      m.item.toLowerCase() === item.toLowerCase() &&
      m.kwpMin !== null &&
      m.kwpMax !== null &&
      kwp >= m.kwpMin &&
      kwp < m.kwpMax
  );
  return filas.length > 0 ? filas[0].valorUsd : null;
}

function materialPorMetro(catalog: Catalog, item: string): number | null {
  const fila = catalog.materiales.find(
    (m) => m.regla === "por_metro" && m.item.toLowerCase() === item.toLowerCase()
  );
  return fila ? fila.valorUsd : null;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export interface BomComputation {
  bom: BomResult;
  seleccion: InverterSelection | null;
  warnings: QuoteWarning[];
}

export function computeBom(
  sizing: SizingResult,
  techo: TechoInput,
  catalog: Catalog,
  ajustes: QuoteAjustes
): BomComputation {
  const params = catalog.parametros;
  const warnings: QuoteWarning[] = [];
  const lineas: BomLinea[] = [];
  const { panel, nPaneles, kwpSistema } = sizing;

  const pushLinea = (
    id: string,
    item: string,
    detalle: string,
    cantidad: number,
    unidad: string,
    unitarioUsd: number
  ) => {
    const override = ajustes.lineasOverride[id];
    const cant = override?.cantidad ?? cantidad;
    const unit = override?.unitarioUsd ?? unitarioUsd;
    lineas.push({
      id,
      item,
      detalle,
      cantidad: round2(cant),
      unidad,
      unitarioUsd: round2(unit),
      subtotalUsd: round2(cant * unit),
      manual: Boolean(override),
    });
  };

  // Paneles
  pushLinea(
    "paneles",
    "Paneles fotovoltaicos",
    `${panel.marca} ${panel.modelo} (${panel.wp} Wp)`,
    nPaneles,
    "u",
    panel.precioUsd
  );

  // Inversores: N unidades iguales por load ratio (inverterSelect.ts).
  const seleccion = selectInverter(kwpSistema, catalog.inversores, ajustes.inversorModelo);
  let kwAcTotal = 0;
  let ratioDcAc = 0;
  if (seleccion) {
    kwAcTotal = seleccion.kwAcTotal;
    ratioDcAc = seleccion.loadRatio;
    seleccion.combo.forEach((c, i) => {
      pushLinea(
        `inversor-${i}`,
        "Inversor",
        `${c.inversor.marca} ${c.inversor.modelo} (${c.inversor.kwAc} kW AC)`,
        c.cantidad,
        "u",
        c.inversor.precioUsd
      );
    });
    if (!seleccion.enRango) {
      warnings.push({
        code: "load_ratio_fuera_rango",
        message: `El load ratio DC/AC quedó en ${seleccion.loadRatio.toFixed(2)}, fuera del rango ${LOAD_RATIO_MIN}-${LOAD_RATIO_MAX}. Revisar el modelo de inversor seleccionado.`,
      });
    }
  } else {
    warnings.push({
      code: "sin_inversor",
      message:
        "No hay inversores activos compatibles en el catálogo. Revisar el catálogo o el modelo forzado.",
    });
  }

  // Estructura
  const estructura = catalog.estructuras.find((e) => e.tipoTecho === techo.tipoTecho);
  if (estructura) {
    pushLinea(
      "estructura",
      "Estructura de montaje",
      estructura.descripcion,
      nPaneles,
      "u",
      estructura.usdPorPanel
    );
  }

  // Cableado: por distancia si hay dato; si no, tabla por rango de kWp.
  const distancia = techo.distanciaTableroM;
  if (distancia !== null && distancia > 0) {
    const dcM = materialPorMetro(catalog, "Cable DC") ?? 0;
    const acM = materialPorMetro(catalog, "Cable AC") ?? 0;
    // Tiradas en paralelo para sistemas grandes (aprox. una por cada 50 kWp).
    const tiradas = Math.max(1, Math.ceil(kwpSistema / 50));
    pushLinea(
      "cableado",
      "Cableado DC+AC",
      `${distancia} m al tablero × ${tiradas} tirada(s)`,
      distancia * tiradas,
      "m",
      dcM + acM
    );
  } else {
    const cableadoRango = materialPorRango(catalog, "Cableado DC+AC", kwpSistema);
    if (cableadoRango !== null) {
      pushLinea(
        "cableado",
        "Cableado DC+AC",
        "Estimado por rango de potencia (sin dato de distancia al tablero)",
        1,
        "gl",
        cableadoRango
      );
    }
    warnings.push({
      code: "sin_distancia_tablero",
      message:
        "Sin distancia al tablero: el cableado se estimó por rango de kWp. Cargar la distancia mejora la precisión.",
    });
  }

  // Protecciones y tablero
  const protecciones = materialPorRango(catalog, "Protecciones y tablero", kwpSistema);
  if (protecciones !== null) {
    pushLinea(
      "protecciones",
      "Protecciones y tablero",
      "Protecciones DC/AC, tablero y puesta a tierra",
      1,
      "gl",
      protecciones
    );
  }

  // Mano de obra
  const rangoMo = catalog.manoDeObra.find(
    (r) => kwpSistema >= r.kwpMin && kwpSistema < r.kwpMax
  );
  if (rangoMo) {
    pushLinea(
      "mano-obra",
      "Mano de obra e instalación",
      `${rangoMo.usdPorKwp} USD/kWp (rango ${rangoMo.kwpMin}-${rangoMo.kwpMax} kWp)`,
      kwpSistema,
      "kWp",
      rangoMo.usdPorKwp
    );
  }

  // Ingeniería y trámites: fijo + % sobre el costo de materiales/instalación.
  const subtotalMateriales = lineas.reduce((acc, l) => acc + l.subtotalUsd, 0);
  pushLinea(
    "ingenieria",
    "Ingeniería y trámites",
    "Proyecto, planos y gestión ante la distribuidora",
    1,
    "gl",
    params.ingenieriaFijaUsd + params.ingenieriaPct * subtotalMateriales
  );

  // Líneas manuales agregadas por el vendedor.
  for (const manual of ajustes.lineasManuales) {
    lineas.push({
      ...manual,
      subtotalUsd: round2(manual.cantidad * manual.unitarioUsd),
      manual: true,
    });
  }

  const costoUsd = round2(lineas.reduce((acc, l) => acc + l.subtotalUsd, 0));
  const margenPct = ajustes.margenPct ?? params.margenDefault;
  const descuentoPct = ajustes.descuentoPct;
  const capexUsd = round2(costoUsd * (1 + margenPct) * (1 - descuentoPct));

  return {
    bom: {
      lineas,
      inversores: seleccion?.combo ?? [],
      kwAcTotal: round2(kwAcTotal),
      ratioDcAc: round2(ratioDcAc),
      costoUsd,
      margenPct,
      descuentoPct,
      capexUsd,
    },
    seleccion,
    warnings,
  };
}
