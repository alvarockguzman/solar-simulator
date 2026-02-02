/**
 * Web App que recibe los datos del formulario de leads (calculadora básica y avanzada)
 * y los escribe en la primera hoja del spreadsheet vinculado.
 *
 * Origen del lead:
 * - "básica": calculadora básica (solo contacto).
 * - "avanzada": calculadora avanzada (contacto + datos del wizard + resultados).
 *
 * Ver CONECTAR_GOOGLE_SHEETS.md en el proyecto para el paso a paso completo.
 */

function doPost(e) {
  try {
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheets()[0];
    const body = e.postData ? JSON.parse(e.postData.contents) : {};

    var nombre = body.nombre || '';
    var apellido = body.apellido || '';
    var empresa = body.empresa || '';
    var mail = body.mail || '';
    var telefono = body.telefono || '';
    var fecha = new Date();
    var origen = body.origen || 'básica';

    if (origen === 'avanzada') {
      sheet.appendRow([
        nombre,
        apellido,
        empresa,
        mail,
        telefono,
        fecha,
        origen,
        body.direccion || '',
        body.lat !== undefined && body.lat !== '' ? body.lat : '',
        body.lng !== undefined && body.lng !== '' ? body.lng : '',
        body.superficie_m2 !== undefined && body.superficie_m2 !== '' ? body.superficie_m2 : '',
        body.tarifa || '',
        body.consumo_kwh_año !== undefined && body.consumo_kwh_año !== '' ? body.consumo_kwh_año : '',
        body.potencia_kwp !== undefined && body.potencia_kwp !== '' ? body.potencia_kwp : '',
        body.energia_kwh_año !== undefined && body.energia_kwh_año !== '' ? body.energia_kwh_año : '',
        body.ahorro_usd_año !== undefined && body.ahorro_usd_año !== '' ? body.ahorro_usd_año : '',
        body.repago_años !== undefined && body.repago_años !== null && body.repago_años !== '' ? body.repago_años : '',
        body.inversion_usd !== undefined && body.inversion_usd !== '' ? body.inversion_usd : ''
      ]);
    } else {
      sheet.appendRow([
        nombre,
        apellido,
        empresa,
        mail,
        telefono,
        fecha,
        origen,
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        '',
        ''
      ]);
    }

    return ContentService
      .createTextOutput(JSON.stringify({ ok: true }))
      .setMimeType(ContentService.MimeType.JSON);
  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ ok: false, error: err.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}
