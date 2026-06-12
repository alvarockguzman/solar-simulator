# Prompts para Cursor — Cotizador Solar

Usar en orden. Cada prompt asume que el anterior está terminado y commiteado. Antes del prompt 0, copiá `Plan_Cotizador_Solar.md` a la raíz del repo nuevo: los prompts lo referencian como contexto.

> Tip: en Cursor, tené abierto `Plan_Cotizador_Solar.md` y los archivos relevantes al pedir cada fase. Si algo sale mal, pedí "revisá contra el plan en Plan_Cotizador_Solar.md" antes de aceptar.

---

## Prompt 0 — Scaffold

```
Creá un proyecto Next.js 14 (App Router) con TypeScript y Tailwind llamado "cotizador-solar". Es una herramienta INTERNA para que el equipo comercial cotice sistemas solares. Leé Plan_Cotizador_Solar.md para el contexto completo.

Requisitos:
1. Estructura: app/(wizard)/cotizar/ para el flujo, app/api/ para routes, lib/ para lógica pura, lib/types.ts para tipos compartidos.
2. Auth simple: middleware que pide una password compartida (env APP_PASSWORD), cookie de sesión, página /login. Todo lo demás protegido.
3. Layout base: header con logo placeholder, contenedor centrado, dark-friendly no necesario.
4. .env.example documentando todas las variables que iremos agregando.
5. README corto con cómo correr en local.

No agregues todavía mapa, PVGIS ni Sheets. Solo el esqueleto compilando con `npm run dev`.
```

## Prompt 1 — Precios desde Google Sheets

```
Implementá la capa de precios leyendo de Google Sheets, según la sección 4 de Plan_Cotizador_Solar.md.

1. lib/types.ts: tipos Panel, Inversor, Estructura, Material, RangoManoDeObra, Parametros (ver pestañas y columnas en el plan).
2. lib/pricing/sheets.ts: lectura con googleapis (service account, env GOOGLE_SERVICE_ACCOUNT_JSON y PRICING_SHEET_ID), una función por pestaña, parseo y validación con zod. Filas con activo=false se descartan.
3. Cache en memoria de 1 hora con revalidación; si el fetch falla, devolver último cache y flag `stale: true`.
4. app/api/pricing/route.ts: GET que devuelve el catálogo completo (para la UI de revisión).
5. lib/pricing/mock.ts: catálogo hardcodeado realista (3 paneles ~550-620Wp, 4 inversores 10-110kW, estructuras para techo plano/inclinado/serrucho, mano de obra por rangos) usado cuando no hay credenciales, para desarrollo local.
6. Test simple de parseo con datos mock.

Generá también un CSV por pestaña en /docs/sheet-template/ para que yo pueda crear el Google Sheet copiando y pegando.
```

## Prompt 2 — Motor de cálculo (núcleo, con tests)

```
Implementá el motor de cálculo como librería pura en lib/engine/, sin imports de React ni de Next. Seguí EXACTAMENTE las fórmulas de la sección 3 de Plan_Cotizador_Solar.md.

Módulos:
1. lib/engine/sizing.ts — dimensionamiento: área útil (polígonos × factor por tipo de techo) → kwp_max_techo; consumo anual → kwp_objetivo; kwp_sistema = min(); n_paneles redondeado a string completo según el panel elegido.
2. lib/engine/bom.ts — genera el BOM completo: paneles, selección automática de inversor(es) con ratio DC/AC entre 1.1 y 1.25 (combinando modelos del catálogo, minimizando costo), estructura por panel según techo, cableado en función de distancia al tablero (o tabla por rango de kWp si falta el dato), protecciones, mano de obra por rango, ingeniería, margen %. Output: líneas {item, cantidad, unitario, subtotal} + capex total.
3. lib/engine/economics.ts — autoconsumo mensual (min(producción_mes, consumo_mes)), ahorro anual, opex, payback, VAN a 25 años con tasa parametrizada, TIR (Newton simple), degradación 0.5%/año, CO₂.
4. lib/engine/index.ts — función `quote(input: QuoteInput, catalog: Catalog, pvgis: PvgisResult): QuoteResult` que orquesta todo.

Tests con vitest:
- Caso de referencia: techo plano 1100 m² útiles, consumo 350.000 kWh/año, tarifa 0.117 USD/kWh, yield 1459 kWh/kWp → debe dar ~150 kWp, capex en el orden de 112.500 USD a 750 USD/kWp y payback ~4.7 años (tolerancia ±10%). Datos de data/economics.csv del proyecto anterior.
- Casos borde: techo chico que limita, consumo chico que limita, distancia tablero faltante, inversor único vs múltiple.
```

## Prompt 3 — Integración PVGIS

```
Implementá la integración con PVGIS según la sección 3.2 de Plan_Cotizador_Solar.md.

1. lib/pvgis/client.ts: llamada a https://re.jrc.ec.europa.eu/api/v5_2/PVcalc con lat, lon, peakpower, loss=14, angle, aspect, mountingplace=building, outputformat=json. Tipar la respuesta (E_y anual, E_m mensual, H(i)_y). Timeout 10s y manejo de error tipado.
2. OJO hemisferio sur: PVGIS usa aspect=0 para sur. Para Argentina la orientación óptima es norte (aspect=180 o -180). Para techo plano, llamar con optimalangles=1 y usar el ángulo/aspecto óptimos que devuelve PVGIS. Para techo inclinado/serrucho, usar el azimut e inclinación que cargó el usuario, convirtiendo de la convención "azimut desde el norte" de la UI a la convención PVGIS. Documentá la conversión con comentarios y tests.
3. app/api/pvgis/route.ts: POST proxy con cache (clave: lat,lon redondeados a 4 decimales + kwp + angle + aspect; unstable_cache o Map en memoria, TTL 24h).
4. Fallback: si PVGIS no responde, devolver yield default 1400 kWh/kWp·año con perfil mensual plano estacionalizado, y flag `source: "fallback"` que la UI y el PDF deben mostrar como advertencia.
5. Test de la conversión de azimut y del parseo con una respuesta JSON real de PVGIS guardada como fixture (generala llamando a la API para lat=-31.4, lon=-64.2, peakpower=100).
```

