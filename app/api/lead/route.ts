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
    const { nombre, apellido, empresa, mail, telefono } = body;

    if (!nombre || !apellido || !empresa || !mail) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const res = await fetch(LEAD_FORM_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombre,
        apellido,
        empresa,
        mail,
        telefono: telefono || "",
      }),
    });

    const text = await res.text();

    if (!res.ok) {
      return NextResponse.json(
        {
          error:
            "Error al enviar al Sheet. Revisá que LEAD_FORM_URL en .env.local sea correcta y termine en /exec.",
          details: text.slice(0, 200),
        },
        { status: 502 }
      );
    }

    let data: { ok?: boolean; error?: string } = {};
    try {
      data = JSON.parse(text);
    } catch {
      // respuesta no es JSON, asumir ok si el status era 200
    }
    if (data.ok === false) {
      return NextResponse.json(
        { error: data.error || "Error en Google Sheets" },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 500 }
    );
  }
}
