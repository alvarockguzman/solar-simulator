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

const CALCULADORA_VIEWPORTS = [
  { id: "desktop", width: 1280, height: 800 },
  { id: "mobile", width: 375, height: 812 },
] as const;

const CALCULADORAS = [
  {
    id: "calculadora",
    path: "/calculadora",
    start: "Comenzar simulación",
    results: "Ahorro anual estimado",
  },
  {
    id: "nexo",
    path: "/calculadora/nexo",
    start: "Calcular mi ahorro",
    results: "La inversión se recupera en",
  },
] as const;

async function mockCalculadoraApis(page: import("@playwright/test").Page) {
  await page.route("https://nominatim.openstreetmap.org/**", async (route) => {
    const url = route.request().url();
    if (url.includes("reverse")) {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify({ display_name: "Av. Corrientes 1234, Buenos Aires" }),
      });
      return;
    }
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify([
        {
          display_name: "Av. Corrientes 1234, Buenos Aires",
          lat: "-34.6037",
          lon: "-58.3816",
          place_id: 1,
        },
      ]),
    });
  });
  await page.route("**/api/pvgis**", async (route) => {
    await route.fulfill({
      status: 200,
      contentType: "application/json",
      body: JSON.stringify({ yieldKwhPerKwpYear: 1500 }),
    });
  });
}

test.describe("Calculadoras Renovatio y Nexo", () => {
  test.beforeAll(() => {
    fs.mkdirSync(OUT_DIR, { recursive: true });
  });

  for (const calc of CALCULADORAS) {
    for (const viewport of CALCULADORA_VIEWPORTS) {
      test(`${calc.id} ${viewport.id}: intro, dirección y resultados`, async ({ page }) => {
        test.setTimeout(120_000);
        await page.setViewportSize({ width: viewport.width, height: viewport.height });
        await mockCalculadoraApis(page);
        await page.goto(calc.path);

        if (calc.id === "nexo") {
          await expect(page.getByText("Renovatio")).toHaveCount(0);
          await expect(page.getByText("5491123969892")).toHaveCount(0);
          await expect(page.locator('img[src*="renovatio"]')).toHaveCount(0);
        }

        await expect(page.getByRole("button", { name: calc.start })).toBeVisible();
        await page.screenshot({
          path: path.join(OUT_DIR, `${calc.id}-intro-${viewport.id}.png`),
          fullPage: true,
        });

        await page.getByRole("button", { name: calc.start }).click();
        await page.getByLabel("Dirección").fill("Corrientes");
        await page.getByRole("option", { name: /Corrientes 1234/ }).click();
        await expect(page.getByRole("heading", { name: "Seleccioná la dirección de tu empresa" })).toBeVisible();
        await page.screenshot({
          path: path.join(OUT_DIR, `${calc.id}-paso-${viewport.id}.png`),
          fullPage: true,
        });

        await page.getByRole("button", { name: "Siguiente" }).click();
        await page.getByRole("button", { name: /ingresar la superficie manualmente/i }).click();
        await page.getByLabel("Superficie (m²)").fill("400");
        await page.getByRole("button", { name: "Guardar superficie" }).click();
        await page.getByRole("button", { name: "Siguiente" }).click();
        await page
          .getByLabel("Tipo de tarifa", { exact: true })
          .selectOption({ label: "T2 – Mediana Demanda" });
        await page.getByRole("button", { name: "Siguiente" }).click();
        await page.getByLabel("Consumo anual en kWh").fill("50000");
        await page.getByRole("button", { name: "Calcular" }).click();
        await expect(page.getByText(calc.results)).toBeVisible();
        await page.waitForFunction(() => {
          const el = document.querySelector(".renovatio-results-enter");
          if (!el) return true;
          return Number.parseFloat(getComputedStyle(el).opacity) > 0.98;
        });
        await page.screenshot({
          path: path.join(OUT_DIR, `${calc.id}-resultados-${viewport.id}.png`),
          fullPage: true,
        });
      });
    }
  }
});
