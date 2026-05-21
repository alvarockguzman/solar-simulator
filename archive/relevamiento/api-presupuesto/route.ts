import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { promises as fs } from "fs";
import path from "path";

const ADMIN_COOKIE = "relevamiento_admin";

const DATA_PATH = path.join(process.cwd(), "data", "relevamientos.json");

export type RelevamientoEstado = "Pendiente" | "En Revisión" | "Presupuestado";

export interface RelevamientoItem {
  id: string;
  fecha: string;
  estado: RelevamientoEstado;
  address: string;
  polygon: [number, number][];
  center: { lat: number; lng: number };
  surfaceM2: number;
  city: string | null;
  facturaUrl: string;
  material: string;
  fotoTechoUrl: string;
  fotoObstaculosUrl: string;
  fotoTableroUrl: string;
  cableado: string;
  distanciaTablero: string;
  nombre: string;
  apellido: string;
  empresa: string;
  email: string;
  telefono: string;
  notasAdmin: string | null;
}

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

export async function GET() {
  try {
    const cookieStore = await cookies();
    const cookie = cookieStore.get(ADMIN_COOKIE)?.value;
    if (!cookie?.startsWith("admin-")) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }
    const data = await readData();
    return NextResponse.json(data);
  } catch (err) {
    console.error("GET relevamiento:", err);
    return NextResponse.json({ error: "Error al leer datos" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      address = "",
      polygon = [],
      center = { lat: -34.6037, lng: -58.3816 },
      surfaceM2 = 0,
      city = null,
      facturaUrl = "",
      material = "Chapa",
      fotoTechoUrl = "",
      fotoObstaculosUrl = "",
      fotoTableroUrl = "",
      cableado = "Exterior",
      distanciaTablero = "< 10m",
      nombre = "",
      apellido = "",
      empresa = "",
      email = "",
      telefono = "",
    } = body;

    if (!nombre || !apellido || !empresa || !email || !telefono) {
      return NextResponse.json(
        { error: "Faltan campos obligatorios de contacto" },
        { status: 400 }
      );
    }

    const id = `rel-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
    const item: RelevamientoItem = {
      id,
      fecha: new Date().toISOString(),
      estado: "Pendiente",
      address,
      polygon,
      center,
      surfaceM2,
      city,
      facturaUrl,
      material,
      fotoTechoUrl,
      fotoObstaculosUrl,
      fotoTableroUrl,
      cableado,
      distanciaTablero,
      nombre,
      apellido,
      empresa,
      email,
      telefono,
      notasAdmin: null,
    };

    const data = await readData();
    data.push(item);
    await writeData(data);

    return NextResponse.json({ id, ok: true });
  } catch (err) {
    console.error("POST relevamiento:", err);
    return NextResponse.json(
      { error: "Error al guardar relevamiento" },
      { status: 500 }
    );
  }
}
