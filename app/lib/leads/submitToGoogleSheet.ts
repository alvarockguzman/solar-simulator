import { serverFetch } from "../serverFetch";

const LEAD_FORM_URL = process.env.LEAD_FORM_URL;

export async function submitToGoogleSheet(
  payload: Record<string, unknown>
): Promise<
  | { ok: true }
  | { ok: false; error: string; details?: string }
> {
  if (!LEAD_FORM_URL) {
    return { ok: false, error: "LEAD_FORM_URL no configurada" };
  }

  try {
    const res = await serverFetch(LEAD_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      return {
        ok: false,
        error: "Error al enviar al Sheet",
        details: text.slice(0, 200),
      };
    }

    try {
      const data = JSON.parse(text) as { ok?: boolean; error?: string };
      if (data.ok === false) {
        return { ok: false, error: data.error || "Error en Google Sheets" };
      }
    } catch {
      // respuesta no JSON con HTTP 200 → asumir ok
    }

    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    const isTls =
      message.includes("certificate") ||
      message.includes("UNABLE_TO_VERIFY");

    return {
      ok: false,
      error: isTls
        ? "Error de certificado SSL al conectar con Google Sheets (común en Windows en local). Agregá LEAD_SKIP_TLS_VERIFY=true en .env.local y reiniciá npm run dev."
        : `Error de conexión con Google Sheets: ${message}`,
      details: message,
    };
  }
}
