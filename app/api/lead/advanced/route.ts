import { NextResponse } from "next/server";

const LEAD_FORM_URL = process.env.LEAD_FORM_URL;

export async function POST(request: Request) {
  if (!LEAD_FORM_URL) {
    return NextResponse.json(
      { error: "LEAD_FORM_URL no configurada" },
      { status: 500 }
    );
  }

  try {
    const body = await request.json();
    const { source, contact, wizard, results } = body;

    if (source !== "advanced") {
      return NextResponse.json(
        { error: "Payload debe tener source: 'advanced'" },
        { status: 400 }
      );
    }

    const { nombre, apellido, empresa, mail, telefono } = contact || {};
    if (!nombre || !apellido || !empresa || !mail) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios de contacto" },
        { status: 400 }
      );
    }

    const payload: Record<string, unknown> = {
      nombre,
      apellido,
      empresa,
      mail,
      telefono: telefono || "",
      origen: "avanzada",
    };

    if (wizard) {
      payload.direccion = wizard.address ?? "";
      payload.lat = wizard.coordinates?.lat ?? "";
      payload.lng = wizard.coordinates?.lng ?? "";
      payload.superficie_m2 = wizard.surfaceM2 ?? "";
      payload.tarifa = wizard.tariff ?? "";
      payload.consumo_kwh_año = wizard.consumptionKwhPerYear ?? "";
    }

    if (results) {
      payload.potencia_kwp = results.powerKwp ?? "";
      payload.energia_kwh_año = results.energyKwhPerYear ?? "";
      payload.ahorro_usd_año = results.savingsUsdPerYear ?? "";
      payload.repago_años = results.paybackYears ?? "";
      payload.inversion_usd = results.investmentUsd ?? "";
    }

    const res = await fetch(LEAD_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Error al enviar. Revisá LEAD_FORM_URL y que el Google Apps Script acepte los campos avanzados.",
          details: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    let data: { ok?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      // no JSON
    }
    if (data.ok === false) {
      return NextResponse.json(
        { error: data.error || "Error en el backend de leads" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead advanced API error:", err);
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 500 }
    );
  }
}
