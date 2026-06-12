import { NextResponse } from "next/server";
import { getCatalog } from "@/lib/cotizador/pricing";

export const dynamic = "force-dynamic";

/** Catálogo completo de precios (para la UI de revisión del cotizador). */
export async function GET() {
  try {
    const catalog = await getCatalog();
    return NextResponse.json(catalog);
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al leer precios." },
      { status: 502 }
    );
  }
}
