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

// Cambiá este mail por el que debe recibir los resúmenes de leads.
// Si lo dejás vacío, no se enviarán correos.
var NOTIFICATION_EMAIL = "tu-correo@renovatio.lat";

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

    var rowValues;

    if (origen === 'avanzada') {
      rowValues = [
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
      ];
    } else {
      rowValues = [
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
      ];
    }

    sheet.appendRow(rowValues);

    // Enviar mail resumen si se configuró NOTIFICATION_EMAIL
    if (NOTIFICATION_EMAIL && NOTIFICATION_EMAIL !== "") {
      var asunto = "Nuevo lead Solar - " + (origen === "avanzada" ? "Calculadora Avanzada" : "Calculadora Básica");
      var zonaHoraria = Session.getScriptTimeZone();
      var fechaTexto = Utilities.formatDate(fecha, zonaHoraria, "yyyy-MM-dd HH:mm:ss");

      var lineas = [];
      lineas.push("Nuevo lead recibido desde la web Solar.");
      lineas.push("");
      lineas.push("Datos de contacto:");
      lineas.push("• Nombre: " + (nombre + " " + apellido).trim());
      lineas.push("• Empresa: " + empresa);
      lineas.push("• Mail: " + mail);
      lineas.push("• Teléfono: " + telefono);
      lineas.push("");
      lineas.push("Selección de datos:");

      if (origen === "avanzada") {
        lineas.push("• Origen: Calculadora avanzada");
        lineas.push("• Dirección: " + (body.direccion || ""));
        lineas.push("• Superficie estimada (m²): " + (body.superficie_m2 || ""));
        lineas.push("• Tarifa: " + (body.tarifa || ""));
        lineas.push("• Consumo anual (kWh): " + (body.consumo_kwh_año || ""));
        lineas.push("• Potencia estimada (kWp): " + (body.potencia_kwp || ""));
        lineas.push("• Energía anual (kWh/año): " + (body.energia_kwh_año || ""));
        lineas.push("• Ahorro anual (USD/año): " + (body.ahorro_usd_año || ""));
        lineas.push("• Repago estimado (años): " + (body.repago_años || ""));
        lineas.push("• Inversión estimada (USD): " + (body.inversion_usd || ""));
      } else {
        lineas.push("• Origen: Calculadora básica");
      }

      lineas.push("");
      lineas.push("Día y hora de recepción: " + fechaTexto);

      var cuerpo = lineas.join("\n");

      MailApp.sendEmail({
        to: NOTIFICATION_EMAIL,
        subject: asunto,
        body: cuerpo
      });
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
