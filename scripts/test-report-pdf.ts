/**
 * Smoke test del PDF de reporte. Uso: npx tsx scripts/test-report-pdf.ts
 */
import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ProductionReportPdf } from "../lib/cotizador/pdf/ProductionReportPdf";
import type { ProductionReportData } from "../lib/cotizador/types";

const report: ProductionReportData = {
  proyecto: { nombre: "TEST", direccion: "Córdoba", fecha: "2026-06-11", lat: -31.32, lon: -64.21 },
  metrics: { kwpDc: 29.5, kwAcTotal: 25, loadRatio: 1.18, energiaAnualMwh: 45.5, kwhPorKwp: 1541, prPct: 77, fuenteClimatica: "PVGIS-SARAH3" },
  tablaMensual: Array.from({ length: 12 }, (_, i) => ({ mes: i + 1, ghiKwhM2: 150, poaKwhM2: 160, nameplateKwh: 4000, energiaRedKwh: 3800 })),
  cascada: [{ etapa: "Nameplate", energiaKwh: 50000, deltaPct: 0 }, { etapa: "Energía a red", energiaKwh: 45000, deltaPct: 0 }],
  dona: [{ etiqueta: "Temp", pct: 11 }],
  bomTecnico: [{ item: "Paneles", detalle: "Trina", cantidad: "48 u" }],
  fieldSegment: { tiltDeg: 15, azimutDeg: 0, optimizadoPvgis: false, nPaneles: 48, packing: 0.5, areaBrutaM2: 260, tipoTecho: "plano" },
  supuestos: [{ nombre: "Fuente", valor: "PVGIS" }],
  produccionMensualKwh: [4000, 3800, 3600, 3400, 3200, 3000, 3100, 3300, 3500, 3700, 3900, 4100],
  consumoMensualKwh: null,
  warnings: [],
};

async function main() {
  const t0 = Date.now();
  console.log("Renderizando PDF...");
  const buf = await renderToBuffer(
    React.createElement(ProductionReportPdf, { report, numero: "2026-001" }) as React.ReactElement<DocumentProps>
  );
  console.log(`OK: ${buf.length} bytes en ${Date.now() - t0} ms`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
