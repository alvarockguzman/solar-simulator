# Cómo desplegar el simulador solar

## 1. Google Sheet para los leads

1. Entra a [Google Sheets](https://sheets.google.com) y crea una hoja nueva.
2. En la **primera fila** escribe exactamente estos encabezados (una palabra por columna):
   - `Nombre` | `Apellido` | `Empresa` | `Mail` | `Teléfono` | `Fecha`
3. Guarda la hoja (puedes ponerle nombre, por ejemplo "Leads Simulador Solar").

## 2. Script que escribe en la hoja

1. En esa misma hoja: **Extensiones** → **Apps Script**.
2. Se abre el editor. Borra el código que aparece y **pega todo** el contenido del archivo `google-apps-script/Code.gs` de este proyecto.
3. Guarda el proyecto (Ctrl+S o el icono de disco). Ponle nombre si quieres (por ejemplo "Leads Solar").
4. Arriba donde dice "Seleccionar función": no hace falta ejecutar nada todavía.
5. Clic en **Implementar** → **Nueva implementación**.
6. Donde dice "Seleccionar tipo", elige **Aplicación web**.
7. Configura:
   - **Descripción:** por ejemplo "Recibir leads"
   - **Ejecutar como:** Yo (tu cuenta)
   - **Quién tiene acceso:** Cualquier persona
8. Clic en **Implementar**. Te pedirá autorizar el acceso a tu cuenta (acepta).
9. Copia la **URL de la aplicación web** (algo como `https://script.google.com/macros/s/XXXX.../exec`). Esta URL es tu `LEAD_FORM_URL`.

## 3. Proyecto Next.js en tu PC

1. En la carpeta del proyecto (`Cursor Solarapp`) crea un archivo llamado `.env.local` (junto a `package.json`).
2. Dentro escribe una sola línea (con tu URL real):
   ```
   LEAD_FORM_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
   ```
3. Instala dependencias y prueba en local:
   - Abre terminal en la carpeta del proyecto.
   - Ejecuta: `npm install`
   - Luego: `npm run dev`
   - Abre en el navegador: http://localhost:3000
   - Prueba elegir un perfil y enviar el formulario de "Quiero recibir más información". Debe aparecer una fila nueva en tu Google Sheet.

## 4. Subir a internet con Vercel y tu dominio

1. Crea una cuenta en [Vercel](https://vercel.com) (gratis).
2. Instala Git en tu PC si no lo tienes, y sube el proyecto a **GitHub**:
   - Crea un repositorio nuevo en GitHub (por ejemplo "solar-simulator").
   - En la carpeta del proyecto ejecuta en la terminal:
     - `git init`
     - `git add .`
     - `git commit -m "Primera versión"`
     - Conecta el repo (GitHub te da la URL) y haz `git push`.
3. En Vercel: **Add New** → **Project** → importa el repositorio de GitHub que creaste.
4. En **Environment Variables** agrega:
   - Nombre: `LEAD_FORM_URL`
   - Valor: la misma URL del paso 2 (la de tu Apps Script).
5. Clic en **Deploy**. Vercel te dará una URL tipo `tu-proyecto.vercel.app`.
6. Para usar **tu dominio**:
   - En el proyecto en Vercel: **Settings** → **Domains**.
   - Añade tu dominio (ej. `simulador.tudominio.com`).
   - Vercel te mostrará qué registros DNS configurar (normalmente un CNAME o A). Entra a la web donde gestionas tu dominio y crea ese registro con el valor que indica Vercel.
   - Cuando el DNS se actualice (puede tardar unos minutos), tu sitio estará en tu dominio con HTTPS.

## 5. Dominio único y rutas públicas

Usamos **un solo dominio canónico**: `https://www.renovatio.lat`

| Ruta | Contenido |
|------|-----------|
| `/` | Landing |
| `/calculadora` | Calculadora Solar |
| `/presupuesto` | Presupuesto Indicativo |
| `/cotizador` | Cotizador Solar (interno, protegido con password) |

Las URLs viejas (`/advanced`, `/relevamiento`) redirigen automáticamente a las nuevas. Si alguien entra por `advanced.renovatio.lat`, el middleware lo manda a `www.renovatio.lat/calculadora`.

**En Vercel → Domains:** mantener `www.renovatio.lat` y `renovatio.lat`; **quitar** `advanced.renovatio.lat`. En tu DNS, borrar el CNAME `advanced` si existía.

Detalle completo: ver **`DOMINIOS.md`**.

---

## 6. Si /presupuesto o /calculadora dan 404 en Vercel

Cuando una ruta funciona en `localhost` pero en producción sale **404**:

### A. El deploy no tiene la última versión

1. En **Vercel** → **Deployments**, revisá el commit de Production. ¿Incluye `app/calculadora/` y `app/presupuesto/`?
2. Subí los cambios al branch que usa Vercel (`git push origin main`).
3. Si hace falta, **Redeploy** del último commit correcto.

### B. Directorio raíz del proyecto

En **Settings** → **General** → **Root Directory** debe estar vacío (o `.`).

### C. Build fallando

Si el build falla, Vercel puede seguir sirviendo un deploy viejo sin las rutas nuevas. Revisá el log del último deployment.

### D. Comprobar rutas en el build

Tras un build en verde, deberían abrir:

- `https://www.renovatio.lat/calculadora`
- `https://www.renovatio.lat/presupuesto`

Las rutas antiguas (`/advanced`, `/relevamiento`) deben redirigir con 301.

---

## 7. Cotizador Solar interno (/cotizador)

Herramienta interna del equipo comercial para generar cotizaciones preliminares en PDF.

### Variables de entorno

| Variable | Para qué | Obligatoria |
|----------|----------|-------------|
| `APP_PASSWORD` | Password compartida que protege `/cotizador` y sus APIs | Sí en producción (sin ella la ruta queda abierta) |
| `GOOGLE_SERVICE_ACCOUNT_JSON` | JSON completo del service account (una sola línea) para leer precios y registrar cotizaciones | No (sin ella usa catálogo mock) |
| `PRICING_SHEET_ID` | ID del Google Sheet "Precios Cotizador" (está en la URL del Sheet) | No (junto con la anterior) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob: PDFs, snapshots de techo y **borradores de proyectos** (`/cotizador/proyectos`) | Sí en producción (sin token, proyectos en `data/cotizador-projects/` solo en local) |

### Proyectos guardados

Los borradores del wizard (cliente, techo, polígonos, consumo, ajustes) se persisten en Blob:

- `cotizador/projects/{id}.json` — estado del wizard
- `cotizador/projects/_index.json` — listado para `/cotizador/proyectos`
- `cotizador/snapshots/{id}.jpg` — captura del mapa (si se tomó)

En local sin `BLOB_READ_WRITE_TOKEN`, los mismos datos van a `data/cotizador-projects/` (no usar en Vercel prod).

### Crear el service account de Google (una sola vez)

1. Entrá a [Google Cloud Console](https://console.cloud.google.com) → creá un proyecto (o usá uno existente).
2. **APIs y servicios** → **Biblioteca** → buscá **Google Sheets API** → **Habilitar**.
3. **APIs y servicios** → **Credenciales** → **Crear credenciales** → **Cuenta de servicio**. Nombre: por ejemplo `cotizador-solar`. No hace falta darle roles.
4. Entrá a la cuenta de servicio creada → pestaña **Claves** → **Agregar clave** → **JSON**. Se descarga un archivo `.json`.
5. Abrí el archivo, copiá TODO el contenido en una sola línea y pegalo como valor de `GOOGLE_SERVICE_ACCOUNT_JSON` (en `.env.local` y en Vercel).
6. El JSON tiene un campo `client_email` (algo como `cotizador-solar@proyecto.iam.gserviceaccount.com`). **Compartí el Google Sheet de precios con ese email** (permiso Editor, para que pueda registrar cotizaciones).

### Crear el Google Sheet de precios

1. Creá un Sheet nuevo llamado "Precios Cotizador".
2. Creá 7 pestañas con estos nombres EXACTOS: `Paneles`, `Inversores`, `Estructuras`, `Materiales`, `ManoDeObra`, `Parametros`, `Cotizaciones`.
3. Copiá el contenido de los CSVs de `docs/sheet-template/` en cada pestaña (primera fila = encabezados).
4. El ID del Sheet está en la URL: `https://docs.google.com/spreadsheets/d/ESTE_ES_EL_ID/edit` → ese es `PRICING_SHEET_ID`.
5. El equipo edita precios directamente en el Sheet; la app los relee cada 1 hora (cache).

### Health check

`GET /api/cotizador/health` verifica Sheets, PVGIS, Blob y auth, y devuelve el estado de cada uno. Útil tras cada deploy.

---

## Resumen

- **Leads:** Se guardan en tu Google Sheet; puedes verlos y exportar a Excel/CSV cuando quieras.
- **Variables:** Solo necesitas `LEAD_FORM_URL` en `.env.local` en local y en Vercel como variable de entorno.
- **Dominio:** Se configura en Vercel → Domains y en los DNS de tu proveedor de dominio.
- **Dominios:** Un solo sitio en `www.renovatio.lat`; ver `DOMINIOS.md` para redirecciones y quitar `advanced.renovatio.lat`.
