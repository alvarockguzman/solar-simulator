/**
 * Web App que recibe los datos del formulario de leads y los escribe en la primera hoja
 * del spreadsheet vinculado.
 *
 * Cómo usar:
 * 1. Crea un Google Sheet nuevo.
 * 2. En la primera fila pon los encabezados: Nombre | Apellido | Empresa | Mail | Teléfono | Fecha
 * 3. En el Sheet: Extensiones → Apps Script. Pega este código.
 * 4. Guarda el proyecto (Ctrl+S). Ejecuta doPost una vez (no hará nada sin POST, pero así se crea la versión).
 * 5. Implementar → Nueva implementación → Tipo: Aplicación web.
 *    - Descripción: "Recibir leads"
 *    - Ejecutar como: Yo
 *    - Quién tiene acceso: Cualquier persona
 * 6. Copia la URL de la implementación. Esa URL la pones en .env.local como LEAD_FORM_URL en tu proyecto Next.js.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const body = e.postData ? JSON.parse(e.postData.contents) : {};
    const nombre = body.nombre || '';
    const apellido = body.apellido || '';
    const empresa = body.empresa || '';
    const mail = body.mail || '';
    const telefono = body.telefono || '';
    const fecha = new Date();

    sheet.appendRow([nombre, apellido, empresa, mail, telefono, fecha]);

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
