# Plan de Desarrollo — Cotizador Solar Automático

**Objetivo:** reemplazar el trabajo manual de Helioscope/PVSYST para cotizaciones preliminares. Input mínimo (coordenadas, techo, consumo, tarifa) → output: PDF con cotización preliminar.

**Decisiones tomadas:**
- Proyecto nuevo (no se modifica Solarapp; se reusa código de mapa/PVGIS como referencia)
- Uso interno: equipo comercial
- Precios de proveedores en Google Sheets
- Área del techo: dibujo manual sobre imagen satelital (arquitectura preparada para IA en v2)

---

## 1. Stack

| Capa | Tecnología | Por qué |
|---|---|---|
| Framework | Next.js 14+ (App Router) + TypeScript | Mismo stack que Solarapp, deploy en Vercel |
| UI | Tailwind + lucide-react | Conocido |
| Mapa | Leaflet + react-leaflet + @turf/area | Ya probado en Solarapp (dibujo de polígono → m²) |
| Irradiación | PVGIS API v5.2/v5.3 (`https://re.jrc.ec.europa.eu/api/v5_2/PVcalc`) | Gratis, sin API key, cubre Argentina/LatAm |
| Geocoding | Nominatim (como Solarapp) o Google Geocoding | Dirección → lat/lon |
| Precios | Google Sheets API (lectura, cache 1 h) | El equipo edita precios sin tocar código |
| PDF | `@react-pdf/renderer` | Serverless-friendly en Vercel, sin Chromium |
| Persistencia | Cotizaciones → Google Sheets (log) + PDF → Vercel Blob | Ya usan ambos; DB real en v2 |
| Auth | Password compartida vía middleware (como Solarapp) | Suficiente para uso interno |

## 2. Flujo de la aplicación (wizard interno)

1. **Cliente:** razón social, contacto, dirección (geocoding → lat/lon, editable manual).
2. **Techo:** imagen satelital, el vendedor dibuja 1..n polígonos → m² brutos. Selecciona tipo de techo (plano / inclinado a un agua / serrucho), orientación (azimut) e inclinación estimada. Factor de aprovechamiento por tipo de techo (default: plano 0.75, inclinado 0.90, serrucho 0.55 — solo aguas bien orientadas). Opcional: distancia panel→tablero (m); si falta, default por tamaño de instalación.
3. **Consumo y tarifa:** kWh/mes (1 valor o 12 meses) y precio medio pagado (USD/kWh, o factura mensual USD → la app deriva el precio). Opcional: % del consumo en horario diurno (default 70% para industria).
4. **Cálculo automático** (motor, sección 3) → pantalla de resultados.
5. **Revisión:** el vendedor puede ajustar panel, inversor, margen, descuento, y ver el BOM recalculado en vivo.
6. **PDF:** genera, guarda en Blob, registra la cotización en Sheets, descarga.

## 3. Motor de cálculo (lib pura, testeable, sin dependencias de UI)

### 3.1 Dimensionamiento
```
area_util        = Σ áreas_polígonos × factor_aprovechamiento
kwp_max_techo    = area_util / area_por_panel × potencia_panel   (panel default del Sheet)
consumo_anual    = Σ kWh mensuales (o kWh_mes × 12)
kwp_objetivo     = consumo_anual × %autoconsumo_objetivo / yield_pvgis
kwp_sistema      = min(kwp_max_techo, kwp_objetivo)
n_paneles        = floor(kwp_sistema / potencia_panel), redondeo a string completo
```
`%autoconsumo_objetivo` es parámetro del Sheet (default 100% si hay net metering en la jurisdicción; si no, dimensionar para no inyectar: cap por consumo diurno).

### 3.2 Producción (PVGIS)
`GET /api/v5_2/PVcalc?lat={}&lon={}&peakpower={kwp}&loss=14&angle={inclinación}&aspect={azimut}&mountingplace=building&outputformat=json`
- Devuelve E_y (kWh/año) y E_m (perfil mensual) → se usan directo, no se aplica yield genérico.
- Nota: PVGIS usa aspect 0 = sur; en hemisferio sur el óptimo es orientación norte → aspect = ±180. Validar con el endpoint `optimalangles=1` para techo plano.
- Route handler propio con cache por (lat,lon,kwp,angle,aspect) para no pegarle a PVGIS en cada render.

