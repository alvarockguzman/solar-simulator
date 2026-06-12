# Prompts para Cursor — Reporte de Producción (v2: migración sobre la versión existente)

**Reemplaza la versión anterior de este archivo.** Cursor ya construyó una primera versión del cotizador dentro del repo de Renovatio (`app/cotizador`, `lib/cotizador`) siguiendo Plan_Cotizador_Solar.md. **Decisión: NO borrar.** Se reusa wizard, mapa, auth, cliente PVGIS (la conversión de azimut ya está bien resuelta y testeada), pricing y la infra de PDF. Estos prompts refactorizan esa base para que la salida principal sea el **Reporte de Producción** (Plan_Reporte_Produccion.md); precios y economics quedan en el código pero pasan a segundo plano hasta la etapa 2.

**Contexto fijo:**
- La app vive en el repo del sitio Renovatio, bajo la ruta `/cotizador` (prod: www.renovatio.lat/cotizador). Por ahora solo localhost — no agregar nada de deploy hasta el último prompt.
- Convención existente de tipos de techo: `plano` (= losa), `inclinado` (= chapa coplanar), `serrucho`. **Mantenerla** — no renombrar.
- Antes del prompt R0: copiar `Plan_Reporte_Produccion.md` a `docs/` del repo (junto al Plan_Cotizador_Solar.md que ya está).

Usar en orden, commiteando entre prompts.

---

## Prompt R0 — Auditoría y puesta a punto

```
Leé docs/Plan_Reporte_Produccion.md: es la nueva spec principal. El objetivo cambió: la salida #1 de /cotizador ya no es una cotización con precios sino un REPORTE DE PRODUCCIÓN (réplica de Helioscope, secciones 1, 4, 5 y 7 del plan). Los precios/economics existentes quedan, pero no se muestran en esta etapa.

1. Corré npx vitest y npm run build; arreglá lo que esté roto antes de tocar nada.
2. Hacé un resumen en docs/ESTADO.md: qué módulos de lib/cotizador existen, qué cubren del nuevo plan y qué falta (pérdidas parametrizadas, MRcalc/GHI, métricas PR y kWh/kWp, tabla cascada, selección de inversor por load ratio, catálogo técnico, PDF de producción, envío por mail).
3. No refactorices todavía. Solo diagnóstico + fixes de build/tests.
```

## Prompt R1 — Catálogo técnico (specs, no solo precios)

```
Extendé el catálogo para que sirva al reporte de producción, según la sección 6 de docs/Plan_Reporte_Produccion.md. El catálogo actual (lib/cotizador/types.ts + pricing/) es de precios; faltan specs técnicas.

1. Extendé Panel con: vocV, vmpV, bifacial. Extendé Inversor con: vdcMaxV, mpptCount, eficienciaEuro (fracción, ej 0.982), trifasico. Todos opcionales en el Sheet con defaults sensatos en el parser (Voc≈0.085×Wp como aproximación si falta, eficienciaEuro 0.98).
2. Actualizá lib/cotizador/pricing/mock.ts con el catálogo curado real de G2E:
   - Paneles: Trina 615Wp bifacial N (default, 2.38×1.13m, Voc≈52V, 0.1749 USD/W), LONGI 645Wp N-Type (0.1914 USD/W), Jinko 725Wp bifacial (0.166 USD/W)
   - Inversores GOODWE trifásicos: 10/15/20/25/30/40/50/60 kW (precios de la lista G2E: 25kW=1113, 30kW=1228, 40kW=1461, 50kW=1635, 60kW=2422 USD; eficienciaEuro 0.98, vdcMax 1100V)
   - Inversores SunGrow trifásicos: 75kW=3824, 110kW=5067, 250kW=9942, 333kW=12237 USD (eficienciaEuro 0.985)
   Buscá datasheets reales para Voc/Vmp/dimensiones; lo que no encuentres marcalo "ESTIMADO".
3. Agregá a Parametros los defaults de pérdidas y layout (sección 5 del plan): sombraPct 3, soilingPct 2.5, mismatchPct 2, dcWiringPct 1, acPct 0.5, packing por tipo de techo (plano 0.50 — reemplaza al combo factor×separación actual si da equivalente, inclinado 0.85, serrucho 0.50), tiltDefault (inclinado 8°, serrucho 20°), curva de clipping [(1.10, 0.001), (1.15, 0.001), (1.25, 0.005), (1.35, 0.015)]. Parser + mock + zod.
4. Actualizá los CSV template de docs/sheet-template/ con las columnas nuevas.
5. Tests de parseo actualizados en verde.
```

