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

    const { nombre, apellido, empresa, cuit, mail, telefono } = contact || {};
    if (!nombre || !apellido || !empresa || !mail) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios de contacto" },
        { status: 400 }
      );
    }

    const payload = {
      source: "advanced",
      nombre,
      apellido,
      empresa,
      cuit: cuit || "",
      mail,
      telefono: telefono || "",
      ...(wizard && {
        address: wizard.address,
        lat: wizard.coordinates?.lat,
        lng: wizard.coordinates?.lng,
        surfaceM2: wizard.surfaceM2,
        tariff: wizard.tariff,
        consumptionKwhPerYear: wizard.consumptionKwhPerYear,
      }),
      ...(results && {
        powerKwp: results.powerKwp,
        energyKwhPerYear: results.energyKwhPerYear,
        savingsUsdPerYear: results.savingsUsdPerYear,
        paybackYears: results.paybackYears,
        investmentUsd: results.investmentUsd,
      }),
    };

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
