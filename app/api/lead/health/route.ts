import { NextResponse } from "next/server";
import { isMondayConfigured } from "@/app/lib/monday/client";

/** Diagnóstico: qué variables están cargadas en el servidor (sin mostrar valores). */
export async function GET() {
  return NextResponse.json({
    leadFormUrl: Boolean(process.env.LEAD_FORM_URL?.trim()),
    mondayConfigured: isMondayConfigured(),
    mondayBoardId: process.env.MONDAY_BOARD_ID?.trim() || null,
  });
}
