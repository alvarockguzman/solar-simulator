import { expect, test } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";

const OUT_DIR = path.join(process.cwd(), "docs", "screenshots");

async function fillClienteAndGoTecho(page: import("@playwright/test").Page) {
  await page.getByPlaceholder("Industria SA").fill("Test Solar SA");
  await page.getByRole("button", { name: /Pequeño/i }).click();
  await page.getByRole("button", { name: /Continuar → Techo/i }).click();
}

async function goToEquipos(page: import("@playwright/test").Page) {
  await fillClienteAndGoTecho(page);
  await page.getByRole("button", { name: /Continuar → Consumo/i }).click();
  await page.getByRole("button", { name: /Continuar → Equipos/i }).click();
  await page.waitForSelector("text=4 · Equipos e insumos");
}

test.describe("Cotizador wizard screenshots", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  test("paso 1 Cliente — sin duplicación de secciones", async ({ page }) => {
    await page.goto("/cotizador");
    const wizard = page.getByTestId("cotizador-wizard");
    await expect(wizard).toBeVisible();

    await page.getByPlaceholder("Industria SA").fill("Test Solar SA");
    await page.getByRole("button", { name: /Pequeño/i }).click();

    await wizard.screenshot({ path: path.join(OUT_DIR, "paso-01-cliente.png") });

    const contactoCount = await page.getByText("Contacto Cliente", { exact: true }).count();
    const repCount = await page.getByText("Representante Comercial", { exact: true }).count();
    expect(contactoCount).toBe(1);
    expect(repCount).toBe(1);
  });

  test("paso 4 Equipos — sin duplicación de categorías", async ({ page }) => {
    await page.goto("/cotizador");
    await goToEquipos(page);

    const wizard = page.getByTestId("cotizador-wizard");
    await wizard.screenshot({ path: path.join(OUT_DIR, "paso-04-equipos.png") });

    const electricoHeaders = page.getByText("Eléctrico", { exact: true });
    await expect(electricoHeaders).toHaveCount(1);
  });
});
