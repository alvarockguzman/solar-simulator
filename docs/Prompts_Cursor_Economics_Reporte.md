# Prompts Cursor — Reporte Economics

Objetivo: que el reporte muestre la parte económica **arriba de todo** (es lo más
importante), calculada con el motor que ya existe (`lib/cotizador/engine/economics.ts`).

En esta etapa **no usamos Excel ni Google Sheets**: la lista de precios y los
parámetros financieros viven dentro de la herramienta como valores por defecto y se
editan de vez en cuando.

---

## Parámetros del modelo (decisiones tomadas)

| Parámetro | Valor | Dónde vive |
|---|---|---|
| Horizonte | 25 años | `engine/economics.ts` → `HORIZONTE_ANOS` (ya está) |
| Degradación anual | plana, 0,4 %/año | `parse.ts` → `degradacionAnual: 0.004` (ya está) |
| Payback | simple | ya es simple en el motor |
| Escalación tarifaria real | 0 | `parse.ts` → `escalacionTarifaReal: 0` (ya está) |
| Tasa de descuento (VAN) | **11 %** | `parse.ts` → `tasaDescuento` (HAY QUE CAMBIAR a 0.11) |
| Moneda | USD | ya está |
| OPEX mantenimiento | 11 USD/kWp·año | `parse.ts` → `opexUsdKwp: 11` |
| Tarifa de inyección | 0,035 USD/kWh | `parse.ts` → `tarifaInyeccion: 0.035` |

---

## Cómo se calcula cada número (referencia)

El motor ya computa todo esto en `computeEconomics()`. No hay que reescribir cálculo,
solo mostrarlo.

**Inputs**
- Producción mensual año 1 = perfil PVGIS (kWh/kWp·mes) × kWp del sistema.
- CAPEX = suma del BOM (equipos + insumos + ingeniería, con margen) → `result.bom.capexUsd`.
- Parámetros internos: OPEX/kWp, degradación, tasa de descuento, tarifa de inyección.
- Por proyecto: tarifa de compra del cliente, % de consumo diurno, consumo mensual.

**Los dos ingresos (mes a mes, sumados al año)**
- Ahorro por autoconsumo = `min(producción_mes, consumo_mes × %diurno) × tarifa_compra`.
- Inyección a la red = `(producción_mes − autoconsumo) × tarifa_inyección`.

**Por año (1 a 25)**
- Producción año N = producción año 1 × `(1 − degradación)^(N−1)`.
- Tarifas año N × `(1 + escalación)^(N−1)` (escalación = 0 → tarifas constantes).
- Flujo neto = (ahorro autoconsumo + inyección) − OPEX, con `OPEX = opexUsdKwp × kWp`.
- Flujo acumulado: arranca en −CAPEX y va sumando los flujos netos.

**KPIs**
- Inversión = CAPEX.
- Ahorro anual (año 1) = ahorro autoconsumo + inyección del año 1.
- Recupero (payback simple) = CAPEX ÷ flujo neto del año 1.
- VAN (25 años) = Σ flujo_año ÷ (1 + 0,11)^año, arrancando en −CAPEX.
- TIR = tasa que hace VAN = 0.
- CO₂ evitado/año = producción anual × factor CO₂.

Campos disponibles en `result.economics`: `ahorroAnualUsd`, `opexAnualUsd`,
`paybackAnos`, `vanUsd`, `tirPct`, `co2EvitadoTonAno`, `produccionAnualKwh`,
`autoconsumoAnualKwh`, y `proyeccion[]` (cada año: `ano`, `produccionKwh`,
`autoconsumoKwh`, `excedenteKwh`, `ahorroUsd`, `opexUsd`, `flujoNetoUsd`,
`flujoAcumuladoUsd`).

---

## PROMPT 1 — Tasa de descuento a 11 %

```
En lib/cotizador/pricing/parse.ts, dentro del objeto PARAMETROS_DEFAULT, cambiá
tasaDescuento de 0.1 a 0.11 (tasa de descuento del 11 % para el cálculo del VAN).
No cambies ningún otro parámetro: dejá escalacionTarifaReal en 0 y degradacionAnual
en 0.004 (degradación plana). No toques otros archivos.
```

---

## PROMPT 2 — Bloque económico arriba del reporte

```
En app/cotizador/components/StepReporte.tsx quiero agregar una sección económica
que aparezca PRIMERO en el cuerpo del reporte, justo después del bloque de
advertencias (QuoteWarningList) y ANTES del bloque "Cobertura del consumo".

No modifiques backend, tipos ni el motor. Leé los datos que ya están disponibles en
el componente: el objeto result (state.result), usando result.economics y
result.bom.capexUsd, y la tarifa desde state.consumo y state.catalog.parametros.

Definí las variables:
- const eco = result.economics;
- const capexUsd = result.bom.capexUsd;
- const tarifaCompra = state.consumo.tarifaUsdKwh;
- const tarifaIny = state.consumo.tarifaInyeccionUsdKwh ?? state.catalog?.parametros.tarifaInyeccion ?? 0;
- const ano1 = eco.proyeccion[0] ?? null;
- ingresoAutoconsumo = ano1 ? ano1.autoconsumoKwh * tarifaCompra : 0;
- ingresoInyeccion = ano1 ? ano1.excedenteKwh * tarifaIny : 0;
- Mostrá la sección solo si capexUsd > 0.

La sección tiene tres partes, todo en USD:

1) "Resumen económico" (hero, destacado): 5 tarjetas grandes con
   - Inversión (CAPEX) = capexUsd
   - Ahorro anual (año 1) = eco.ahorroAnualUsd
   - Recupero = eco.paybackAnos (en años, 1 decimal; "—" si es null)
   - TIR (25 años) = eco.tirPct (%, 1 decimal; "—" si es null)
   - VAN (25 años) = eco.vanUsd

2) Gráfico "Flujo de fondos acumulado (25 años)": un área/línea con recharts usando
   eco.proyeccion (eje X = ano, eje Y = flujoAcumuladoUsd), con una línea de
   referencia en y=0. recharts ya está importado en el archivo; agregá los imports
   Area y ReferenceLine. Nota al pie: "El punto donde la curva cruza el cero marca
   el recupero de la inversión."

3) Dos tablas lado a lado:
   - "Ingresos anuales (año 1)": Ahorro por autoconsumo (ingresoAutoconsumo),
     Inyección a la red (ingresoInyeccion), y Total = eco.ahorroAnualUsd.
   - "Costos": Inversión inicial (capexUsd), Mantenimiento anual / OPEX
     (eco.opexAnualUsd), y Flujo neto año 1 = eco.ahorroAnualUsd - eco.opexAnualUsd.

Formato de moneda: "US$ " + número con separador de miles es-AR, sin decimales.
Usá el mismo estilo visual de tarjetas y Cards que ya tiene el componente.
El PDF NO se toca por ahora.
```

---

## Nota

El bloque solo se ve si `capexUsd > 0`, lo que depende de tener la **lista de precios
interna cargada**. Si al correr la app el ahorro/payback dan cero, es porque faltan
precios o consumo del cliente, no un error del reporte.
