import { NextResponse } from "next/server";
import { syncLeadToSheetAndMonday } from "@/app/lib/leads/syncLead";

export async function POST(request: Request) {
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

    const result = await syncLeadToSheetAndMonday(payload);

    if (!result.ok) {
      return NextResponse.json(
        {
          error:
            result.error +
            ". Revisá LEAD_FORM_URL y que el Google Apps Script acepte los campos avanzados.",
          details: result.details,
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      ok: true,
      mondaySynced: result.mondaySynced,
    });
  } catch (err) {
    console.error("Lead advanced API error:", err);
    return NextResponse.json(
      { error: "Error de conexión" },
      { status: 500 }
    );
  }
}
