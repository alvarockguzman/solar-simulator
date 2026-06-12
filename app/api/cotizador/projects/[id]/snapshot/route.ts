import { NextResponse } from "next/server";
import { readLocalSnapshotFile } from "@/lib/cotizador/projects/store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

/** Sirve snapshot en modo local (sin Blob). */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  const buf = await readLocalSnapshotFile(id);
  if (!buf) {
    return NextResponse.json({ error: "Snapshot no encontrado." }, { status: 404 });
  }
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      "Content-Type": "image/jpeg",
      "Cache-Control": "private, max-age=3600",
    },
  });
}
