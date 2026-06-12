"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import area from "@turf/area";
import { polygon as turfPolygon } from "@turf/helpers";
import { Camera, Check, Compass, MapPin, Mountain, Trash2, Undo2 } from "lucide-react";
import type { TipoTecho } from "@/lib/cotizador/types";
import { useWizardShortcut } from "../hooks/useWizardShortcut";
import { useCotizador, type Poligono } from "../context/CotizadorContext";
import { TechoViabilidad } from "./TechoViabilidad";
import {
  BtnPrimary,
  BtnSecondary,
  FormField,
  inputCls,
  KeyboardHint,
  SegmentedControl,
} from "./ui/cotizador-ui";

const MapaTecho = dynamic(
  () => import("./MapaTecho").then((m) => m.MapaTecho),
  { ssr: false, loading: () => <div className="h-full w-full animate-pulse bg-slate-200" /> }
);

const TIPOS: { value: TipoTecho; label: string }[] = [
  { value: "plano", label: "Plano" },
  { value: "inclinado", label: "Inclinado" },
  { value: "serrucho", label: "Serrucho" },
];

function computeAreaM2(points: [number, number][]): number {
  const ring = [...points, points[0]].map(([lat, lng]) => [lng, lat]);
  return area(turfPolygon([ring]));
}

function bearingDeg(a: [number, number], b: [number, number]): number {
  const f1 = (a[0] * Math.PI) / 180;
  const f2 = (b[0] * Math.PI) / 180;
  const dl = ((b[1] - a[1]) * Math.PI) / 180;
  const y = Math.sin(dl) * Math.cos(f2);
  const x = Math.cos(f1) * Math.sin(f2) - Math.sin(f1) * Math.cos(f2) * Math.cos(dl);
  return ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;
}

export function azimutAutomatico(points: [number, number][]): number {
  let bestBearing = 0;
  let bestLen = -1;
  for (let i = 0; i < points.length; i++) {
    const a = points[i];
    const b = points[(i + 1) % points.length];
    const coslat = Math.cos((a[0] * Math.PI) / 180);
    const len = (a[0] - b[0]) ** 2 + ((a[1] - b[1]) * coslat) ** 2;
    if (len > bestLen) {
      bestLen = len;
      bestBearing = bearingDeg(a, b);
    }
  }
  const c1 = (bestBearing + 90) % 360;
  const c2 = (bestBearing + 270) % 360;
  const distNorte = (az: number) => Math.min(az, 360 - az);
  return Math.round(distNorte(c1) <= distNorte(c2) ? c1 : c2);
}

