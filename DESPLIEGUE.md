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

## Resumen

- **Leads:** Se guardan en tu Google Sheet; puedes verlos y exportar a Excel/CSV cuando quieras.
- **Variables:** Solo necesitas `LEAD_FORM_URL` en `.env.local` en local y en Vercel como variable de entorno.
- **Dominio:** Se configura en Vercel → Domains y en los DNS de tu proveedor de dominio.
