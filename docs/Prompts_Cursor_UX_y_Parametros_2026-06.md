# Prompts para Cursor — UX + Parámetros (junio 2026)

Decisiones de producto que aplican a todos los prompts:

- **La potencia es input manual** (presets pequeño/mediano/grande + valor custom). El techo NO dimensiona: solo valida con semáforo verde/amarillo/rojo si la superficie admite la potencia pedida.
- **Alcance nacional Argentina**: ningún default puede ser específico de una provincia. Todo lo que varía por jurisdicción (tarifas, inyección, temperatura mínima de diseño) va parametrizado en el Sheet/Parametros con default nacional razonable.

Recomendación: un prompt por chat de Cursor, en este orden. Cada prompt es autocontenido.

---

## Prompt 0 — Verificar la duplicación de contenido en las capturas

```
En las capturas full-page generadas por screenshots.spec.ts aparecen secciones duplicadas
(paso Cliente: "Contacto Cliente" y "Representante Comercial" dos veces; paso Equipos: el
grupo ELÉCTRICO dos veces). El código de StepCliente.tsx y StepEquipos.tsx renderiza cada
campo/grupo una sola vez, así que sospecho un artefacto del screenshot full-page de
Playwright con contenedores con overflow-y-auto.

Tarea:
1. Reproducí el problema corriendo el spec de screenshots.
2. Si es artefacto de captura: cambiá el spec para capturar por viewport o con
   locator.screenshot() sobre el contenedor del wizard, sin fullPage sobre contenedores
   con scroll interno.
3. Si la app realmente duplica el DOM: encontrá la causa (doble montaje, hidratación,
   StrictMode) y arreglala.

Criterio de aceptación: capturas nuevas de los pasos 1 y 4 sin contenido repetido, y
verificación manual en el navegador de que el DOM tiene cada sección una sola vez.
```

---

## Prompt 1 — Severidad de warnings + acciones de corrección inline

```
En el wizard del cotizador (app/cotizador/) todos los warnings del engine se muestran como
banners ámbar idénticos (StepEquipos.tsx y StepReporte.tsx). Conviven mensajes de gravedad
muy distinta y ninguno ofrece la acción que lo corrige.

Tarea:
1. Definí severidad por código de warning en un mapa único compartido:
   - error (rojo): sin_inversor, strings_no_cierran
   - warning (ámbar): load_ratio_fuera_rango, pvgis_fallback, supera_techo, precios_stale
   - info (gris/azul, ícono ℹ): potencia_manual, limitado_por_techo, limitado_por_consumo,
     sin_distancia_tablero
2. Acciones inline en el banner:
   - load_ratio_fuera_rango: botón "Usar selección automática" que setea
     ajustes.inversorModelo = null.
   - pvgis_fallback: botón "Reintentar PVGIS" que reintenta el fetch
     (ver useLiveQuote.ts / api/cotizador/pvgis).
   - sin_distancia_tablero: link "Cargar distancia" que vuelve al paso Techo y enfoca el
     campo.
3. En el dropdown "Forzar modelo" de StepEquipos, mostrá el load ratio resultante por
   opción, ej. "GoodWe GW20K-SDT-30 — 20 kW · ratio 1.26 ✓" (✓ si queda en 1.10-1.30).
4. Los warnings tipo info no deben bloquear nada ni alarmarse visualmente.

Criterio de aceptación: en un proyecto de 25.2 kWp con inversor forzado de 30 kW, el banner
de load ratio es ámbar con botón que lo resuelve en un click; "Sistema dimensionado por
potencia indicada" se ve como nota informativa, no como problema.
```

---

## Prompt 2 — Semáforo del techo en 3 estados (verde / amarillo / rojo)

```
Decisión de producto: la potencia del sistema es SIEMPRE un input manual del usuario
(presets pequeño/mediano/grande o valor custom en el paso Cliente). El dibujo del techo no
dimensiona: solo valida. El "Semáforo de viabilidad" de StepTecho.tsx hoy muestra un único
badge verde "Espacio suficiente".

Tarea:
1. Implementá tres estados comparando kwpMaxTecho (capacidad del polígono) vs potencia
   objetivo (techo.kwpDeseado):
   - VERDE: capacidad ≥ potencia × 1.15 (entra con margen)
   - AMARILLO: capacidad ≥ potencia pero < potencia × 1.15 (entra justo: revisar
     obstáculos, sombras, pasillos), o bien no hay polígono dibujado (sin verificar)
   - ROJO: capacidad < potencia (no entra; mostrar cuánto falta en kWp y m²)
2. El estado se propaga: mostralo también en la context bar del wizard (junto a "Área
   útil") y como warning info/warning del engine para que llegue al paso Equipos y al
   reporte (rojo = warning "supera_techo" existente; amarillo = nuevo código
   "techo_justo").
3. Sumá validación de orientación en el mismo card: si el azimut apunta al cuadrante sur
   (90°-270°), mostrar aviso ámbar "Orientación desfavorable en hemisferio sur".
4. No cambies la lógica de sizing: kwpDeseado sigue mandando.

Criterio de aceptación: con potencia 25 kWp y techo de 283 kWp → verde; con potencia
300 kWp en el mismo techo → rojo con el faltante explicitado; sin polígono → amarillo
"sin verificar". El reporte refleja el estado.
```

