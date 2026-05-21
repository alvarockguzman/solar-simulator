import { NextResponse } from "next/server";
import { isMondayConfigured } from "@/app/lib/monday/client";

/** Diagnóstico: qué variables están cargadas en el servidor (sin mostrar valores). */
export async function GET() {
  const mondayToken = Boolean(process.env.MONDAY_API_TOKEN?.trim());
  const mondayBoard = Boolean(process.env.MONDAY_BOARD_ID?.trim());

  return NextResponse.json({
    leadFormUrl: Boolean(process.env.LEAD_FORM_URL?.trim()),
    mondayToken,
    mondayBoard,
    mondayConfigured: isMondayConfigured(),
    mondayBoardId: process.env.MONDAY_BOARD_ID?.trim() || null,
    hint:
      !mondayToken || !mondayBoard
        ? "Faltan variables en Vercel → Settings → Environment Variables → marcar Production → Redeploy. .env.local NO se sube a Vercel."
        : null,
  });
}
