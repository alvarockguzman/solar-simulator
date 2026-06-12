# Estado del Cotizador — Reporte de Producción (etapa 1)

> Actualizado tras completar la migración R0–R9. Catálogo de precios: `docs/Lista de Precios - G2E.xlsx` + `docs/g2e-catalog.json`.

## Verificación

- `npm test`: **68 tests** (parseo, motor, PVGIS, TOOLSMANIA, cascada).
- `npm run build`: compila con rutas `/cotizador`, `/api/cotizador/report`, `/api/cotizador/report/pdf`, `/api/cotizador/report/email`.

## Implementado (Plan Reporte de Producción)

| Área | Archivos | Estado |
|------|----------|--------|
| Catálogo técnico G2E | `lib/cotizador/pricing/mock.ts`, `parse.ts`, CSVs | ✓ Trina 615, LONGi 645, Jinko 725; GoodWe + SunGrow trifásicos |
| Pérdidas + load ratio | `engine/losses.ts`, `inverterSelect.ts` | ✓ Multiplicativas, clipping, strings 15–22 |
| PVGIS + GHI | `pvgis/client.ts`, `pvgis/index.ts` | ✓ l_tg/aoi, MRcalc, cache 24 h |
| Métricas reporte | `engine/production.ts` | ✓ PR, cascada, dona, BOM técnico |
| Wizard | `app/cotizador/components/Step*.tsx` | ✓ Proyecto, email, azimut auto, sombra, consumo opcional |
| Vista reporte | `StepReporte.tsx`, `/api/cotizador/report` | ✓ Sin precios en UI |
| PDF 3 páginas | `pdf/ProductionReportPdf.tsx`, `pdf/charts.tsx` | ✓ Descarga vía `/api/cotizador/report/pdf` |
| Mail | `email/sendReportEmail.ts`, Resend | ✓ `/api/cotizador/report/email`, log en `data/sent-log.json` |
| Health | `/api/cotizador/health` | ✓ PVcalc, MRcalc, Resend, mock/Sheets |

## Pendiente etapa 2 (no tocar ahora)

- Economics con precios visibles, `QuotePdf`, propuesta comercial.
- Google Sheet de precios en producción (hoy mock G2E).
- Importador automático desde `Lista de Precios - G2E.xlsx`.

## Checklist manual — caso TOOLSMANIA

Dirección: **Av. La Voz del Interior 6608, Córdoba** (-31.32, -64.21).

1. [ ] Entrar a `/cotizador`, dibujar techo ~260 m² plano, calcular reporte.
2. [ ] Verificar **~29 kWp**, producción **51.2 MWh ±10%**, PR **~82%**, kWh/kWp **~1740**.
3. [ ] Descargar PDF: 3 páginas, métricas + gráficos + cascada + snapshot.
4. [ ] Enviar mail de prueba (requiere `RESEND_API_KEY` + `MAIL_FROM`).
5. [ ] Comparar contra Helioscope del mismo caso.

## Variables de entorno nuevas

| Variable | Uso |
|----------|-----|
| `RESEND_API_KEY` | Envío de reportes por mail |
| `MAIL_FROM` | Remitente (dominio verificado en Resend) |
| `MAIL_BCC_INTERNO` | Copia interna opcional |

Las demás (`APP_PASSWORD`, `BLOB_*`, Sheets) siguen igual que en `DESPLIEGUE.md`.
