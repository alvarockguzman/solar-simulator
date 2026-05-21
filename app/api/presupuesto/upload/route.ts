import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

function sanitizeFileName(name: string): string {
  return name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 100) || "file";
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    if (!file) {
      return NextResponse.json({ error: "No file" }, { status: 400 });
    }

    const token = process.env.BLOB_READ_WRITE_TOKEN;
    if (!token) {
      return NextResponse.json(
        {
          error: "BLOB_READ_WRITE_TOKEN no configurado. Crea un Blob store en Vercel y añade el token (o usa vercel env pull en local).",
        },
        { status: 503 }
      );
    }

    const safeName = sanitizeFileName(file.name);
    const path = `relevamiento/${Date.now()}-${safeName}`;
    const blob = await put(path, file, { access: "public" });
    return NextResponse.json({ url: blob.url });
  } catch (err) {
    console.error("Upload relevamiento:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Error al subir archivo" },
      { status: 500 }
    );
  }
}
