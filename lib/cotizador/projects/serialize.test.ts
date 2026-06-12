import { describe, expect, it } from "vitest";
import { draftToSummary, hydratePersistedState, serializeProject } from "./serialize";
import type { CotizadorProjectDraft } from "../types";

const baseDraft = (): CotizadorProjectDraft => ({
  id: "11111111-1111-1111-1111-111111111111",
  step: 2,
  proyectoNombre: "TOOLSMANIA",
  cliente: {
    razonSocial: "TOOLSMANIA SA",
    contacto: "Juan",
    email: "j@t.com",
    representanteModo: "alvaro",
    representanteOtro: "",
    direccion: "Córdoba",
    lat: -31.32,
    lon: -64.21,
  },
  techo: {
    tipoTecho: "plano",
    kwpDeseado: null,
    factorAprovechamiento: 0.5,
    sombraPct: null,
    azimutDeg: 0,
    inclinacionDeg: 15,
    distanciaTableroM: 15,
  },
  poligonos: [
    { id: "p1", points: [[-31.32, -64.21]], areaM2: 260 },
  ],
  consumo: {
    habilitado: false,
    modo: "promedio",
    promedioKwh: 0,
    mensualKwh: Array(12).fill(0),
    tarifaModo: "directa",
    tarifaNivel: "T2",
    tarifaUsdKwh: 0,
    facturaMensualUsd: 0,
    pctDiurno: 0.7,
    consumoPreset: null,
    tarifaInyeccionUsdKwh: null,
  },
  ajustes: {
    panelModelo: null,
    inversorModelo: null,
    margenPct: null,
    descuentoPct: 0,
    lineasOverride: {},
    lineasManuales: [],
    mostrarDetalle: true,
  },
  snapshotUrl: "https://example.com/snap.jpg",
  createdAt: "2026-01-01T00:00:00.000Z",
  updatedAt: "2026-01-02T00:00:00.000Z",
});

describe("serialize / hydrate", () => {
  it("hydrate restaura snapshotUrl en techo", () => {
    const state = hydratePersistedState(baseDraft());
    expect(state.projectId).toBe(baseDraft().id);
    expect(state.techo.snapshotDataUrl).toBe("https://example.com/snap.jpg");
    expect(state.poligonos).toHaveLength(1);
  });

  it("hydrate normaliza tarifaInyeccionUsdKwh ausente a null", () => {
    const draft = baseDraft();
    const { tarifaInyeccionUsdKwh: _, ...consumoSinInyeccion } = draft.consumo;
    const legacy = { ...draft, consumo: consumoSinInyeccion };
    const state = hydratePersistedState(legacy as CotizadorProjectDraft);
    expect(state.consumo.tarifaInyeccionUsdKwh).toBeNull();
  });

  it("draftToSummary incluye métricas opcionales", () => {
    const summary = draftToSummary(baseDraft(), { kwp: 29.5, mwh: 45.5 });
    expect(summary.kwp).toBe(29.5);
    expect(summary.clienteRazonSocial).toBe("TOOLSMANIA SA");
  });

  it("serialize no incluye data URL en snapshotUrl (se sube aparte)", () => {
    const hydrated = hydratePersistedState(baseDraft());
    const serialized = serializeProject(
      {
        ...hydrated,
        techo: { ...hydrated.techo, snapshotDataUrl: "data:image/jpeg;base64,abc" },
      },
      { id: baseDraft().id, createdAt: baseDraft().createdAt, snapshotUrl: "https://old.url" }
    );
    expect(serialized.snapshotUrl).toBe("https://old.url");
  });
});