---

## Prompt 3 — Fuente climática dinámica + mountingplace parametrizado

```
Dos problemas en la integración PVGIS (lib/cotizador/pvgis/client.ts y
engine/production.ts):

A) production.ts hardcodea la etiqueta "PVGIS-SARAH3", pero para Argentina PVGIS responde
   con ERA5 (ver fixture pvcalc-cordoba-100kwp.json: inputs.meteo_data.radiation_db =
   "PVGIS-ERA5"). La fuente debe leerse de la respuesta.

B) buildPvgisParams usa mountingplace="building" fijo. "building" modela módulos poco
   ventilados y castiga ~3-4% la producción anual vs "free". La elección debe depender de
   la estructura.

Tarea:
1. Parseá inputs.meteo_data.radiation_db en parsePvgisResponse, guardalo en PvgisResult
   (ej. radiationDb: string | null) y usalo en production.ts para metrics.fuenteClimatica
   ("PVGIS-ERA5" → mostrar tal cual; fallback → "estimado"). Actualizá los tests con el
   fixture.
2. Agregá a Parametros un mapeo de mountingplace por tipo de techo, con default:
   inclinado (coplanar pegado a chapa) = "building"; plano (lastrada ventilada) = "free";
   serrucho = "free". Claves del Sheet: mounting_inclinado, mounting_plano,
   mounting_serrucho. Pasalo a buildPvgisParams.
3. Mejor fallback: cacheá por proyecto la última respuesta PVGIS exitosa (ya existe
   persistencia de proyectos en data/cotizador-projects) y usala antes que el yield
   genérico de 1400 cuando PVGIS no responde; el warning debe decir qué se usó.

Criterio de aceptación: tests de pvgis.test.ts y production.test.ts en verde; el reporte de
un proyecto argentino muestra "PVGIS-ERA5"; cambiar tipo de techo cambia el mountingplace
del request; con PVGIS caído y cache disponible, se usa el cache y el warning lo indica.
```

---

## Prompt 4 — Reporte en modo fallback: señalización honesta

```
Cuando PVGIS está en fallback, el Reporte (StepReporte.tsx y el PDF en
lib/cotizador/pdf/) muestra: PR "—", columnas POA y Nameplate llenas de "—", y solo un
texto chico "Fuente: estimado". Para un reporte técnico que ve un cliente, la señal es
insuficiente y los guiones parecen bugs.

Tarea:
1. Si pvgis.source === "fallback":
   - Banda visible bajo el título: "PRODUCCIÓN ESTIMADA — datos satelitales no
     disponibles, validar antes de enviar" (estilo warning, no error).
   - Ocultar la card de PR (o mostrar "n/d") y colapsar las columnas POA/Nameplate de la
     tabla mensual.
   - El PDF descargado lleva watermark o sufijo "BORRADOR" en el nombre y la banda en la
     primera página.
2. Card de cobertura del consumo: agregar el dato accionable que ya calcula el engine:
   "Para cubrir el consumo anual se necesitarían ~X kWp" usando
   consumoAnual × autoconsumoObjetivo / yield, y si X > kwpMaxTecho, aclarar "el techo
   admite hasta Y kWp".
3. KPI "KWH/KWP": agregar la unidad completa "kWh/kWp·año" visible (con formato es-AR
   "1.400" se puede leer como 1,4).
4. Gráfico producción vs consumo: si el consumo vino de "Promedio mensual", etiquetar
   "consumo: promedio aplicado a los 12 meses".

Criterio de aceptación: en fallback el reporte no tiene ningún "—" sin explicación y el
PDF sale marcado como borrador; con PVGIS ok, nada de esto aparece.
```

---

## Prompt 5 — Economics: inyección, escalación tarifaria y CO₂ (nivel nacional)

