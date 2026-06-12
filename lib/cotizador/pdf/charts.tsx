import React from "react";
import { Text, View } from "@react-pdf/renderer";
import type { LossDonutSlice } from "../types";

const AMBAR = "#d97706";
const GRIS = "#78716c";
const MESES = ["E", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

/** Gráfico de barras mensuales con Views (evita SVG Path que cuelga en Windows). */
export function MonthlyBarChartSvg({
  produccion,
  consumo,
}: {
  produccion: number[];
  consumo?: number[] | null;
  width?: number;
  height?: number;
}) {
  const max = Math.max(...produccion, ...(consumo ?? [0]), 1);
  const barMaxH = 72;

  return (
    <View>
      <View style={{ flexDirection: "row", alignItems: "flex-end", height: barMaxH + 14 }}>
        {produccion.map((p, i) => {
          const h = Math.max(2, (p / max) * barMaxH);
          return (
            <View
              key={i}
              style={{ width: `${100 / 12}%`, alignItems: "center", justifyContent: "flex-end" }}
            >
              <View
                style={{
                  width: "55%",
                  height: h,
                  backgroundColor: AMBAR,
                  borderRadius: 1,
                }}
              />
            </View>
          );
        })}
      </View>
      <View style={{ flexDirection: "row", marginTop: 2 }}>
        {MESES.map((m, i) => (
          <Text
            key={m + i}
            style={{ width: `${100 / 12}%`, fontSize: 6, textAlign: "center", color: GRIS }}
          >
            {m}
          </Text>
        ))}
      </View>
      <View style={{ flexDirection: "row", marginTop: 4, gap: 12 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
          <View style={{ width: 8, height: 8, backgroundColor: AMBAR }} />
          <Text style={{ fontSize: 7, color: GRIS }}>Producción</Text>
        </View>
        {consumo && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: GRIS }} />
            <Text style={{ fontSize: 7, color: GRIS }}>Consumo</Text>
          </View>
        )}
      </View>
    </View>
  );
}

/** Leyenda de pérdidas (tabla horizontal; reemplaza dona SVG). */
export function LossDonutSvg({ slices }: { slices: LossDonutSlice[]; width?: number; height?: number }) {
  const colors = [
    "#d97706", "#f59e0b", "#fbbf24", "#a8a29e", "#78716c",
    "#0ea5e9", "#38bdf8", "#7dd3fc", "#facc15",
  ];
  const top = slices.slice(0, 8);

  return (
    <View>
      {top.map((s, i) => (
        <View
          key={s.etiqueta}
          style={{ flexDirection: "row", alignItems: "center", marginBottom: 3, gap: 6 }}
        >
          <View style={{ width: 8, height: 8, backgroundColor: colors[i % colors.length] }} />
          <Text style={{ fontSize: 7.5, color: GRIS, flex: 1 }}>
            {s.etiqueta.slice(0, 36)}
          </Text>
          <Text style={{ fontSize: 7.5, color: GRIS, width: 36, textAlign: "right" }}>
            {s.pct.toFixed(1)}%
          </Text>
          <View
            style={{
              width: 120,
              height: 6,
              backgroundColor: "#e7e5e4",
              borderRadius: 2,
            }}
          >
            <View
              style={{
                width: `${Math.min(100, s.pct * 3)}%`,
                height: 6,
                backgroundColor: colors[i % colors.length],
                borderRadius: 2,
              }}
            />
          </View>
        </View>
      ))}
    </View>
  );
}
