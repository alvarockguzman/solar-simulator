import React from "react";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { ProductionReportData } from "../types";
import { LossDonutSvg, MonthlyBarChartSvg } from "./charts";

const AMBAR = "#d97706";
const GRIS = "#57534e";
const GRIS_CLARO = "#f5f5f4";

const MESES = ["Ene", "Feb", "Mar", "Abr", "May", "Jun", "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"];

const styles = StyleSheet.create({
  page: { padding: 36, fontSize: 9, color: "#1c1917", fontFamily: "Helvetica" },
  h1: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 2 },
  h2: { fontSize: 12, fontFamily: "Helvetica-Bold", marginBottom: 6, color: AMBAR },
  small: { fontSize: 7.5, color: GRIS },
  metricGrid: { flexDirection: "row", flexWrap: "wrap", marginBottom: 10 },
  metricBox: {
    width: "16.66%",
    border: `1 solid ${AMBAR}`,
    borderRadius: 4,
    padding: 6,
    marginBottom: 4,
  },
  metricValue: { fontSize: 11, fontFamily: "Helvetica-Bold" },
  metricLabel: { fontSize: 7, color: GRIS },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: GRIS_CLARO,
    paddingVertical: 3,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "0.5 solid #e7e5e4",
    paddingVertical: 2.5,
    fontSize: 7.5,
  },
  cell: { paddingHorizontal: 3 },
  footer: {
    position: "absolute",
    bottom: 16,
    left: 36,
    right: 36,
    fontSize: 7,
    color: GRIS,
    textAlign: "center",
  },
});

function fmt(n: number, dec = 0): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: dec,
    maximumFractionDigits: dec,
  });
}

function Footer({ numero, page }: { numero: string; page: number }) {
  return (
    <Text style={styles.footer}>
      Renovatio · www.renovatio.lat · Reporte de Producción N° {numero} · página {page}/3
    </Text>
  );
}

export interface ProductionReportPdfProps {
  report: ProductionReportData;
  numero: string;
  snapshotDataUrl?: string | null;
  borrador?: boolean;
}

