# Simulador Solar – MVP

Herramienta web para captar leads comerciales/industriales mostrando el beneficio económico de paneles solares. El usuario elige uno de tres perfiles de instalación, ve los economics y puede dejar sus datos para recibir más información. Los leads se guardan en Google Sheets.

## Qué incluye

- **Intro:** Explicación de la calculadora y qué puede esperar el usuario.
- **Perfiles:** Tres opciones (techo plano mediana/grande, techo serrucho mediana) con ícono y descripción.
- **Economics:** Energía producida (kWh), ahorro (USD), recupero de inversión (años), potencia instalada (kWp) según el perfil elegido.
- **Formulario de lead:** Nombre, apellido, empresa, mail (obligatorios) y teléfono (opcional). Los datos se envían a una API que los escribe en Google Sheets mediante un script de Google Apps Script.
- **Cotizador interno (`/cotizador`):** herramienta para que el equipo comercial genere cotizaciones preliminares en PDF: dibujo del techo sobre imagen satelital, producción con PVGIS, BOM con precios desde Google Sheets, revisión/ajustes y PDF guardado en Vercel Blob. Protegida con password compartida (`APP_PASSWORD`). Specs en `docs/Plan_Cotizador_Solar.md`; setup en `DESPLIEGUE.md` (sección 7).

## Tests

`npm test` corre la suite de vitest del cotizador (parseo de precios, motor de cálculo con caso de referencia y conversión/parseo de PVGIS).

## Cómo correr el proyecto en local

1. Instalar dependencias: `npm install`
2. Crear `.env.local` con `LEAD_FORM_URL` (URL del Web App de Google Apps Script). Ver `.env.example`.
3. Ejecutar: `npm run dev`
4. Abrir en el navegador: http://localhost:3000

## Multi-marca

La calculadora vive dos veces en la misma app. `/calculadora` es Renovatio y `/calculadora/nexo` es Nexo Energía. Los pasos, las cuentas y las APIs son los mismos. Cambia la marca.

`app/lib/brands.ts` define cada marca: nombre, contacto, WhatsApp, colores en hex (para mapas y gráficos) y el `origen` del lead (`avanzada` en Renovatio, `nexo` en Nexo). `app/lib/BrandContext.tsx` expone esa config con `useBrand()`. El layout de cada ruta envuelve la página en su `BrandProvider`.

Los colores de la interfaz no están fijos en los componentes. `app/globals.css` declara variables `--brand-*` en RGB. `:root` usa los tonos que ya tenía Renovatio. `[data-brand="nexo"]` los reemplaza por la paleta de Nexo. Tailwind los lee como `brand-accent`, `brand-primary`, `brand-ink` y el resto. El layout de Nexo pone `data-brand="nexo"` en su contenedor, así que solo esa ruta cambia.

Un lead de Nexo sale con `brand: "nexo"` y `origen: "nexo"`. Monday recibe la etiqueta **Nexo** en la columna Origen (`create_labels_if_missing` la crea si el tablero no la tiene). La hoja de Google escribe `nexo` en la columna Origen y el resto de las columnas del wizard. Si más adelante Nexo tiene su propia hoja o su propio tablero, se definen `NEXO_LEAD_FORM_URL` y `NEXO_MONDAY_BOARD_ID`. Si no están, se usan `LEAD_FORM_URL` y `MONDAY_BOARD_ID`. El script de `google-apps-script/Code.gs` tiene que estar republicado para que un origen `nexo` guarde las columnas del wizard.

Para sumar una tercera marca: agregar el id en `BrandId`, un objeto en `brands`, un layout con `BrandProvider` y `data-brand`, y los valores de esas variables CSS bajo `[data-brand="nueva"]`. Los componentes que ya leen `useBrand()` y las clases `brand-*` la toman sin copiar el wizard.

## Despliegue y dominio

Instrucciones paso a paso en [DESPLIEGUE.md](DESPLIEGUE.md): configuración del Google Sheet, script de Apps Script, variables de entorno y despliegue en Vercel con dominio propio.
