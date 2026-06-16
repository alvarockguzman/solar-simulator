import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import type { CotizadorProjectDraft } from "@/lib/cotizador/types";
import { normalizeCliente } from "@/lib/cotizador/cliente-utils";
import { projectDraftSchema } from "@/lib/cotizador/projects/schema";
import { draftToSummary, normalizeProjectConsumo } from "@/lib/cotizador/projects/serialize";
import {
  getProject,
  listProjects,
  saveProject,
  storageMode,
  uploadSnapshot,
} from "@/lib/cotizador/projects/store";

export const dynamic = "force-dynamic";

async function buildDraftFromBody(
  body: ReturnType<typeof projectDraftSchema.parse>,
  existing?: CotizadorProjectDraft | null
): Promise<CotizadorProjectDraft> {
  const id = existing?.id ?? body.id ?? randomUUID();
  const now = new Date().toISOString();
  let snapshotUrl = existing?.snapshotUrl ?? null;

  if (body.snapshotDataUrl?.startsWith("data:")) {
    snapshotUrl = await uploadSnapshot(id, body.snapshotDataUrl);
  } else if (body.snapshotDataUrl?.startsWith("http")) {
    snapshotUrl = body.snapshotDataUrl;
  }

  const { snapshotDataUrl: _snap, kwp: _kwp, mwh: _mwh, id: _id, ...rest } = body;

  return {
    step: rest.step,
    proyectoNombre: rest.proyectoNombre,
    cliente: normalizeCliente(rest.cliente),
    techo: { ...rest.techo, kwpDeseado: rest.techo.kwpDeseado ?? null },
    poligonos: rest.poligonos,
    consumo: normalizeProjectConsumo(rest.consumo),
    ajustes: rest.ajustes,
    economicsOverrides: rest.economicsOverrides ?? existing?.economicsOverrides ?? {},
    flowVersion: rest.flowVersion,
    id,
    snapshotUrl,
    vendedor: body.vendedor ?? (body.cliente.contacto || undefined),
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
}

/** Lista proyectos (query ?q= opcional). */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q") ?? undefined;
    const projects = await listProjects(q);
    return NextResponse.json({ projects, storage: storageMode() });
  } catch (err) {
    console.error("GET /api/cotizador/projects:", err);
    return NextResponse.json({ error: "Error al listar proyectos." }, { status: 500 });
  }
}

/** Crea un borrador nuevo. */
export async function POST(request: Request) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = projectDraftSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const draft = await buildDraftFromBody(parsed.data);
    const saved = await saveProject(draft, {
      kwp: parsed.data.kwp,
      mwh: parsed.data.mwh,
    });
    return NextResponse.json({
      project: saved,
      summary: draftToSummary(saved, {
        kwp: parsed.data.kwp,
        mwh: parsed.data.mwh,
      }),
    });
  } catch (err) {
    console.error("POST /api/cotizador/projects:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al crear proyecto." },
      { status: 500 }
    );
  }
}