### 3.3 BOM (precios desde Google Sheets)
| Ítem | Regla |
|---|---|
| Paneles | n_paneles × precio_panel |
| Inversor(es) | Selección automática: ratio DC/AC entre 1.1 y 1.25, combinando modelos disponibles del Sheet |
| Estructura | por panel, según tipo de techo (coplanar / lastrada / triángulos) |
| Cableado DC+AC | función de distancia_tablero y corriente; si no hay dato, tabla por rango de kWp |
| Protecciones/tablero | tabla por rango de kWp |
| Mano de obra | USD/kWp por rango (economía de escala) |
| Ingeniería y trámites | fijo + % según jurisdicción |
| **Margen** | % parametrizado, ajustable por cotización |

### 3.4 Economics
```
energia_aprovechada = min(producción, consumo) con criterio mensual (perfil E_m vs consumo mensual)
ahorro_anual        = energia_autoconsumida × tarifa + excedente × tarifa_inyección (param, default 0)
flujo_neto          = ahorro_anual − opex   (opex = USD/kWp·año del Sheet)
payback             = capex / flujo_neto
VAN (25 años, tasa descuento param) y TIR simple
degradación panel   = 0.5%/año en proyección a 25 años
CO₂ evitado         = producción × 0.4 kg/kWh (param)
```

## 4. Google Sheets — estructura del libro "Precios Cotizador"

Pestañas (columnas clave):
- **Paneles:** marca, modelo, Wp, dimensiones (m), precio USD, activo
- **Inversores:** marca, modelo, kW AC, rango MPPT, precio USD, activo
- **Estructuras:** tipo_techo, descripción, USD/panel
- **Materiales:** ítem (cable DC, cable AC, protecciones, tablero…), regla (por_metro / por_rango_kwp), valores
- **ManoDeObra:** rango kWp min–max, USD/kWp
- **Parametros:** clave-valor → margen_default, tasa_descuento, opex_usd_kwp, factor_aprovechamiento por techo, tarifa_inyeccion, %autoconsumo_objetivo, perdidas_pvgis, co2_kg_kwh, validez_dias_cotizacion

La app lee con Google Sheets API (service account, solo lectura) y cachea 1 hora. Si el Sheet falla → último cache + warning visible.

## 5. PDF de cotización (contenido)

1. Portada: logo, cliente, fecha, nº cotización, validez
2. Resumen ejecutivo: kWp, producción anual, ahorro anual, inversión, payback (4 números grandes)
3. Imagen satelital con el polígono dibujado
4. Sistema propuesto: paneles, inversor, estructura (sin precios unitarios — precio total cerrado, o detalle según flag `mostrar_detalle`)
5. Gráfico producción mensual vs consumo
6. Economics: tabla 25 años resumida + payback + VAN/TIR + CO₂
7. Supuestos y exclusiones (texto parametrizado)

## 6. Fases de desarrollo

| Fase | Entregable | Depende de |
|---|---|---|
| 0 | Scaffold Next.js + auth + layout | — |
| 1 | Lectura de precios desde Google Sheets + tipos | 0 |
| 2 | Motor de cálculo puro con tests (dimensionamiento, BOM, economics) | 1 |
| 3 | Integración PVGIS (route + cache) | 0 |
| 4 | Wizard: cliente, techo (mapa + polígono), consumo | 0 |
| 5 | Pantalla resultados + revisión/ajustes | 2, 3, 4 |
| 6 | PDF + guardado (Blob + log en Sheets) | 5 |
| 7 | Deploy Vercel + dominio | 6 |

El motor (fase 2) se desarrolla **antes** que la UI de resultados y con tests unitarios contra casos conocidos (validar contra una cotización real hecha con Helioscope/PVSYST — margen de error aceptable ±10%).

## 7. v2 (fuera del MVP)
- Detección automática del techo con IA (segmentación sobre imagen satelital)
- Sombreado (horizonte PVGIS / análisis de obstáculos)
- Multi-moneda y tipo de cambio automático
- Base de datos real + historial/CRM de cotizaciones
- Versión cliente final self-service (reusar motor)
