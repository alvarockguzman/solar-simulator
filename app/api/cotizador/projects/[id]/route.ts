import { NextResponse } from "next/server";
import type { CotizadorProjectDraft } from "@/lib/cotizador/types";
import { normalizeCliente } from "@/lib/cotizador/cliente-utils";
import { projectPatchSchema } from "@/lib/cotizador/projects/schema";
import { draftToSummary, normalizeProjectConsumo } from "@/lib/cotizador/projects/serialize";
import {
  deleteProject,
  getProject,
  saveProject,
  uploadSnapshot,
} from "@/lib/cotizador/projects/store";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

async function mergeDraft(
  existing: CotizadorProjectDraft,
  patch: ReturnType<typeof projectPatchSchema.parse>
): Promise<CotizadorProjectDraft> {
  const now = new Date().toISOString();
  let snapshotUrl = existing.snapshotUrl ?? null;

  if (patch.snapshotDataUrl?.startsWith("data:")) {
    snapshotUrl = await uploadSnapshot(existing.id, patch.snapshotDataUrl);
  } else if (patch.snapshotDataUrl?.startsWith("http")) {
    snapshotUrl = patch.snapshotDataUrl;
  }

  const { snapshotDataUrl: _s, kwp: _k, mwh: _m, id: _i, ...rest } = patch;

  return {
    ...existing,
    ...rest,
    cliente: patch.cliente
      ? normalizeCliente({ ...existing.cliente, ...patch.cliente })
      : existing.cliente,
    techo: patch.techo
      ? {
          ...existing.techo,
          ...patch.techo,
          kwpDeseado: patch.techo.kwpDeseado ?? existing.techo.kwpDeseado ?? null,
        }
      : existing.techo,
    consumo: patch.consumo
      ? normalizeProjectConsumo({ ...existing.consumo, ...patch.consumo })
      : existing.consumo,
    ajustes: patch.ajustes ? { ...existing.ajustes, ...patch.ajustes } : existing.ajustes,
    poligonos: patch.poligonos ?? existing.poligonos,
    snapshotUrl,
    updatedAt: now,
  };
}

/** Carga un borrador completo. */
export async function GET(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const project = await getProject(id);
    if (!project) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ project });
  } catch (err) {
    console.error("GET /api/cotizador/projects/[id]:", err);
    return NextResponse.json({ error: "Error al cargar proyecto." }, { status: 500 });
  }
}

/** Actualiza un borrador (replace parcial). */
export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  const parsed = projectPatchSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos inválidos.", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const merged = await mergeDraft(existing, parsed.data);
    const saved = await saveProject(merged, {
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
    console.error("PATCH /api/cotizador/projects/[id]:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al guardar proyecto." },
      { status: 500 }
    );
  }
}

/** Elimina un proyecto. */
export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const ok = await deleteProject(id);
    if (!ok) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("DELETE /api/cotizador/projects/[id]:", err);
    return NextResponse.json({ error: "Error al eliminar proyecto." }, { status: 500 });
  }
}

/** POST en [id] = duplicar proyecto con nuevo UUID. */
export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  try {
    const existing = await getProject(id);
    if (!existing) {
      return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
    }

    const { randomUUID } = await import("crypto");
    const { promises: fs } = await import("fs");
    const path = await import("path");
    const newId = randomUUID();
    const now = new Date().toISOString();
    let snapshotUrl = existing.snapshotUrl ?? null;

    if (existing.snapshotUrl) {
      if (process.env.BLOB_READ_WRITE_TOKEN) {
        try {
          const res = await fetch(existing.snapshotUrl);
          if (res.ok) {
            const buf = Buffer.from(await res.arrayBuffer());
            const { put } = await import("@vercel/blob");
            const blob = await put(`cotizador/snapshots/${newId}.jpg`, buf, {
              access: "public",
              contentType: res.headers.get("content-type") ?? "image/jpeg",
              addRandomSuffix: false,
              allowOverwrite: true,
            });
            snapshotUrl = blob.url;
          }
        } catch {
          snapshotUrl = null;
        }
      } else {
        try {
          const localPath = path.join(
            process.cwd(),
            "data",
            "cotizador-projects",
            "snapshots",
            `${id}.jpg`
          );
          const buf = await fs.readFile(localPath);
          const dest = path.join(
            process.cwd(),
            "data",
            "cotizador-projects",
            "snapshots",
            `${newId}.jpg`
          );
          await fs.mkdir(path.dirname(dest), { recursive: true });
          await fs.writeFile(dest, buf);
          snapshotUrl = `/api/cotizador/projects/${newId}/snapshot`;
        } catch {
          snapshotUrl = null;
        }
      }
    }

    const copy: CotizadorProjectDraft = {
      ...existing,
      id: newId,
      proyectoNombre: `${existing.proyectoNombre} (copia)`.slice(0, 120),
      snapshotUrl,
      createdAt: now,
      updatedAt: now,
    };
    const saved = await saveProject(copy);
    return NextResponse.json({
      project: saved,
      summary: draftToSummary(saved),
    });
  } catch (err) {
    console.error("POST /api/cotizador/projects/[id]:", err);
    return NextResponse.json({ error: "Error al duplicar proyecto." }, { status: 500 });
  }
}
