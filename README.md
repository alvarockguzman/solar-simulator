# Simulador Solar – MVP

Herramienta web para captar leads comerciales/industriales mostrando el beneficio económico de paneles solares. El usuario elige uno de tres perfiles de instalación, ve los economics y puede dejar sus datos para recibir más información. Los leads se guardan en Google Sheets.

## Qué incluye

- **Intro:** Explicación de la calculadora y qué puede esperar el usuario.
- **Perfiles:** Tres opciones (techo plano mediana/grande, techo serrucho mediana) con ícono y descripción.
- **Economics:** Energía producida (kWh), ahorro (USD), recupero de inversión (años), potencia instalada (kWp) según el perfil elegido.
- **Formulario de lead:** Nombre, apellido, empresa, mail (obligatorios) y teléfono (opcional). Los datos se envían a una API que los escribe en Google Sheets mediante un script de Google Apps Script.

## Cómo correr el proyecto en local

1. Instalar dependencias: `npm install`
2. Crear `.env.local` con `LEAD_FORM_URL` (URL del Web App de Google Apps Script). Ver `.env.example`.
3. Ejecutar: `npm run dev`
4. Abrir en el navegador: http://localhost:3000

## Despliegue y dominio

Instrucciones paso a paso en [DESPLIEGUE.md](DESPLIEGUE.md): configuración del Google Sheet, script de Apps Script, variables de entorno y despliegue en Vercel con dominio propio.