export function StepTecho({ onNext, onBack }: { onNext: () => void; onBack: () => void }) {
  const { state, dispatch } = useCotizador();
  const { techo, poligonos, cliente } = state;
  const [drawingPoints, setDrawingPoints] = useState<[number, number][]>([]);
  const [capturando, setCapturando] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const distanciaRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (state.pendingFocus === "distanciaTablero" && distanciaRef.current) {
      distanciaRef.current.scrollIntoView({ behavior: "smooth", block: "center" });
      distanciaRef.current.focus();
      dispatch({ type: "CLEAR_FOCUS" });
    }
  }, [state.pendingFocus, dispatch]);

  const areaBruta = poligonos.reduce((acc, p) => acc + p.areaM2, 0);
  const areaUtil = areaBruta * techo.factorAprovechamiento;
  const esInclinado = techo.tipoTecho !== "plano";

  function closePolygon() {
    if (drawingPoints.length < 3) return;
    const poligono: Poligono = {
      id: `poly-${Date.now()}`,
      points: drawingPoints,
      areaM2: Math.round(computeAreaM2(drawingPoints)),
    };
    dispatch({ type: "ADD_POLIGONO", poligono });
    dispatch({
      type: "SET_TECHO",
      techo: { azimutDeg: azimutAutomatico(drawingPoints) },
    });
    setDrawingPoints([]);
  }

  async function capturarSnapshot() {
    if (!mapRef.current) return;
    setCapturando(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(mapRef.current, {
        useCORS: true,
        allowTaint: false,
        scale: 1,
        logging: false,
      });
      dispatch({
        type: "SET_TECHO",
        techo: { snapshotDataUrl: canvas.toDataURL("image/jpeg", 0.85) },
      });
    } catch (err) {
      console.error("Error capturando snapshot:", err);
      alert("No se pudo capturar la imagen del mapa.");
    } finally {
      setCapturando(false);
    }
  }

  useWizardShortcut(onNext, true);

  return (
    <div className="grid h-full min-h-0 grid-rows-[auto_1fr] lg:grid-cols-[minmax(320px,30%)_1fr] lg:grid-rows-1">
      <div className="overflow-y-auto border-r border-slate-200 bg-white p-5 sm:p-6">
        <header className="mb-4">
          <h2 className="text-lg font-semibold text-slate-900">2 · Techo</h2>
          <p className="mt-1 text-sm text-slate-500">
            Configurá orientación y sombras. Dibujar el techo en el mapa es{" "}
            <strong className="font-medium text-slate-700">opcional</strong> — sirve para
            comparar capacidad vs potencia objetivo y para el PDF.
          </p>
        </header>

        <div className="mb-4 flex gap-2 rounded-lg border border-sky-100 bg-sky-50/80 p-3 text-xs text-sky-900">
          <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-sky-600" />
          <div>
            <p className="font-semibold text-sky-950">Cómo dibujar en el mapa</p>
            <p className="mt-1 leading-relaxed text-sky-800">
              Hacé <strong>click</strong> en cada vértice del techo. Con 3 o más puntos, usá{" "}
              <strong>Cerrar polígono</strong> o <strong>doble click</strong> en el mapa. Podés
              dibujar varios polígonos si el techo tiene varias losas.
            </p>
          </div>
        </div>

        <div className="mb-4 flex items-center gap-2">
          <button
            type="button"
            onClick={closePolygon}
            disabled={drawingPoints.length < 3}
            className="flex items-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-40"
          >
            <Check className="h-3.5 w-3.5" />
            Cerrar polígono ({drawingPoints.length} pts)
          </button>
          <button
            type="button"
            onClick={() => setDrawingPoints((p) => p.slice(0, -1))}
            disabled={drawingPoints.length === 0}
            className="flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-40"
          >
            <Undo2 className="h-3.5 w-3.5" />
            Deshacer
          </button>
        </div>

        {poligonos.length > 0 && (
          <ul className="mb-4 space-y-1.5">
            {poligonos.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
              >
                <span className="text-slate-700">
                  Polígono {i + 1} — <strong>{p.areaM2.toLocaleString("es-AR")} m²</strong>
                </span>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "REMOVE_POLIGONO", id: p.id })}
                  className="text-slate-400 hover:text-red-600"
                  title="Eliminar"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </li>
            ))}
          </ul>
        )}

        <TechoViabilidad
          areaBruta={areaBruta}
          areaUtil={areaUtil}
          factorAprovechamiento={techo.factorAprovechamiento}
          kwpObjetivo={techo.kwpDeseado ?? 0}
          azimutDeg={techo.azimutDeg}
        />

        <FormField label="Tipo de techo">
          <SegmentedControl
            options={TIPOS}
            value={techo.tipoTecho}
            onChange={(v) => dispatch({ type: "SET_TIPO_TECHO", tipoTecho: v })}
          />
        </FormField>

        <div className="mt-4">
          <FormField label={`Sombra del sitio: ${techo.sombraPct ?? 3}%`}>
            <input
              type="range"
              min="0"
              max="8"
              step="0.5"
              value={techo.sombraPct ?? 3}
              onChange={(e) =>
                dispatch({ type: "SET_TECHO", techo: { sombraPct: Number(e.target.value) } })
              }
              className="w-full accent-amber-600"
            />
            <p className="mt-1 text-xs text-slate-400">
              Estimala mirando obstáculos en la foto satelital.
            </p>
          </FormField>
        </div>

        <div className="mt-3">
          <FormField label="Distancia al tablero (m)">
            <input
              ref={distanciaRef}
              id="distancia-tablero"
              className={inputCls}
              type="number"
              min="0"
              placeholder="Opcional"
              value={techo.distanciaTableroM ?? ""}
              onChange={(e) =>
                dispatch({
                  type: "SET_TECHO",
                  techo: {
                    distanciaTableroM: e.target.value === "" ? null : Number(e.target.value),
                  },
                })
              }
            />
          </FormField>
        </div>

        {!esInclinado && (
          <div className="mt-4 rounded-xl border border-sky-100 bg-sky-50/80 p-3">
            <div className="mb-2 flex items-center gap-2 text-sky-800">
              <Mountain className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Inclinación estructura
              </span>
            </div>
            <FormField label="Grados (°)">
              <input
                className={inputCls}
                type="number"
                min="5"
                max="30"
                value={techo.inclinacionDeg ?? 15}
                onChange={(e) =>
                  dispatch({
                    type: "SET_TECHO",
                    techo: { inclinacionDeg: Number(e.target.value) },
                  })
                }
              />
            </FormField>
            <p className="mt-2 text-xs text-sky-700">
              Techo plano: estructura lastrada al norte (15° default).
            </p>
          </div>
        )}

        {esInclinado && (
          <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center gap-2 text-slate-700">
              <Compass className="h-4 w-4 text-amber-600" />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Orientación e inclinación
              </span>
            </div>
            <div className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
              <FormField label="Azimut (° desde el norte)">
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  max="360"
                  value={techo.azimutDeg ?? 0}
                  onChange={(e) =>
                    dispatch({ type: "SET_TECHO", techo: { azimutDeg: Number(e.target.value) } })
                  }
                />
              </FormField>
              <FormField label="Inclinación (°)">
                <input
                  className={inputCls}
                  type="number"
                  min="0"
                  max="60"
                  value={techo.inclinacionDeg ?? 15}
                  onChange={(e) =>
                    dispatch({
                      type: "SET_TECHO",
                      techo: { inclinacionDeg: Number(e.target.value) },
                    })
                  }
                />
              </FormField>
              <div
                className="mb-1 flex h-11 w-11 items-center justify-center rounded-full border border-slate-300 bg-white shadow-sm"
                title={`Los paneles miran a ${techo.azimutDeg ?? 0}° (N = 0°)`}
              >
                <Compass
                  className="h-5 w-5 text-amber-600 transition-transform"
                  style={{ transform: `rotate(${techo.azimutDeg ?? 0}deg)` }}
                />
              </div>
            </div>
            <p className="mt-2 text-[11px] text-slate-400">
              Azimut precargado con el lado más largo del polígono.
            </p>
          </div>
        )}

        <details className="mt-4 rounded-xl border border-slate-200 px-3 py-2">
          <summary className="cursor-pointer text-xs font-semibold uppercase tracking-wider text-slate-500">
            Avanzado
          </summary>
          <div className="mt-2">
            <FormField label="Packing (fracción del área con módulos)">
              <input
                className={inputCls}
                type="number"
                step="0.05"
                min="0.1"
                max="1"
                value={techo.factorAprovechamiento}
                onChange={(e) =>
                  dispatch({
                    type: "SET_TECHO",
                    techo: { factorAprovechamiento: Number(e.target.value) },
                  })
                }
              />
              <p className="mt-1 text-xs text-slate-400">
                Default: plano 0.50, inclinado 0.85, serrucho 0.50.
              </p>
            </FormField>
          </div>
        </details>

        <div className="mt-4">
          <button
            type="button"
            onClick={capturarSnapshot}
            disabled={capturando || poligonos.length === 0}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-300 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-40"
          >
            <Camera className="h-4 w-4" />
            {capturando ? "Capturando…" : "Capturar imagen para el PDF"}
          </button>
          {techo.snapshotDataUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={techo.snapshotDataUrl}
              alt="Snapshot del techo"
              className="mt-2 max-h-32 w-full rounded-lg border border-slate-200 object-cover"
            />
          )}
        </div>

        <div className="mt-6 space-y-2">
          <div className="flex gap-2">
          <BtnSecondary onClick={onBack} className="flex-1">
            ← Cliente
          </BtnSecondary>
          <BtnPrimary onClick={onNext} className="flex-1">
            Continuar → Consumo
          </BtnPrimary>
          </div>
          <KeyboardHint />
        </div>
      </div>

      <div className="min-h-[360px] lg:min-h-0">
        <MapaTecho
          center={{ lat: cliente.lat, lng: cliente.lon }}
          poligonos={poligonos}
          drawingPoints={drawingPoints}
          onAddPoint={(lat, lng) => setDrawingPoints((p) => [...p, [lat, lng]])}
          onClosePolygon={closePolygon}
          containerRef={mapRef}
          className="h-full w-full"
        />
      </div>
    </div>
  );
}