export function ProductionReportPdf({
  report,
  numero,
  snapshotDataUrl,
  borrador = false,
}: ProductionReportPdfProps) {
  const { proyecto, metrics, tablaMensual, cascada, dona, bomTecnico, fieldSegment, supuestos } =
    report;

  const tiltStr =
    fieldSegment.tiltDeg !== null
      ? `${fmt(fieldSegment.tiltDeg, 1)}°${fieldSegment.optimizadoPvgis ? " (óptimo PVGIS)" : ""}`
      : "—";
  const azStr =
    fieldSegment.azimutDeg !== null
      ? `${fmt(fieldSegment.azimutDeg, 0)}° desde el norte${fieldSegment.optimizadoPvgis ? " (óptimo PVGIS)" : ""}`
      : "—";

  return (
    <Document title={`Reporte ${numero} — ${proyecto.nombre}`}>
      {/* Página 1 */}
      <Page size="A4" style={styles.page}>
        <Text style={{ fontSize: 11, fontFamily: "Helvetica-Bold", color: AMBAR }}>RENOVATIO</Text>
        <Text style={styles.small}>Energía solar para industria y comercio</Text>
        <Text style={{ ...styles.h1, marginTop: 8 }}>Reporte de Producción Solar</Text>
        {borrador && (
          <Text
            style={{
              fontSize: 9,
              color: "#92400e",
              backgroundColor: "#fef3c7",
              padding: 6,
              marginBottom: 6,
              borderRadius: 4,
            }}
          >
            PRODUCCIÓN ESTIMADA — datos satelitales no disponibles, validar antes de enviar
          </Text>
        )}
        <Text style={{ fontSize: 10, marginBottom: 10 }}>
          {proyecto.nombre} · N° {numero} · {proyecto.fecha}
        </Text>

        <View style={{ backgroundColor: GRIS_CLARO, borderRadius: 4, padding: 8, marginBottom: 10 }}>
          <Text>{proyecto.direccion}</Text>
          <Text style={styles.small}>
            Lat {proyecto.lat.toFixed(5)}, Lon {proyecto.lon.toFixed(5)} · Fuente:{" "}
            {metrics.fuenteClimatica}
          </Text>
        </View>

        <View style={styles.metricGrid}>
          {[
            ["kWp DC", fmt(metrics.kwpDc, 1)],
            ["kW AC", fmt(metrics.kwAcTotal, 0)],
            ["Load ratio", metrics.loadRatio.toFixed(2)],
            ["MWh/año", fmt(metrics.energiaAnualMwh, 1)],
            ["PR", borrador ? "n/d" : metrics.prPct !== null ? `${fmt(metrics.prPct, 1)}%` : "—"],
            ["kWh/kWp·año", fmt(metrics.kwhPorKwp)],
          ].map(([label, val]) => (
            <View key={label} style={styles.metricBox}>
              <Text style={styles.metricLabel}>{label}</Text>
              <Text style={styles.metricValue}>{val}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.h2}>Producción mensual</Text>
        <MonthlyBarChartSvg
          produccion={report.produccionMensualKwh}
          consumo={report.consumoMensualKwh}
        />

        <Text style={{ ...styles.h2, marginTop: 10 }}>Pérdidas del sistema</Text>
        <LossDonutSvg slices={dona} />

        <Footer numero={numero} page={1} />
      </Page>

      {/* Página 2 */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Detalle mensual</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.cell, width: "8%" }}>Mes</Text>
          <Text style={{ ...styles.cell, width: "18%", textAlign: "right" }}>GHI</Text>
          <Text style={{ ...styles.cell, width: "18%", textAlign: "right" }}>POA</Text>
          <Text style={{ ...styles.cell, width: "22%", textAlign: "right" }}>Nameplate</Text>
          <Text style={{ ...styles.cell, width: "22%", textAlign: "right" }}>A red</Text>
        </View>
        {tablaMensual.map((r) => (
          <View key={r.mes} style={styles.tableRow}>
            <Text style={{ ...styles.cell, width: "8%" }}>{MESES[r.mes - 1]}</Text>
            <Text style={{ ...styles.cell, width: "18%", textAlign: "right" }}>
              {r.ghiKwhM2 !== null ? fmt(r.ghiKwhM2, 1) : "—"}
            </Text>
            <Text style={{ ...styles.cell, width: "18%", textAlign: "right" }}>
              {r.poaKwhM2 !== null ? fmt(r.poaKwhM2, 1) : "—"}
            </Text>
            <Text style={{ ...styles.cell, width: "22%", textAlign: "right" }}>
              {r.nameplateKwh !== null ? fmt(r.nameplateKwh) : "—"}
            </Text>
            <Text style={{ ...styles.cell, width: "22%", textAlign: "right" }}>
              {fmt(r.energiaRedKwh)}
            </Text>
          </View>
        ))}

        <Text style={{ ...styles.h2, marginTop: 12 }}>Cascada de pérdidas (anual)</Text>
        <View style={styles.tableHeader}>
          <Text style={{ ...styles.cell, flex: 1 }}>Etapa</Text>
          <Text style={{ ...styles.cell, width: 80, textAlign: "right" }}>kWh</Text>
          <Text style={{ ...styles.cell, width: 50, textAlign: "right" }}>Δ%</Text>
        </View>
        {cascada.map((r) => (
          <View key={r.etapa} style={styles.tableRow}>
            <Text style={{ ...styles.cell, flex: 1 }}>{r.etapa}</Text>
            <Text style={{ ...styles.cell, width: 80, textAlign: "right" }}>
              {fmt(r.energiaKwh)}
            </Text>
            <Text style={{ ...styles.cell, width: 50, textAlign: "right" }}>
              {r.deltaPct !== 0 ? `${r.deltaPct}%` : "—"}
            </Text>
          </View>
        ))}

        <Text style={{ ...styles.h2, marginTop: 12 }}>Sistema propuesto (BOM técnico)</Text>
        {bomTecnico.map((r) => (
          <View key={r.item + r.detalle} style={styles.tableRow}>
            <Text style={{ ...styles.cell, width: "22%" }}>{r.item}</Text>
            <Text style={{ ...styles.cell, flex: 1 }}>{r.detalle}</Text>
            <Text style={{ ...styles.cell, width: 60, textAlign: "right" }}>{r.cantidad}</Text>
          </View>
        ))}

        <Footer numero={numero} page={2} />
      </Page>

      {/* Página 3 */}
      <Page size="A4" style={styles.page}>
        {snapshotDataUrl ? (
          <View style={{ marginBottom: 12 }}>
            <Text style={styles.h2}>Superficie relevada</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image src={snapshotDataUrl} style={{ width: 360, borderRadius: 4 }} />
          </View>
        ) : null}

        <Text style={styles.h2}>Field segment</Text>
        <View style={{ marginBottom: 10 }}>
          <Text>Tipo de techo: {fieldSegment.tipoTecho}</Text>
          <Text>
            Área bruta: {fmt(fieldSegment.areaBrutaM2)} m² · Packing:{" "}
            {fmt(fieldSegment.packing * 100, 0)}% · Módulos: {fieldSegment.nPaneles}
          </Text>
          <Text>Inclinación: {tiltStr}</Text>
          <Text>Orientación: {azStr}</Text>
        </View>

        <Text style={styles.h2}>Supuestos</Text>
        {supuestos.map((s) => (
          <View key={s.nombre} style={{ flexDirection: "row", marginBottom: 2 }}>
            <Text style={{ width: "55%", color: GRIS }}>{s.nombre}</Text>
            <Text style={{ flex: 1 }}>{s.valor}</Text>
          </View>
        ))}

        <Text style={{ marginTop: 14, fontSize: 8, color: GRIS, lineHeight: 1.4 }}>
          Reporte preliminar generado automáticamente. Sujeto a verificación en visita técnica.
          No constituye oferta comercial ni garantía de producción.
        </Text>

        <Footer numero={numero} page={3} />
      </Page>
    </Document>
  );
}
