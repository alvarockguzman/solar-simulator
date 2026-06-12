import { describe, expect, it } from "vitest";
import {
  warningAction,
  warningActionLabel,
  warningSeverity,
} from "./warnings";

describe("warnings", () => {
  it("clasifica severidades según código", () => {
    expect(warningSeverity("sin_inversor")).toBe("error");
    expect(warningSeverity("load_ratio_fuera_rango")).toBe("warning");
    expect(warningSeverity("potencia_manual")).toBe("info");
    expect(warningSeverity("limitado_por_techo")).toBe("info");
  });

  it("expone acciones inline para códigos conocidos", () => {
    expect(warningAction("load_ratio_fuera_rango")).toBe("auto_inversor");
    expect(warningActionLabel("auto_inversor")).toBe("Usar selección automática");
    expect(warningAction("pvgis_fallback")).toBe("retry_pvgis");
    expect(warningAction("sin_distancia_tablero")).toBe("ir_distancia_tablero");
    expect(warningAction("potencia_manual")).toBeNull();
  });
});
