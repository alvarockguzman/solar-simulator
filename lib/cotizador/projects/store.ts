import { del, head, put } from "@vercel/blob";
import { promises as fs } from "fs";
import path from "path";
import type { CotizadorProjectDraft, CotizadorProjectSummary } from "../types";
import { draftToSummary } from "./serialize";

const BLOB_PREFIX = "cotizador/projects";
const SNAPSHOT_PREFIX = "cotizador/snapshots";
const LOCAL_DIR = path.join(process.cwd(), "data", "cotizador-projects");
const LOCAL_INDEX = path.join(LOCAL_DIR, "_index.json");

function usesBlob(): boolean {
  const forced = process.env.COTIZADOR_STORAGE?.trim().toLowerCase();
  if (forced === "local") return false;
  if (forced === "blob") return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
  // Fuera de producción usamos disco local: evita cuelgues SSL hacia Vercel Blob en Windows/red corporativa.
  if (process.env.NODE_ENV !== "production") return false;
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

function projectPath(id: string): string {
  return `${BLOB_PREFIX}/${id}.json`;
}

function snapshotPath(id: string): string {
  return `${SNAPSHOT_PREFIX}/${id}.jpg`;
}

function localProjectPath(id: string): string {
  return path.join(LOCAL_DIR, `${id}.json`);
}

function localSnapshotPath(id: string): string {
  return path.join(LOCAL_DIR, "snapshots", `${id}.jpg`);
}

async function readBlobJson<T>(pathname: string): Promise<T | null> {
  try {
    const meta = await head(pathname);
    const res = await fetch(meta.downloadUrl);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

/** Rutas fijas por project id: actualizar borrador requiere sobrescribir en Blob. */
const BLOB_PUT_OVERWRITE = {
  access: "public" as const,
  addRandomSuffix: false,
  allowOverwrite: true,
};

async function writeBlobJson(pathname: string, data: unknown): Promise<void> {
  await put(pathname, JSON.stringify(data, null, 2), {
    ...BLOB_PUT_OVERWRITE,
    contentType: "application/json",
  });
}

async function readLocalIndex(): Promise<CotizadorProjectSummary[]> {
  try {
    const raw = await fs.readFile(LOCAL_INDEX, "utf-8");
    return JSON.parse(raw) as CotizadorProjectSummary[];
  } catch {
    return [];
  }
}

async function writeLocalIndex(index: CotizadorProjectSummary[]): Promise<void> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  const sorted = [...index].sort(
    (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  );
  await fs.writeFile(LOCAL_INDEX, JSON.stringify(sorted, null, 2), "utf-8");
}

async function readLocalProject(id: string): Promise<CotizadorProjectDraft | null> {
  try {
    const raw = await fs.readFile(localProjectPath(id), "utf-8");
    return JSON.parse(raw) as CotizadorProjectDraft;
  } catch {
    return null;
  }
}

async function writeLocalProject(draft: CotizadorProjectDraft): Promise<void> {
  await fs.mkdir(LOCAL_DIR, { recursive: true });
  await fs.writeFile(localProjectPath(draft.id), JSON.stringify(draft, null, 2), "utf-8");
}

/** Sube snapshot data URL a Blob o disco local; devuelve URL pública o ruta relativa. */
export async function uploadSnapshot(
  projectId: string,
  snapshotDataUrl: string
): Promise<string> {
  const match = snapshotDataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (!match) {
    if (snapshotDataUrl.startsWith("http")) return snapshotDataUrl;
    throw new Error("Formato de snapshot inválido.");
  }
  const contentType = match[1];
  const buffer = Buffer.from(match[2], "base64");

  if (usesBlob()) {
    const blob = await put(snapshotPath(projectId), buffer, {
      ...BLOB_PUT_OVERWRITE,
      contentType,
    });
    return blob.url;
  }

  const filePath = localSnapshotPath(projectId);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);
  return `/api/cotizador/projects/${projectId}/snapshot`;
}

export async function listProjects(query?: string): Promise<CotizadorProjectSummary[]> {
  let index: CotizadorProjectSummary[];
  if (usesBlob()) {
    index = (await readBlobJson<CotizadorProjectSummary[]>(`${BLOB_PREFIX}/_index.json`)) ?? [];
  } else {
    index = await readLocalIndex();
  }

  if (!query?.trim()) return index;
  const q = query.trim().toLowerCase();
  return index.filter(
    (p) =>
      p.proyectoNombre.toLowerCase().includes(q) ||
      p.clienteRazonSocial.toLowerCase().includes(q) ||
      p.direccion.toLowerCase().includes(q) ||
      (p.vendedor?.toLowerCase().includes(q) ?? false)
  );
}

export async function getProject(id: string): Promise<CotizadorProjectDraft | null> {
  if (usesBlob()) {
    return readBlobJson<CotizadorProjectDraft>(projectPath(id));
  }
  return readLocalProject(id);
}

async function updateIndex(
  draft: CotizadorProjectDraft,
  metrics?: { kwp?: number; mwh?: number }
): Promise<void> {
  const summary = draftToSummary(draft, metrics);
  let index: CotizadorProjectSummary[];
  if (usesBlob()) {
    index = (await readBlobJson<CotizadorProjectSummary[]>(`${BLOB_PREFIX}/_index.json`)) ?? [];
  } else {
    index = await readLocalIndex();
  }
  const i = index.findIndex((p) => p.id === draft.id);
  if (i >= 0) index[i] = summary;
  else index.unshift(summary);
  index.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

  if (usesBlob()) {
    await writeBlobJson(`${BLOB_PREFIX}/_index.json`, index);
  } else {
    await writeLocalIndex(index);
  }
}

export async function saveProject(
  draft: CotizadorProjectDraft,
  metrics?: { kwp?: number; mwh?: number }
): Promise<CotizadorProjectDraft> {
  const saved = { ...draft, updatedAt: new Date().toISOString() };
  if (usesBlob()) {
    await writeBlobJson(projectPath(saved.id), saved);
  } else {
    await writeLocalProject(saved);
  }
  await updateIndex(saved, metrics);
  return saved;
}

export async function deleteProject(id: string): Promise<boolean> {
  const existing = await getProject(id);
  if (!existing) return false;

  if (usesBlob()) {
    try {
      await del(projectPath(id));
    } catch {
      /* ignore */
    }
    if (existing.snapshotUrl) {
      try {
        await del(existing.snapshotUrl);
      } catch {
        /* ignore */
      }
    }
    const index =
      (await readBlobJson<CotizadorProjectSummary[]>(`${BLOB_PREFIX}/_index.json`)) ?? [];
    await writeBlobJson(
      `${BLOB_PREFIX}/_index.json`,
      index.filter((p) => p.id !== id)
    );
  } else {
    try {
      await fs.unlink(localProjectPath(id));
    } catch {
      /* ignore */
    }
    try {
      await fs.unlink(localSnapshotPath(id));
    } catch {
      /* ignore */
    }
    const index = await readLocalIndex();
    await writeLocalIndex(index.filter((p) => p.id !== id));
  }
  return true;
}

export function storageMode(): "blob" | "local" {
  return usesBlob() ? "blob" : "local";
}

/** Lee snapshot local (solo modo dev sin Blob). */
export async function readLocalSnapshotFile(id: string): Promise<Buffer | null> {
  try {
    return await fs.readFile(localSnapshotPath(id));
  } catch {
    return null;
  }
}
