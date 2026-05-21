import { NextResponse } from "next/server";
import { syncLeadToSheetAndMonday } from "@/app/lib/leads/syncLead";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { nombre, apellido, empresa, mail, telefono } = body;

    if (!nombre || !apellido || !empresa || !mail) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios" },
        { status: 400 }
      );
    }

    const result = await syncLeadToSheetAndMonday({
      nombre,
      apellido,
      empresa,
      mail,
      telefono: telefono || "",
      origen: "básica",
    });

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.error +
            ". Revisá LEAD_FORM_URL en .env.local (debe terminar en /exec).",
          details: result.details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      mondaySynced: result.mondaySynced,
      ...(result.mondayError ? { mondayError: result.mondayError } : {}),
    });
  } catch (err) {
    console.error("Lead API error:", err);
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 500 }
    );
  }
}
