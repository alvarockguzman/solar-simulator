# Integración Monday + Google Sheet

**Implementado** en `app/lib/leads/syncLead.ts`: cada lead va primero al Sheet y después a Monday (API v2). Si Monday falla, el lead igual queda en el Sheet y el usuario ve éxito (`mondaySynced: false` en la respuesta API).

Board: [Leads Solar](https://renovatio812485.monday.com/boards/18414300841) — ID `18414300841`

## Variables de entorno

| Variable | Local | Producción (Vercel) |
|----------|-------|---------------------|
| `LEAD_FORM_URL` | `.env.local` | Project → Settings → Environment Variables |
| `MONDAY_API_TOKEN` | `.env.local` | Idem |
| `MONDAY_BOARD_ID` | `.env.local` | Idem |

**Nunca** commitear el token. `.env.local` está en `.gitignore`.

## Column IDs (board Leads Solar)

| Campo app / Sheet | Column ID | Tipo |
|-------------------|-----------|------|
| Nombre del item | `name` | name |
| Empresa | `text_mm3jp15b` | text |
| Email | `email_mm3j9ybp` | email |
| Teléfono | `phone_mm3j1azc` | phone |
| Origen | `color_mm3jqxh8` | status |
| Fecha lead | `date_mm3j3ct6` | date |
| Dirección | `text_mm3jz3qn` | text |
| Latitud | `numeric_mm3j64z1` | numbers |
| Longitud | `numeric_mm3jqttb` | numbers |
| Superficie (m²) | `numeric_mm3jq261` | numbers |
| Tarifa | `color_mm3j9qj3` | status |
| Consumo (kWh/año) | `numeric_mm3jjay5` | numbers |
| Potencia (kWp) | `numeric_mm3j92n4` | numbers |
| Energía (kWh/año) | `numeric_mm3j32nd` | numbers |
| Ahorro (USD/año) | `numeric_mm3j91z0` | numbers |
| Repago (años) | `numeric_mm3jn908` | numbers |
| Inversión (USD) | `numeric_mm3jtpaw` | numbers |
| Estado comercial | `color_mm3j1x9q` | status |

### Status labels (IDs)

**Estado comercial** — default al crear: `Nuevo` → `7`

**Origen** (mapear desde la app):

| App (`origen`) | Monday label | label_id |
|----------------|--------------|----------|
| `básica` | calculadora | 7 |
| `avanzada` | calculadora | 7 |
| (relevamiento futuro) | relevamiento | 19 |

**Tarifa:** T1→6, T2→9, T3→2

## Si funciona en local pero no en Vercel

1. Abrí en el navegador (mismo dominio de producción):
   `https://www.renovatio.lat/api/lead/health`
2. Debe verse algo como:
   ```json
   { "leadFormUrl": true, "mondayConfigured": true, "mondayBoardId": "18414300841" }
   ```
3. Si `mondayConfigured` es **false** → faltan `MONDAY_API_TOKEN` o `MONDAY_BOARD_ID` en **Production**, o hay que **Redeploy** después de agregarlas.
4. Al enviar un lead, en DevTools → Network → `lead/advanced` → si `mondaySynced: false`, mirá `mondayError` en la respuesta JSON.

**Importante:** las variables deben estar marcadas para **Production** (no solo Preview). Sin comillas en el valor. Sin espacios al final del token.
