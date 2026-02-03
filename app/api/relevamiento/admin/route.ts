import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";
import type { RelevamientoItem } from "../route";

const DATA_PATH = path.join(process.cwd(), "data", "relevamientos.json");
const ADMIN_COOKIE = "relevamiento_admin";

async function readData(): Promise<RelevamientoItem[]> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeData(data: RelevamientoItem[]) {
  await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
  await fs.writeFile(DATA_PATH, JSON.stringify(data, null, 2), "utf-8");
}

function getTokenFromRequest(request: Request): string | null {
  const auth = request.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  return null;
}

export async function POST(request: Request) {
  const body = await request.json();
  const { user, password } = body;
  const adminUser = process.env.ADMIN_USER;
  const adminPass = process.env.ADMIN_PASS;

  if (!adminUser || !adminPass) {
    return NextResponse.json({ error: "Admin no configurado" }, { status: 500 });
  }
  if (user !== adminUser || password !== adminPass) {
    return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 });
  }

  const token = `admin-${Buffer.from(`${user}:${Date.now()}`).toString("base64")}`;
  const cookieStore = await cookies();
  cookieStore.set(ADMIN_COOKIE, token, { httpOnly: true, path: "/", maxAge: 60 * 60 * 24 * 7 });
  return NextResponse.json({ ok: true });
}

async function isAuthenticated(request: Request): Promise<boolean> {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value;
  const header = getTokenFromRequest(request);
  const token = header ?? cookie;
  if (!token) return false;
  return token.startsWith("admin-");
}

export async function GET() {
  const cookieStore = await cookies();
  const cookie = cookieStore.get(ADMIN_COOKIE)?.value;
  if (!cookie?.startsWith("admin-")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  return NextResponse.json({ ok: true });
}

export async function PATCH(request: Request) {
  if (!(await isAuthenticated(request))) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, estado, notas } = body;
    if (!id) {
      return NextResponse.json({ error: "Falta id" }, { status: 400 });
    }

    const data = await readData();
    const idx = data.findIndex((r) => r.id === id);
    if (idx === -1) {
      return NextResponse.json({ error: "Relevamiento no encontrado" }, { status: 404 });
    }

    if (estado !== undefined) data[idx].estado = estado;
    if (notas !== undefined) data[idx].notasAdmin = notas;
    await writeData(data);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("PATCH admin:", err);
    return NextResponse.json({ error: "Error al actualizar" }, { status: 500 });
  }
}