## Prompt 4 — Wizard de carga

```
Implementá el wizard de carga en app/(wizard)/cotizar/ según la sección 2 de Plan_Cotizador_Solar.md. Estado global con Context + reducer, navegación entre pasos con validación.

Paso 1 — Cliente: razón social, contacto, email, dirección con geocoding (Nominatim, debounce, resultados seleccionables) → lat/lon editables a mano.

Paso 2 — Techo: mapa Leaflet con tile satelital (Esri World Imagery), centrado en lat/lon. Dibujo de 1..n polígonos con react-leaflet (click para vértices, doble click cierra), área con @turf/area, lista de polígonos con eliminar. Selector tipo de techo (plano/inclinado/serrucho) con factor de aprovechamiento visible y editable. Si inclinado/serrucho: inputs azimut (0-360 desde el norte) e inclinación (grados). Input opcional distancia al tablero (m). Botón "capturar imagen" que guarda un snapshot del mapa con el polígono (leaflet-image o html2canvas) para usar en el PDF.

Paso 3 — Consumo: toggle entre "promedio mensual" (1 input) y "12 meses" (12 inputs). Tarifa: USD/kWh directo, o factura mensual USD → calcula el precio implícito. Input opcional % consumo diurno (default 70%).

Al completar: POST a /api/quote (lo creamos en el próximo prompt); por ahora dejá un console.log del QuoteInput armado. Todos los pasos con valores por default sensatos para poder probar rápido.
```

## Prompt 5 — Resultados y revisión

```
Implementá el cálculo end-to-end y la pantalla de resultados/revisión.

1. app/api/quote/route.ts: POST que recibe QuoteInput, obtiene catálogo (pricing), llama a PVGIS y ejecuta quote() del engine. Devuelve QuoteResult completo.
2. Paso 4 del wizard — Resultados: 4 métricas grandes (kWp, producción anual, ahorro anual, payback), gráfico de barras producción mensual vs consumo (recharts), tabla BOM con subtotales y total.
3. Panel de revisión (el corazón de la herramienta interna): el vendedor puede cambiar panel (select del catálogo), forzar modelo de inversor, ajustar margen % y descuento %, editar líneas del BOM (cantidad/precio unitario) y agregar líneas manuales. Cada cambio recalcula en vivo (el engine corre client-side con el catálogo ya cargado; PVGIS solo se rellama si cambia kWp >5%).
4. Mostrar advertencias: PVGIS fallback, precios stale, kWp limitado por techo vs consumo.
5. Botón "Generar cotización" deshabilitado hasta que no haya errores.
```

## Prompt 6 — PDF y guardado

```
Implementá la generación del PDF y el guardado, según la sección 5 de Plan_Cotizador_Solar.md.

1. lib/pdf/QuotePdf.tsx con @react-pdf/renderer: portada (logo env/asset, cliente, fecha, nº cotización AAAA-NNN, validez desde Parametros), resumen ejecutivo con los 4 números, imagen del techo (snapshot del paso 2), sistema propuesto (flag mostrar_detalle: true = tabla BOM, false = precio cerrado), gráfico mensual (renderizar como SVG estático), tabla economics resumida (años 1, 5, 10, 15, 20, 25 + payback + VAN + TIR + CO₂), página de supuestos y exclusiones (texto desde Parametros del Sheet).
2. app/api/quote/pdf/route.ts: POST que renderiza el PDF server-side, lo sube a Vercel Blob (env BLOB_READ_WRITE_TOKEN) y devuelve la URL.
3. Registrar cada cotización en una pestaña "Cotizaciones" del mismo Google Sheet: fecha, nº, cliente, kWp, capex, payback, URL del PDF, vendedor.
4. Numeración: contador en la pestaña Cotizaciones (leer última fila + 1).
5. En la UI: botón genera → spinner → link de descarga + copia al portapapeles.
```

## Prompt 7 — Deploy

```
Prepará el deploy a Vercel: verificá que el build pasa sin warnings, documentá en DESPLIEGUE.md todas las env vars (APP_PASSWORD, GOOGLE_SERVICE_ACCOUNT_JSON, PRICING_SHEET_ID, BLOB_READ_WRITE_TOKEN), los pasos para crear el service account de Google y compartirle el Sheet, y la config del dominio. Agregá un health check en /api/health que verifique acceso a Sheets y a PVGIS y devuelva el estado de cada uno.
```

---

## Orden de validación manual entre prompts

- Tras prompt 2: correr `npx vitest` — el caso de referencia debe pasar.
- Tras prompt 3: llamar /api/pvgis con coordenadas reales de un cliente y comparar E_y con lo que da la web de PVGIS.
- Tras prompt 5: cotizar un caso real ya cotizado a mano con Helioscope/PVSYST y comparar (objetivo: ±10% en producción y capex).
- Tras prompt 6: revisar el PDF con el equipo comercial antes de deploy.
