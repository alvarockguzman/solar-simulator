import { afterEach, describe, expect, it } from "vitest";
import { promises as fs } from "fs";
import path from "path";
import type { CotizadorProjectDraft } from "../types";
import { deleteProject, getProject, listProjects, saveProject, storageMode } from "./store";

const LOCAL_DIR = path.join(process.cwd(), "data", "cotizador-projects");

const sampleDraft = (id: string): CotizadorProjectDraft => ({
  id,
  step: 1,
  proyectoNombre: "Test",
  cliente: {
    razonSocial: "Cliente Test",
    contacto: "Ana",
    email: "Alvaro",
    representanteModo: "alvaro",
    representanteOtro: "",
    direccion: "Rosario",
    lat: -32.9,
    lon: -60.6,
  },
  techo: {
    tipoTecho: "plano",
    kwpDeseado: null,
    factorAprovechamiento: 0.5,
    sombraPct: null,
    azimutDeg: 0,
    inclinacionDeg: 15,
    distanciaTableroM: null,
  },
  poligonos: [],
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
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

describe("store local", () => {
  const testId = "22222222-2222-2222-2222-222222222222";

  afterEach(async () => {
    await deleteProject(testId).catch(() => undefined);
  });

  it("usa modo local sin BLOB token en tests", () => {
    expect(storageMode()).toBe("local");
  });

  it("guarda, lista y elimina un proyecto", async () => {
    const draft = sampleDraft(testId);
    await saveProject(draft, { kwp: 10, mwh: 15 });

    const loaded = await getProject(testId);
    expect(loaded?.proyectoNombre).toBe("Test");

    const list = await listProjects("Cliente");
    expect(list.some((p) => p.id === testId)).toBe(true);
    expect(list.find((p) => p.id === testId)?.kwp).toBe(10);

    const ok = await deleteProject(testId);
    expect(ok).toBe(true);
    expect(await getProject(testId)).toBeNull();
  });

  it("limpia archivos locales al eliminar", async () => {
    await saveProject(sampleDraft(testId));
    await deleteProject(testId);
    const file = path.join(LOCAL_DIR, `${testId}.json`);
    await expect(fs.access(file)).rejects.toThrow();
  });
});
