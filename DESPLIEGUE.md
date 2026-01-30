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

## 5. Subdominio para la Calculadora Avanzada (advanced.renovatio.lat)

Si querés que la calculadora avanzada tenga su propio link (por ejemplo `https://advanced.renovatio.lat`), hacé lo siguiente.

### En Vercel

1. Entrá a tu **proyecto** en [Vercel](https://vercel.com).
2. **Settings** → **Domains**.
3. Clic en **Add** y escribí el subdominio: `advanced.renovatio.lat`.
4. Vercel te va a indicar qué registro DNS crear:
   - Si usa **CNAME**: el nombre suele ser `advanced` y el valor algo como `cname.vercel-dns.com` (o el dominio que te muestre Vercel).
   - Si usa **A**: te dará una IP; creá un registro A con nombre `advanced` apuntando a esa IP.
5. Guardá el dominio. Vercel validará el DNS; puede tardar unos minutos (o hasta 48 h en casos raros).
6. Cuando el dominio figure como **Valid**, las visitas a `https://advanced.renovatio.lat` irán al **mismo deploy** del proyecto y, por la configuración en `next.config.js`, se mostrará la calculadora avanzada (ruta `/advanced`).

### En el proveedor de DNS (donde tenés renovatio.lat)

1. Entrá al panel donde gestionás el dominio `renovatio.lat`.
2. Buscá la sección de **DNS** (registros CNAME, A, etc.).
3. Creá el registro que Vercel te indicó:
   - **Tipo:** CNAME (o A si Vercel lo pide).
   - **Nombre / Host:** `advanced` (así el subdominio queda `advanced.renovatio.lat`).
   - **Valor / Apunta a:** el que te dé Vercel (ej. `cname.vercel-dns.com` para CNAME).
4. Guardá los cambios y esperá a que Vercel marque el dominio como válido.

### Cómo funciona

En `next.config.js` hay un **rewrite** que dice: “Si la petición llega con el host `advanced.renovatio.lat`, serví el contenido de `/advanced`”. Por eso:

- `https://renovatio.lat` → calculadora básica (y `/advanced` sigue siendo `https://renovatio.lat/advanced`).
- `https://advanced.renovatio.lat` → mismo proyecto, pero se muestra directamente la calculadora avanzada.

No hace falta otro proyecto ni otro repo; es el mismo deploy con dos formas de entrar.

---

## Resumen

- **Leads:** Se guardan en tu Google Sheet; puedes verlos y exportar a Excel/CSV cuando quieras.
- **Variables:** Solo necesitas `LEAD_FORM_URL` en `.env.local` en local y en Vercel como variable de entorno.
- **Dominio:** Se configura en Vercel → Domains y en los DNS de tu proveedor de dominio.
- **Subdominio avanzada:** Agregar `advanced.renovatio.lat` en Vercel → Domains y crear el CNAME (o A) en tu DNS; el rewrite en `next.config.js` hace el resto.
