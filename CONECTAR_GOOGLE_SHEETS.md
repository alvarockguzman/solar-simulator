# Conectar el simulador a Google Sheets (paso a paso)

Sigue estos pasos en orden. Al terminar, los leads de la **calculadora básica** y de la **calculadora avanzada** se guardarán en la misma hoja, con una columna **Origen** que indica de dónde vino cada uno. Los leads avanzados incluyen además todos los datos del wizard y los resultados.

---

## Paso 1: Crear o abrir la hoja

1. Entra a [Google Sheets](https://sheets.google.com) e inicia sesión.
2. **Archivo** → **Nuevo** → **Hoja de cálculo en blanco** (o abre una hoja existente).
3. En la **primera fila** escribe exactamente estos encabezados, **uno por columna**, en este orden:

   | A | B | C | D | E | F | G | H | I | J | K | L | M | N | O | P | Q | R |
   |---|----|----|-----|----------|------|--------|----------|-----|-----|--------------|-------|-----------------|-------------|-----------------|-----------------|-------------|--------------|
   | Nombre | Apellido | Empresa | Mail | Teléfono | Fecha | Origen | Dirección | Lat | Lng | Superficie_m2 | Tarifa | Consumo_kWh_año | Potencia_kWp | Energía_kWh_año | Ahorro_USD_año | Repago_años | Inversión_USD |

   **Importante:** La columna **G** debe llamarse exactamente **Origen** (sin tilde). Las columnas H a R se rellenan solo cuando el lead viene de la calculadora avanzada.

4. (Opcional) Ponle nombre a la hoja, por ejemplo "Leads Simulador Solar".
5. Guarda (Ctrl+S o se guarda solo).

---

## Paso 2: Abrir Apps Script y pegar el código

1. En esa misma hoja de cálculo: menú **Extensiones** → **Apps Script**.
2. Se abre el editor de Apps Script. **Borra todo** el código que aparece por defecto (por ejemplo `function myFunction() { }`).
3. En tu proyecto (Cursor Solarapp), abre la carpeta **google-apps-script** y el archivo **Code.gs**.
4. **Copia todo** el contenido de `Code.gs` (desde `/**` hasta la última `}`).
5. **Pega** ese contenido en el editor de Apps Script (reemplazando lo que había).
6. Guarda el proyecto: icono de disco o **Ctrl+S**. Opcional: arriba donde dice "Sin título", ponle nombre al proyecto, por ejemplo "Leads Solar".

---

## Paso 3: Desplegar como aplicación web

1. En el editor de Apps Script, arriba a la derecha: **Implementar** → **Nueva implementación**.
2. Donde dice "Seleccionar tipo", haz clic en el engranaje y elige **Aplicación web**.
3. Configura:
   - **Descripción:** por ejemplo "Recibir leads".
   - **Ejecutar como:** **Yo** (tu cuenta de Google).
   - **Quién tiene acceso:** **Cualquier persona** (necesario para que tu app Next.js pueda llamar al script).
4. Clic en **Implementar**.
5. La primera vez te pedirá **Autorizar la aplicación**: acepta, elige tu cuenta de Google y permite los permisos (acceso a la hoja de cálculo).
6. Cuando termine, verás un cuadro con la **URL de la aplicación web**. Algo como:
   ```
   https://script.google.com/macros/s/AKfycbz...XXXX.../exec
   ```
7. **Copia esa URL completa** (debe terminar en **/exec**). La vas a usar en el Paso 4.

---

## Paso 4: Poner la URL en tu proyecto Next.js

1. En la carpeta raíz del proyecto (**Cursor Solarapp**), abre o crea el archivo **`.env.local`** (al lado de `package.json`).
2. Escribe **una sola línea** (pegando tu URL real, sin comillas):

   ```
   LEAD_FORM_URL=https://script.google.com/macros/s/TU_URL_COMPLETA_AQUI/exec
   ```

   Reemplaza `TU_URL_COMPLETA_AQUI` por la URL que copiaste en el Paso 3, o pega la URL entera después del `=`.

3. Guarda el archivo.

---

## Paso 5: Reiniciar la app y probar

1. Si tenías la app corriendo (`npm run dev`), **deténla** (Ctrl+C en la terminal).
2. Vuelve a ejecutar:

   ```bash
   npm run dev
   ```

   Next.js solo lee `.env.local` al arrancar, por eso hay que reiniciar.

3. **Probar calculadora básica:**
   - Abre http://localhost:3000
   - Elige un perfil, haz clic en **"Quiero recibir más información"**, completa el formulario y envía.
   - En la hoja debe aparecer una fila nueva con Nombre, Apellido, Empresa, Mail, Teléfono, Fecha y **Origen** = "básica". Las columnas H a R quedarán vacías.

4. **Probar calculadora avanzada:**
   - Abre http://localhost:3000/advanced
   - Completa los 4 pasos (dirección, superficie, tarifa, consumo), llega a resultados y haz clic en **"Solicitar presupuesto"**.
   - Completa el formulario (Nombre, Apellido, Empresa, Mail, Teléfono) y envía.
   - En la hoja debe aparecer una fila nueva con **Origen** = "avanzada" y las columnas **Dirección, Lat, Lng, Superficie_m2, Tarifa, Consumo_kWh_año, Potencia_kWp, Energía_kWh_año, Ahorro_USD_año, Repago_años, Inversión_USD** rellenadas con lo que eligió el usuario y los resultados calculados.

---

## Si no te trae los datos (avanzada)

- **Revisa la primera fila de la hoja:** Debe tener exactamente los 18 encabezados en el orden indicado en el Paso 1. Si falta "Origen" o alguna columna, el script puede fallar o escribir en la columna equivocada.
- **Actualiza la implementación:** Después de cambiar el código en Apps Script, ve a **Implementar** → **Gestionar implementaciones** → los tres puntos de la implementación activa → **Editar** → **Versión**: "Nueva versión" → **Implementar**. Así la URL que usa tu app apunta al código nuevo.
- **Misma URL para básica y avanzada:** Tanto `/api/lead` como `/api/lead/advanced` envían los datos a la **misma** `LEAD_FORM_URL`. El script distingue por el campo **origen** ("básica" o "avanzada") y escribe en las columnas correspondientes.

---

## Checklist rápido

- [ ] Hoja con 18 columnas en la fila 1: Nombre, Apellido, Empresa, Mail, Teléfono, Fecha, Origen, Dirección, Lat, Lng, Superficie_m2, Tarifa, Consumo_kWh_año, Potencia_kWp, Energía_kWh_año, Ahorro_USD_año, Repago_años, Inversión_USD
- [ ] Código de `Code.gs` pegado en Apps Script y guardado
- [ ] Implementación tipo "Aplicación web", "Ejecutar como: Yo", "Quién tiene acceso: Cualquier persona"
- [ ] URL de la implementación (termina en `/exec`) copiada en `.env.local` como `LEAD_FORM_URL=...`
- [ ] Reiniciado `npm run dev` después de tocar `.env.local`