## Prompt R2 — Pérdidas, inversor por load ratio y strings

```
Implementá el corazón del nuevo motor según la sección 5 de docs/Plan_Reporte_Produccion.md.

1. lib/cotizador/engine/losses.ts (nuevo):
   - clippingLoss(loadRatio): interpolación lineal sobre la curva de Parametros; 0 por debajo del primer punto.
   - systemLosses(parametros, inversor, loadRatio): devuelve cada pérdida (sombra, soiling, mismatch, dcWiring, clipping, inversor = 1−eficienciaEuro, ac) y el total MULTIPLICATIVO: 1 − Π(1−li). Ese total reemplaza a parametros.perdidasPvgis como parámetro loss de PVGIS.
2. lib/cotizador/engine/inverterSelect.ts (nuevo):
   - selectInverter(kwpDc, inversores): menor costo total con load ratio entre 1.10 y 1.30; permitir N unidades iguales (ej. 2×50kW); devuelve {unidades: [{inversor, cantidad}], kwAcTotal, loadRatio}. Si nada cae en rango, el más cercano con warning.
   - stringSizing(nPaneles, panel, inversor): módulos por string 15–22 con Voc×N×1.15 < vdcMaxV; devuelve {nStrings, modulesPerString} o warning si no cierra.
3. Integrá ambos en computeSizing/quote: el inversor del BOM sale de selectInverter (no del precio solamente), y el loss de PVGIS sale de systemLosses. El flujo existente de cotización debe seguir compilando y pasando tests.
4. Tests: 29.43 kWp → Goodwe 25kW, ratio 1.18; pérdida total con defaults entre 10% y 11%; clipping(1.18)≈0.2%; strings de 54 paneles Voc 52V con 1100V válidos; load ratio fuera de rango genera warning.
```

## Prompt R3 — PVGIS completo: pérdidas internas, GHI y óptimos

```
Completá lib/cotizador/pvgis/ según la sección 4 de docs/Plan_Reporte_Produccion.md. El cliente PVcalc y la conversión de azimut ya existen y están bien — no los rompas.

1. Parseá también de PVcalc: totals.fixed.l_aoi, l_spec, l_tg, l_total (pérdidas que PVGIS modela: reflexión, espectral, temperatura+irradiancia) y, cuando se use optimalangles=1, inputs.mounting_system.fixed.slope.value y azimuth.value. Sumalos a PvgisResult.
2. mrcalc({lat, lon}): nuevo método contra https://re.jrc.ec.europa.eu/api/v5_2/MRcalc con horirrad=1, outputformat=json. Promediar los años → GHI mensual (12 valores) y anual. Fixture real de Córdoba para el test.
3. Para techo plano: llamar PVcalc con optimalangles=1 y usar el tilt/azimut óptimos devueltos (mostrarlos en el resultado). Para inclinado/serrucho: angle/aspect del usuario como hasta ahora.
4. En /api/cotizador/pvgis (o un wrapper nuevo getProductionData): PVcalc y MRcalc en paralelo, cache 24h por clave redondeada, y el fallback existente extendido con GHI estimado (flag source:"fallback" visible).
5. Tests de parseo con los fixtures; el de integración real queda como script manual (scripts/pvgis-check.ts).
```

## Prompt R4 — Métricas derivadas del reporte