```
Tres parámetros del modelo económico (lib/cotizador/engine/economics.ts y
pricing/parse.ts PARAMETROS_DEFAULT) necesitan ajuste. La herramienta es de alcance
nacional Argentina: defaults nacionales, todo editable por proyecto porque las
distribuidoras provinciales difieren.

Tarea:
1. tarifaInyeccion: el default 0 castiga todo excedente. Bajo la Ley 27.424 (net billing)
   la inyección se paga aproximadamente al precio mayorista/estacional (~0.035-0.040
   USD/kWh a valores 2025-26). Cambiá el default a 0.035 y agregá un campo editable
   "Tarifa de inyección (USD/kWh)" en el paso Consumo (sección avanzada), con hint: "Según
   Ley 27.424; el valor exacto depende de la distribuidora provincial. 0 si el usuario no
   será usuario-generador."
2. Escalación tarifaria: agregá a Parametros escalacionTarifaReal (clave Sheet
   escalacion_tarifa_real, fracción anual, default 0). En computeEconomics, multiplicá la
   tarifa (compra e inyección) por (1+escalación)^(año-1) en la proyección a 25 años.
   Mantener default 0 = comportamiento actual; los tests existentes no deben romperse.
3. co2KgKwh: bajá el default de 0.4 a 0.30 (factor promedio de la red argentina según
   Secretaría de Energía/CAMMESA). Es solo el default; sigue parametrizado por Sheet.
4. Documentá los tres en el comentario de PARAMETROS_DEFAULT con fecha y fuente.

Criterio de aceptación: tests de engine.test.ts en verde (ajustar expectativas de co2 e
inyección); con escalación 0 los números no cambian respecto de hoy; el campo de inyección
aparece en Consumo y viaja al cálculo.
```

---

## Prompt 6 — Voc frío calculado desde temperatura mínima parametrizada

```
En lib/cotizador/engine/inverterSelect.ts, VOC_COLD_FACTOR = 1.15 equivale a asumir célula
a ~-35 °C (con β ≈ -0.25 %/°C). Es excesivo para casi todo el país y regala densidad de
string (con Trina 615, Voc 51.8 V y 1100 V entran 18 módulos; con un factor realista
entran 19).

Tarea:
1. Agregá a Parametros: tminDisenoC (clave Sheet tmin_diseno_c, default -10, °C) — default
   nacional razonable; zonas frías (Patagonia, Puna) lo ajustan por Sheet o por proyecto.
2. Agregá al tipo Panel el coeficiente de temperatura de Voc: betaVocPctC (%/°C, negativo,
   default -0.25 si el catálogo no lo trae; columna nueva opcional en el Sheet de paneles).
3. Reemplazá el factor fijo por: factor = 1 + |betaVoc|/100 × (25 - tminDisenoC).
   Con defaults: 1 + 0.0025×35 = 1.0875.
4. stringSizing recibe el factor (o los parámetros) en lugar de usar la constante; el
   reporte muestra "Voc frío a {tmin}°C" en la línea de strings.
5. Actualizá tests: con Trina 615 + GoodWe 1100 V y tmin -10 °C deben entrar 19 módulos
   por string.

Criterio de aceptación: tests en verde; el BOM técnico del reporte muestra la temperatura
de diseño usada; subir tmin_diseno_c en el Sheet cambia el string sizing sin tocar código.
```

---

## Prompt 7 — Selección de panel "mejor USD/Wp" real

```
En StepEquipos.tsx el dropdown de panel dice "Automático (mejor USD/Wp)", pero
pickPanel() en lib/cotizador/engine/sizing.ts devuelve el PRIMER panel activo del
catálogo. Con el catálogo actual el Jinko 725 (0.166 USD/Wp) es más barato por Wp que el
Trina 615 default (0.175 USD/Wp), así que la etiqueta es falsa.

Tarea:
1. Implementá la selección real: sin modelo forzado, pickPanel devuelve el panel activo
   con menor precioUsd/wp. Empate → mayor wp.
2. Agregá test en engine.test.ts con el catálogo mock verificando que elige el Jinko 725.
3. En el dropdown, mostrá el USD/Wp por opción: "Trina Vertex N 615W — 0.175 USD/Wp".
4. Si el negocio prefiere mantener el Trina como default comercial, alternativa: agregá
   columna "default" al Sheet de paneles y cambiá la etiqueta de la UI a "Recomendado
   (catálogo)". Elegí UNA de las dos opciones y dejá la etiqueta consistente con el
   comportamiento — preguntame antes de implementar cuál.

Criterio de aceptación: la etiqueta del dropdown describe exactamente lo que hace el
código; test que lo fija.
```

