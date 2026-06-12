/**
 * Chequeo manual de integración contra PVGIS real (no corre en CI).
 * Uso: npx tsx scripts/pvgis-check.ts
 * Llama PVcalc + MRcalc para Córdoba y muestra yield, POA, GHI y pérdidas internas.
 */
import { fetchGhi, fetchPvgis } from "../lib/cotizador/pvgis/client";

async function main() {
  const lat = -31.4;
  const lon = -64.2;

  console.log("PVcalc (techo plano, 15° norte, 100 kWp, loss 10.6%)...");
  const pvgis = await fetchPvgis({
    lat,
    lon,
    kwp: 100,
    tipoTecho: "plano",
    azimutDeg: null,
    inclinacionDeg: null,
    lossPct: 10.6,
  });
  console.log({
    yield: pvgis.yieldKwhPerKwpYear.toFixed(0),
    poaAnual: pvgis.irradiationKwhM2Year,
    tiltOptimo: pvgis.angleDeg,
    aspect: pvgis.aspectDeg,
    internas: pvgis.internalLosses,
  });

  console.log("MRcalc (GHI)...");
  const ghi = await fetchGhi(lat, lon);
  console.log({
    ghiAnual: ghi.annualGhiKwhM2.toFixed(0),
    ghiMensual: ghi.monthlyGhiKwhM2.map((v) => v.toFixed(0)).join(", "),
  });

  const pr =
    pvgis.yieldKwhPerKwpYear / (pvgis.irradiationKwhM2Year ?? Infinity);
  console.log(`PR estimado: ${(pr * 100).toFixed(1)}%`);
}

main().catch((err) => {
  console.error("Fallo el chequeo:", err);
  process.exit(1);
});