```
Implementá lib/cotizador/engine/production.ts según las secciones 5 y 7 de docs/Plan_Reporte_Produccion.md: transforma (pvgis + ghi + sizing + losses) en los datos exactos del Reporte de Producción.

deriveProductionReport(input): devuelve ProductionReportData con:
1. Métricas: kwpDc, kwAcTotal, loadRatio, energiaAnualMwh, kwhPorKwp = E_y/kwpDc, pr = E_y/(H(i)_y × kwpDc), fuenteClimatica ("PVGIS-SARAH3" o "estimado" si fallback).
2. Tabla mensual: mes, ghiKwhM2, poaKwhM2 (H(i)_m), nameplateKwh (= H(i)_m × kwpDc), energiaRedKwh (E_m).
3. Tabla cascada anual con % delta por etapa: Nameplate (H(i)_y×kwpDc) → −l_tg PVGIS (temp+irradiancia) → −sombra → −soiling → −mismatch → −cableado DC → −clipping → −inversor → −AC → Energía a red. La última fila debe cuadrar con E_y de PVGIS (ajustar la fila AC por redondeo si hace falta, nunca más de 0.5%).
4. Datos de la dona de pérdidas: las mismas pérdidas de la cascada con sus % (una sola fuente de verdad).
5. BOM técnico (sin precios): paneles (marca, modelo, cantidad), inversores (modelo × cantidad), estructura según tipo de techo, strings (nStrings × modulesPerString).
6. Supuestos usados (lista de {nombre, valor} para la página 3 del PDF).

Tests: caso TOOLSMANIA con fixture PVGIS realista (H(i)_y≈2110, l_tg≈−4.7) → 51.2 MWh ±10%, PR 78–86%, kWh/kWp 1600–1850; la cascada cierra contra E_y; nameplate mensual consistente.
```

## Prompt R5 — Ajustes del wizard

```
Ajustá el wizard de app/cotizador para el flujo de reporte de producción (sección 2 de docs/Plan_Reporte_Produccion.md). Cambios mínimos, sin rediseñar lo que funciona:

1. StepCliente: agregá "email del destinatario" (para el envío del reporte) y "nombre del proyecto".
2. StepTecho:
   - Azimut automático: al cerrar el polígono, calcular la orientación del lado más largo y normalizarla al cuadrante norte (0–90° o 270–360°); precargar el campo azimut con ese valor, editable, con indicación visual simple (flecha sobre el mapa o brújula).
   - Slider "% de sombra del sitio" (0–8, default de Parametros) con ayuda: "estimalo mirando obstáculos en la foto satelital".
   - Para techo plano: mostrar "inclinación y orientación óptimas según PVGIS" como nota (se resuelven en el cálculo), sin pedir azimut.
   - Packing/factor visible en modo avanzado colapsable.
3. StepConsumo: hacelo OPCIONAL con un toggle "tengo datos de consumo" — el reporte de producción no lo necesita; si se carga, se usa para el cap de dimensionamiento y para el gráfico producción vs consumo. Sin datos: dimensionar solo por techo.
4. StepResultados pasa a llamarse StepReporte y por ahora muestra lo que ya mostraba + placeholder "reporte completo" (se reemplaza en R6).
5. El estado del wizard guarda el snapshot del mapa con el polígono (ya hay html2canvas como dependencia) para el PDF.
```

## Prompt R6 — Vista Reporte de Producción

```
Reemplazá el contenido de StepReporte por la vista completa del Reporte de Producción, espejo del PDF (sección 7 de docs/Plan_Reporte_Produccion.md). Server: un endpoint /api/cotizador/report que orquesta pvgis+engine y devuelve ProductionReportData.

Layout en pantalla:
1. Fila de métricas: kWp DC, kW AC, load ratio, MWh/año, PR, kWh/kWp.
2. Gráfico de barras producción mensual (recharts, ya está instalado); si hay consumo cargado, superponer línea de consumo mensual.
3. Dona de pérdidas (PieChart) con leyenda y %.
4. Tabla mensual (GHI, POA, nameplate, energía a red).
5. Tabla cascada anual con columna % delta.
6. BOM técnico (sin precios) + field segment (tilt, azimut, n módulos, packing).
7. Imagen del techo con polígono.
8. Advertencias visibles: PVGIS fallback, load ratio fuera de 1.10–1.30, strings que no cierran.
9. Botones: "Descargar PDF" y "Enviar por mail" (placeholders), "Volver a editar" conservando estado.

En el paso de revisión previa (o en esta misma vista, colapsable): selects para cambiar panel e inversor del catálogo → recalcula. Los precios NO se muestran en ninguna parte de esta vista.
```