---

## Prompt 8 — Mejoras de fricción por pantalla

```
Serie de mejoras menores de UX en app/cotizador/components/. Ninguna cambia lógica de
cálculo.

1. StepCliente.tsx:
   - Mové Latitud/Longitud a un colapsable "Avanzado" (la dirección + pin del mapa son el
     flujo principal).
   - Renombrá la sección de potencia a "Potencia del proyecto *" (es EL input principal:
     presets Pequeño/Mediano/Grande + campo custom, comportamiento actual se mantiene).
2. StepTecho.tsx:
   - La etiqueta "Área útil (× 0.85)" debe mostrar el packing vigente según tipo de techo
     (0.50 plano / 0.85 inclinado / 0.50 serrucho) y actualizarse al cambiar el tipo.
     Agregá el packing como campo numérico editable visible (no solo en Avanzado).
   - El mapa debe ocupar el alto completo de la columna derecha (hoy queda una franja
     negra abajo).
   - Ocultá "Cerrar polígono (0 pts)" y "Deshacer" mientras no haya puntos dibujados.
   - Slider de sombra: agregá 3 presets clickeables (Despejado 2% / Urbano 5% /
     Arbolado 8%) que setean el slider.
3. StepConsumo.tsx:
   - Los USD/kWh de las cards de tarifa deben leerse de TARIFA_NIVELES/catalog, nunca
     texto hardcodeado.
   - "% del consumo en horario diurno": presets (Oficina 80% / Industria 1 turno 70% /
     Industria continua 50%) + tooltip "Es la variable que más afecta el ahorro estimado".
4. StepEquipos.tsx:
   - Mostrá subtotalUsd por línea del checklist y total al pie (los datos ya están en
     BomLinea).
   - Eliminá la redundancia de estado de revisión: dejá el KPI "Revisión X/7" y el footer;
     sacá el banner extra.
   - "Marcar todo OK" → moverlo al final del checklist y achicarlo (que revisar item por
     item sea el camino natural).

Criterio de aceptación: build y tests verdes; revisión visual de los 4 pasos.
```

---

## Prompt 9 — Limpieza de parámetros y catálogo

```
Limpieza final de lib/cotizador/pricing/ y el catálogo:

1. Eliminá el parámetro legacy perdidasPvgis (parse.ts, types.ts, Sheet doc): ya no se usa
   desde que systemLosses calcula el total. Que nadie lo "ajuste" creyendo que hace algo.
2. degradacionAnual: default 0.005 → 0.004 (catálogo 100% n-type, garantía típica
   0.4%/año). Documentar fuente en el comentario.
3. En mock.ts hay specs marcadas ESTIMADO (vocV/vmpV de LONGi Hi-MO X10 645 y Jinko Tiger
   Neo 725; mpptCount de GoodWe 25-60 kW). Listámelas en un TODO.md con el dato exacto a
   buscar en cada datasheet; NO inventes valores. El string sizing depende de vocV, así
   que marcá esos dos paneles con un warning en el reporte si se usan con specs estimadas
   (nuevo código de warning "specs_estimadas").
4. Agregá al Sheet de Parametros (y al parser) un campo informativo tarifas_fecha_fuente
   (texto, ej. "ERSeP 14/2025 + promedios nacionales 09/2025") que se muestre en los
   supuestos del reporte, para que cada cotización declare de cuándo son sus tarifas.

Criterio de aceptación: tests verdes, TODO.md con la lista de datasheets pendientes,
warning visible al cotizar con LONGi o Jinko hasta completar specs.
```

---

## Orden y dependencias

| # | Prompt | Depende de | Riesgo |
|---|---|---|---|
| 0 | Verificar duplicación | — | Bajo (posible no-bug) |
| 1 | Severidad warnings + acciones | — | Bajo |
| 2 | Semáforo 3 estados | 1 (usa severidades) | Medio |
| 3 | Fuente climática + mountingplace | — | Medio (toca request PVGIS) |
| 4 | Reporte fallback honesto | 3 | Bajo |
| 5 | Economics nacional | — | Medio (cambia números) |
| 6 | Voc frío parametrizado | — | Medio (cambia strings) |
| 7 | Mejor USD/Wp | — | Bajo (decisión previa: ¿automático o default comercial?) |
| 8 | Fricción por pantalla | 2 | Bajo |
| 9 | Limpieza parámetros | 5, 6 | Bajo |

Después de 5 y 6, regenerar una cotización de referencia y comparar contra una anterior
para validar que los cambios en los números son los esperados (inyección > 0, strings de
19, CO₂ menor).
