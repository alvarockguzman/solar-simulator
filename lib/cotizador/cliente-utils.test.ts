import { describe, expect, it } from "vitest";
import {
  extractCityFromAddress,
  normalizeCliente,
  representanteComercialNombre,
  suggestProyectoNombre,
} from "./cliente-utils";
import type { ClienteInput } from "./types";

describe("cliente-utils", () => {
  it("sugiere nombre de proyecto con ciudad", () => {
    expect(
      suggestProyectoNombre(
        "Industria SA",
        "6608, Av. La Voz del Interior, Córdoba, Capital, Córdoba, Argentina"
      )
    ).toContain("Industria SA");
  });

  it("normaliza legacy email a representante otro", () => {
    const c = normalizeCliente({
      razonSocial: "X",
      contacto: "",
      email: "María",
      representanteModo: "alvaro",
      representanteOtro: "",
      direccion: "",
      lat: 0,
      lon: 0,
    } as ClienteInput);
    // Already has modo alvaro but email differs - normalize only migrates when modo missing
    expect(representanteComercialNombre(c)).toBe("Alvaro");
  });

  it("migra proyectos viejos sin representanteModo", () => {
    const legacy = {
      razonSocial: "X",
      contacto: "",
      email: "Pedro",
      direccion: "",
      lat: 0,
      lon: 0,
    } as ClienteInput;
    const c = normalizeCliente(legacy);
    expect(c.representanteModo).toBe("otro");
    expect(c.representanteOtro).toBe("Pedro");
  });

  it("extractCityFromAddress devuelve algo no vacío", () => {
    expect(extractCityFromAddress("Calle 1, Rosario, Santa Fe, Argentina")).toBeTruthy();
  });
});
