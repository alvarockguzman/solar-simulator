import React from "react";
import {
  Document,
  Image,
  Line,
  Page,
  Rect,
  StyleSheet,
  Svg,
  Text,
  View,
  Text as SvgTextBase,
} from "@react-pdf/renderer";
import type { QuoteInput, QuoteResult } from "../types";

/**
 * PDF de cotización (sección 5 del plan):
 * portada, resumen ejecutivo, imagen del techo, sistema propuesto
 * (detalle BOM o precio cerrado según mostrar_detalle), gráfico mensual SVG,
 * economics resumida y supuestos.
 */

const AMBAR = "#d97706";
const GRIS = "#57534e";
const GRIS_CLARO = "#f5f5f4";

const styles = StyleSheet.create({
  page: { padding: 40, fontSize: 10, color: "#1c1917", fontFamily: "Helvetica" },
  h1: { fontSize: 22, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  h2: { fontSize: 14, fontFamily: "Helvetica-Bold", marginBottom: 8, color: AMBAR },
  h3: { fontSize: 11, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  small: { fontSize: 8, color: GRIS },
  row: { flexDirection: "row" },
  metricBox: {
    flex: 1,
    border: `1 solid ${AMBAR}`,
    borderRadius: 6,
    padding: 10,
    marginRight: 6,
  },
  metricValue: { fontSize: 16, fontFamily: "Helvetica-Bold" },
  metricLabel: { fontSize: 8, color: GRIS, marginBottom: 2 },
  tableRow: {
    flexDirection: "row",
    borderBottom: `0.5 solid #e7e5e4`,
    paddingVertical: 3,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: GRIS_CLARO,
    paddingVertical: 4,
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  cell: { paddingHorizontal: 4 },
  footer: {
    position: "absolute",
    bottom: 20,
    left: 40,
    right: 40,
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

const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Gráfico de barras mensual como SVG estático (producción vs consumo). */
function MonthlyChart({ result }: { result: QuoteResult }) {
  const prod = result.economics.produccionMensualKwh;
  const cons = result.economics.consumoMensualKwh;
  const max = Math.max(...prod, ...cons, 1);
  const W = 500;
  const H = 160;
  const plotH = 130;
  const groupW = W / 12;
  const barW = groupW * 0.32;

  return (
    <Svg width={W} height={H}>
      <Line x1={0} y1={plotH} x2={W} y2={plotH} stroke="#a8a29e" strokeWidth={0.8} />
      {prod.map((p, i) => {
        const hP = (p / max) * (plotH - 10);
        const hC = (cons[i] / max) * (plotH - 10);
        const x0 = i * groupW + groupW * 0.15;
        return (
          <React.Fragment key={i}>
            <Rect x={x0} y={plotH - hP} width={barW} height={hP} fill={AMBAR} />
            <Rect x={x0 + barW + 2} y={plotH - hC} width={barW} height={hC} fill={GRIS} />
            <SvgTextBase
              x={i * groupW + groupW / 2}
              y={plotH + 12}
              style={{ fontSize: 7, textAnchor: "middle", fill: GRIS }}
            >
              {MESES[i]}
            </SvgTextBase>
          </React.Fragment>
        );
      })}
      <Rect x={W - 150} y={4} width={8} height={8} fill={AMBAR} />
      <SvgTextBase x={W - 138} y={11} style={{ fontSize: 7, fill: GRIS }}>
        Producción
      </SvgTextBase>
      <Rect x={W - 80} y={4} width={8} height={8} fill={GRIS} />
      <SvgTextBase x={W - 68} y={11} style={{ fontSize: 7, fill: GRIS }}>
        Consumo
      </SvgTextBase>
    </Svg>
  );
}

export interface QuotePdfProps {
  input: QuoteInput;
  result: QuoteResult;
  numero: string;
  fecha: string;
  validezDias: number;
  supuestos: string;
  vendedor?: string;
}

export function QuotePdf({ input, result, numero, fecha, validezDias, supuestos }: QuotePdfProps) {
  const { sizing, bom, economics } = result;
  const { cliente, ajustes } = input;
  const anosResumen = [1, 5, 10, 15, 20, 25];
  const fallbackPvgis = result.pvgis.source === "fallback";
  // En el detalle visible al cliente, el margen se prorratea en cada línea
  // para que los subtotales sumen el precio final.
  const factorVenta = bom.costoUsd > 0 ? bom.capexUsd / bom.costoUsd : 1;

  return (
    <Document title={`Cotización ${numero} — ${cliente.razonSocial}`}>
      {/* Portada + resumen */}
      <Page size="A4" style={styles.page}>
        <View style={{ marginBottom: 24 }}>
          <Text style={{ fontSize: 12, fontFamily: "Helvetica-Bold", color: AMBAR }}>
            RENOVATIO
          </Text>
          <Text style={styles.small}>Energía solar para industria y comercio</Text>
        </View>

        <Text style={styles.h1}>Cotización preliminar</Text>
        <Text style={{ fontSize: 12, marginBottom: 16 }}>
          Sistema solar fotovoltaico de {fmt(sizing.kwpSistema, 1)} kWp
        </Text>

        <View style={{ backgroundColor: GRIS_CLARO, borderRadius: 6, padding: 12, marginBottom: 20 }}>
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Cliente</Text>
              <Text style={styles.h3}>{cliente.razonSocial}</Text>
              {cliente.contacto ? <Text>{cliente.contacto}</Text> : null}
              {cliente.email ? <Text style={styles.small}>{cliente.email}</Text> : null}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.small}>Cotización Nº</Text>
              <Text style={styles.h3}>{numero}</Text>
              <Text style={styles.small}>Fecha: {fecha}</Text>
              <Text style={styles.small}>Validez: {validezDias} días</Text>
            </View>
          </View>
          {cliente.direccion ? (
            <Text style={{ ...styles.small, marginTop: 6 }}>{cliente.direccion}</Text>
          ) : null}
        </View>

        <Text style={styles.h2}>Resumen ejecutivo</Text>
        <View style={{ ...styles.row, marginBottom: 16 }}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>POTENCIA</Text>
            <Text style={styles.metricValue}>{fmt(sizing.kwpSistema, 1)} kWp</Text>
            <Text style={styles.small}>{sizing.nPaneles} paneles</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>PRODUCCIÓN ANUAL</Text>
            <Text style={styles.metricValue}>{fmt(economics.produccionAnualKwh / 1000)} MWh</Text>
            <Text style={styles.small}>{fmt(result.pvgis.yieldKwhPerKwpYear)} kWh/kWp·año</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>AHORRO ANUAL</Text>
            <Text style={styles.metricValue}>USD {fmt(economics.ahorroAnualUsd)}</Text>
            <Text style={styles.small}>año 1</Text>
          </View>
          <View style={{ ...styles.metricBox, marginRight: 0, backgroundColor: "#fffbeb" }}>
            <Text style={styles.metricLabel}>INVERSIÓN</Text>
            <Text style={styles.metricValue}>USD {fmt(bom.capexUsd)}</Text>
            <Text style={styles.small}>
              Payback {economics.paybackAnos ?? "—"} años
            </Text>
          </View>
        </View>

        {input.techo.snapshotDataUrl ? (
          <View>
            <Text style={styles.h2}>Superficie relevada</Text>
            {/* eslint-disable-next-line jsx-a11y/alt-text */}
            <Image
              src={input.techo.snapshotDataUrl}
              style={{ width: 380, borderRadius: 6 }}
            />
            <Text style={{ ...styles.small, marginTop: 4 }}>
              Área bruta {fmt(sizing.areaBrutaM2)} m² · útil {fmt(sizing.areaUtilM2)} m² (techo{" "}
              {input.techo.tipoTecho})
            </Text>
          </View>
        ) : null}

        {fallbackPvgis ? (
          <Text style={{ marginTop: 12, fontSize: 8, color: "#b91c1c" }}>
            ADVERTENCIA: la producción se estimó con un rendimiento genérico (PVGIS no
            disponible al momento de cotizar). Sujeto a verificación.
          </Text>
        ) : null}

        <Text style={styles.footer}>
          Cotización {numero} · {fecha} · Renovatio — documento preliminar, no constituye
          oferta vinculante.
        </Text>
      </Page>

      {/* Sistema propuesto + gráfico */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Sistema propuesto</Text>

        {ajustes.mostrarDetalle ? (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.tableHeader}>
              <Text style={{ ...styles.cell, flex: 3 }}>Ítem</Text>
              <Text style={{ ...styles.cell, flex: 4 }}>Detalle</Text>
              <Text style={{ ...styles.cell, flex: 1, textAlign: "right" }}>Cant.</Text>
              <Text style={{ ...styles.cell, flex: 1.5, textAlign: "right" }}>Subtotal USD</Text>
            </View>
            {bom.lineas.map((l) => (
              <View key={l.id} style={styles.tableRow}>
                <Text style={{ ...styles.cell, flex: 3 }}>{l.item}</Text>
                <Text style={{ ...styles.cell, flex: 4, fontSize: 8, color: GRIS }}>
                  {l.detalle}
                </Text>
                <Text style={{ ...styles.cell, flex: 1, textAlign: "right" }}>
                  {fmt(l.cantidad)} {l.unidad}
                </Text>
                <Text style={{ ...styles.cell, flex: 1.5, textAlign: "right" }}>
                  {fmt(l.subtotalUsd * factorVenta)}
                </Text>
              </View>
            ))}
            <View style={{ ...styles.tableRow, borderBottom: "none", marginTop: 4 }}>
              <Text style={{ ...styles.cell, flex: 8, textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                Total (USD, sin IVA)
              </Text>
              <Text style={{ ...styles.cell, flex: 1.5, textAlign: "right", fontFamily: "Helvetica-Bold" }}>
                {fmt(bom.capexUsd)}
              </Text>
            </View>
          </View>
        ) : (
          <View style={{ marginBottom: 16 }}>
            <View style={styles.tableRow}>
              <Text style={{ flex: 1 }}>Paneles fotovoltaicos</Text>
              <Text>
                {sizing.nPaneles} × {sizing.panel.marca} {sizing.panel.modelo} ({sizing.panel.wp} Wp)
              </Text>
            </View>
            {bom.inversores.map((c, i) => (
              <View key={i} style={styles.tableRow}>
                <Text style={{ flex: 1 }}>Inversor</Text>
                <Text>
                  {c.cantidad} × {c.inversor.marca} {c.inversor.modelo} ({c.inversor.kwAc} kW)
                </Text>
              </View>
            ))}
            <View style={styles.tableRow}>
              <Text style={{ flex: 1 }}>Estructura, cableado, protecciones e instalación</Text>
              <Text>Incluidos</Text>
            </View>
            <View style={{ ...styles.tableRow, borderBottom: "none", marginTop: 8 }}>
              <Text style={{ flex: 1, fontFamily: "Helvetica-Bold", fontSize: 12 }}>
                Precio total llave en mano (USD, sin IVA)
              </Text>
              <Text style={{ fontFamily: "Helvetica-Bold", fontSize: 12 }}>
                {fmt(bom.capexUsd)}
              </Text>
            </View>
          </View>
        )}

        <Text style={styles.h2}>Producción mensual vs consumo</Text>
        <MonthlyChart result={result} />

        <Text style={styles.footer}>
          Cotización {numero} · {fecha} · Renovatio
        </Text>
      </Page>

      {/* Economics + supuestos */}
      <Page size="A4" style={styles.page}>
        <Text style={styles.h2}>Análisis económico (25 años)</Text>

        <View style={{ ...styles.row, marginBottom: 14 }}>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>PAYBACK</Text>
            <Text style={styles.metricValue}>{economics.paybackAnos ?? "—"} años</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>VAN (25 años)</Text>
            <Text style={styles.metricValue}>USD {fmt(economics.vanUsd)}</Text>
          </View>
          <View style={styles.metricBox}>
            <Text style={styles.metricLabel}>TIR</Text>
            <Text style={styles.metricValue}>
              {economics.tirPct !== null ? `${economics.tirPct}%` : "—"}
            </Text>
          </View>
          <View style={{ ...styles.metricBox, marginRight: 0 }}>
            <Text style={styles.metricLabel}>CO2 EVITADO</Text>
            <Text style={styles.metricValue}>{fmt(economics.co2EvitadoTonAno, 1)} t/año</Text>
          </View>
        </View>

        <View style={styles.tableHeader}>
          <Text style={{ ...styles.cell, flex: 1 }}>Año</Text>
          <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>Producción kWh</Text>
          <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>Ahorro USD</Text>
          <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>Flujo neto USD</Text>
          <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>Acumulado USD</Text>
        </View>
        {anosResumen.map((ano) => {
          const fila = economics.proyeccion[ano - 1];
          return (
            <View key={ano} style={styles.tableRow}>
              <Text style={{ ...styles.cell, flex: 1 }}>{fila.ano}</Text>
              <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>
                {fmt(fila.produccionKwh)}
              </Text>
              <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>
                {fmt(fila.ahorroUsd)}
              </Text>
              <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>
                {fmt(fila.flujoNetoUsd)}
              </Text>
              <Text style={{ ...styles.cell, flex: 2, textAlign: "right" }}>
                {fmt(fila.flujoAcumuladoUsd)}
              </Text>
            </View>
          );
        })}
        <Text style={{ ...styles.small, marginTop: 6 }}>
          Incluye degradación de paneles 0,5%/año, OPEX USD {fmt(economics.opexAnualUsd)}/año y
          tarifa constante de {input.consumo.tarifaUsdKwh} USD/kWh.
        </Text>

        <View style={{ marginTop: 24 }}>
          <Text style={styles.h2}>Supuestos y exclusiones</Text>
          <Text style={{ fontSize: 9, lineHeight: 1.5 }}>{supuestos}</Text>
        </View>

        <Text style={styles.footer}>
          Cotización {numero} · {fecha} · Renovatio
        </Text>
      </Page>
    </Document>
  );
}
