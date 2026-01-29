# Conectar el simulador a Google Sheets

Sigue estos pasos en orden. Al terminar, cada lead que envíe un usuario desde la web aparecerá como una fila en tu hoja.

---

## Paso 1: Crear la hoja

1. Entra a [Google Sheets](https://sheets.google.com) e inicia sesión.
2. **Archivo** → **Nuevo** → **Hoja de cálculo en blanco**.
3. En la **primera fila** escribe exactamente estos encabezados, uno por columna:

   | A      | B        | C       | D     | E        | F     |
   |--------|----------|---------|-------|----------|-------|
   | Nombre | Apellido | Empresa | Mail  | Teléfono | Fecha |

4. (Opcional) Ponle nombre a la hoja, por ejemplo "Leads Simulador Solar".
5. Guarda (Ctrl+S o se guarda solo).

---

## Paso 2: Pegar el script

1. En esa misma hoja: **Extensiones** → **Apps Script**.
2. Se abre el editor. Borra todo el código que aparece por defecto.
3. Abre en tu proyecto la carpeta `google-apps-script` y el archivo **Code.gs**.
4. Copia **todo** el contenido de `Code.gs` y pégalo en el editor de Apps Script.
5. Guarda el proyecto (icono de disco o Ctrl+S). Ponle nombre si quieres, por ejemplo "Leads Solar".

---

## Paso 3: Desplegar como aplicación web

1. En el editor de Apps Script, arriba: **Implementar** → **Nueva implementación**.
2. Donde dice "Seleccionar tipo", haz clic y elige **Aplicación web**.
3. Configura:
   - **Descripción:** por ejemplo "Recibir leads".
   - **Ejecutar como:** **Yo** (tu cuenta).
   - **Quién tiene acceso:** **Cualquier persona**.
4. Clic en **Implementar**.
5. La primera vez te pedirá **Autorizar el acceso**: acepta y elige tu cuenta de Google.
6. Cuando termine, verás la **URL de la aplicación web**. Cópiala (algo como `https://script.google.com/macros/s/XXXX.../exec`). **Esta URL es la que usarás en el siguiente paso.**

---

## Paso 4: Poner la URL en tu proyecto

1. En la carpeta del proyecto (**Cursor Solarapp**), crea un archivo llamado **`.env.local`** (si no existe).
2. Dentro del archivo escribe **una sola línea** (pegando tu URL real):

   ```
   LEAD_FORM_URL=https://script.google.com/macros/s/TU_URL_AQUI/exec
   ```

   Sustituye `TU_URL_AQUI` por la URL completa que copiaste (o pega la URL entera después del `=`).

3. Guarda el archivo.

---

## Paso 5: Reiniciar la app y probar

1. Si tenías la app en marcha (`npm run dev`), **deténla** (Ctrl+C en la terminal) y vuelve a ejecutar:

   ```bash
   npm run dev
   ```

2. Abre en el navegador: http://localhost:3000
3. Elige un perfil, haz clic en **"Quiero recibir más información"**, completa el formulario y envía.
4. Revisa tu Google Sheet: debe aparecer una **nueva fila** con Nombre, Apellido, Empresa, Mail, Teléfono y Fecha.

---

## Si algo falla

Desde la versión actual, el formulario muestra el **mensaje de error real** (por ejemplo "LEAD_FORM_URL no configurada" o "Error al enviar al Sheet"). Usalo para orientarte.

**Checklist rápido en local:**

1. **¿Existe `.env.local`?**  
   Debe estar en la raíz del proyecto (misma carpeta que `package.json`), no dentro de `app` ni de otra subcarpeta.

2. **¿Tiene exactamente esta línea (con tu URL)?**  
   `LEAD_FORM_URL=https://script.google.com/macros/s/XXXX.../exec`  
   Sin comillas, sin espacio antes del `=`, y la URL debe terminar en **`/exec`**.

3. **¿Reiniciaste el servidor después de crear o cambiar `.env.local`?**  
   Cierra la terminal donde corre `npm run dev` (Ctrl+C), vuelve a ejecutar `npm run dev`. Next.js solo lee las variables al arrancar.

4. **¿La URL es la de la implementación de Apps Script?**  
   En el editor de Apps Script: **Implementar** → **Gestionar implementaciones** → copia la URL de la implementación activa (la que termina en `/exec`).

- **"LEAD_FORM_URL no configurada"**  
  El archivo `.env.local` no existe, está en otra carpeta o no tiene la línea `LEAD_FORM_URL=...`. Crealo en la raíz del proyecto y reinicia `npm run dev`.

- **"Error al enviar al Sheet"**  
  Comprueba que la URL en `.env.local` sea exactamente la de la implementación (incluido `/exec` al final) y que en Apps Script hayas elegido **Quién tiene acceso: Cualquier persona**.

- **No aparece la fila en la hoja**  
  Verifica que los encabezados de la primera fila sean: Nombre, Apellido, Empresa, Mail, Teléfono, Fecha (sin tildes ni espacios extra en los nombres de columnas).
