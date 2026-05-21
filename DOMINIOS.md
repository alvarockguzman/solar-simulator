# Dominios y rutas (opción A)

Un solo dominio canónico: **https://www.renovatio.lat**

## Mapa actual

| URL pública | Contenido |
|-------------|-----------|
| `/` | Landing (Calculadora Solar + Presupuesto Indicativo) |
| `/calculadora` | Calculadora Solar (wizard) |
| `/presupuesto` | Presupuesto Indicativo (inicio) |
| `/presupuesto/wizard` | Formulario presupuesto |
| `/presupuesto/admin` | Panel admin (protegido) |
| `/privacidad`, `/terminos` | Páginas legales |

## Redirecciones automáticas

| Antiguo | Nuevo |
|---------|--------|
| `/advanced` y `/advanced/*` | `/calculadora` |
| `/relevamiento` y `/relevamiento/*` | `/presupuesto` |
| `https://renovatio.lat` (sin www) | `https://www.renovatio.lat` |
| `https://advanced.renovatio.lat` | `https://www.renovatio.lat/calculadora` |

## Vercel (qué configurar)

**Dominios en el proyecto:**

- ✅ `www.renovatio.lat` — principal
- ✅ `renovatio.lat` — redirige a www (middleware + conviene marcar redirect en Vercel)
- ❌ **Quitar** `advanced.renovatio.lat` de Vercel Domains (y borrar CNAME `advanced` en DNS si existe)

**Variables de entorno:** sin cambios (`LEAD_FORM_URL`, `MONDAY_*`, `BLOB_*`).

## ¿Qué significa www vs sin www? (punto 4)

- `renovatio.lat` = dominio “raíz” (apex)
- `www.renovatio.lat` = subdominio www

Mucha gente escribe una u otra forma. Lo habitual es elegir **una canónica** (usamos **www**) y redirigir la otra para que no haya duplicados ni confusiones en Google y en links.

En Vercel: al tener ambos dominios, podés activar “Redirect to www” en el dominio apex. El `middleware.ts` del proyecto refuerza esa redirección.