## Prompt R7 — PDF del Reporte de Producción

```
Creá lib/cotizador/pdf/ProductionReportPdf.tsx con @react-pdf/renderer (ya instalado; QuotePdf.tsx queda intacto para la etapa 2). 3 páginas según la sección 7 de docs/Plan_Reporte_Produccion.md, tomando el PDF de Helioscope como referencia de contenido pero con diseño propio limpio y branding Renovatio (logo de /public, tipografía y colores del sitio).

1. Página 1: encabezado (proyecto, cliente, fecha, dirección, lat/lon) | grilla de métricas | gráfico mensual y dona como SVG estáticos generados por funciones propias en lib/cotizador/pdf/charts.tsx (geometría simple, sin recharts).
2. Página 2: tabla mensual | tabla cascada con % delta | BOM técnico.
3. Página 3: snapshot del techo | field segment | supuestos en lenguaje claro (cada pérdida con su valor, % sombra declarado, packing, fuente climática) + "Reporte preliminar generado automáticamente. Sujeto a verificación en visita técnica."
4. Pie en todas las páginas: Renovatio · www.renovatio.lat · Reporte de Producción N° {AAAA-NNN} · página X/3. Numeración: contador simple en data/report-counter.json por ahora.
5. /api/cotizador/report/pdf: POST → renderToBuffer → attachment "Reporte de Produccion - {cliente}.pdf". Conectar el botón de descarga con estado de carga.
6. Probalo con datos del caso TOOLSMANIA y con strings largos (overflow).
```

## Prompt R8 — Envío por mail

```
Implementá el envío del reporte por mail con Resend.

1. npm i resend. Envs: RESEND_API_KEY, MAIL_FROM, MAIL_BCC_INTERNO (opcional). Si falta la key, el botón muestra "Envío de mail no configurado" sin romper.
2. /api/cotizador/report/email: POST {reportData, to, mensaje?} → genera el PDF (reusar R7), adjunta y envía. Asunto: "Reporte de Producción Solar — {proyecto}". Cuerpo HTML sobrio con branding Renovatio: saludo, 3 métricas (kWp, MWh/año, kWh/kWp), mensaje opcional del vendedor, firma. BCC interno si está configurado.
3. Modal en la vista del reporte: destinatario precargado del paso Cliente, mensaje opcional, estados enviando/OK/error con retry, validación de email.
4. Log mínimo de envíos en data/sent-log.json (fecha, proyecto, destinatario, kWp, MWh).
```

## Prompt R9 — Cierre de etapa

```
1. npm run build y npx vitest en verde, sin warnings nuevos.
2. Extendé /api/cotizador/health: estado de PVGIS (PVcalc y MRcalc), pricing (sheet o mock), Resend configurado o no.
3. Actualizá docs/ESTADO.md: qué quedó implementado de docs/Plan_Reporte_Produccion.md y qué quedó para la etapa 2 (economics con precios, propuesta comercial, Sheets de precios si seguimos en mock, importador G2E).
4. Checklist manual en docs/ESTADO.md para cuando se pueda probar: caso TOOLSMANIA end-to-end (dibujar el techo de Av. La Voz del Interior 6608, Córdoba) → comparar contra Helioscope: 51.2 MWh ±10%, PR ~82%, kWh/kWp ~1740; PDF de 3 páginas sin overflow; mail de prueba con adjunto.
```

---

## Notas

- **Validación clave (post R4 y post R6):** el caso TOOLSMANIA es el test de aceptación de toda la etapa. Si la producción anual no cae en ±10% de 51.2 MWh, revisar primero el % de sombra y el loss total pasado a PVGIS antes de tocar el motor.
- **Etapa 2 (no tocar ahora):** economics con precios (bom.ts y economics.ts ya existen), QuotePdf, Google Sheets de precios en producción, importador de la lista G2E, propuesta comercial.
- Deploy: la app ya vive en el repo del sitio → cuando se deploya el sitio, /cotizador sale con él. Recordar cargar las envs nuevas en Vercel antes del deploy (R9 lista cuáles).
