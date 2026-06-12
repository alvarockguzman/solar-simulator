import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  COTIZADOR_COOKIE,
  COTIZADOR_SESSION_MAX_AGE,
  sessionTokenFromPassword,
} from "@/lib/cotizador/auth";

export async function POST(request: Request) {
  const appPassword = process.env.APP_PASSWORD;
  if (!appPassword) {
    return NextResponse.json(
      { error: "APP_PASSWORD no configurada en el servidor." },
      { status: 500 }
    );
  }

  let password = "";
  try {
    const body = await request.json();
    password = typeof body?.password === "string" ? body.password : "";
  } catch {
    return NextResponse.json({ error: "Body inválido." }, { status: 400 });
  }

  if (password !== appPassword) {
    return NextResponse.json({ error: "Contraseña incorrecta." }, { status: 401 });
  }

  const token = await sessionTokenFromPassword(appPassword);
  cookies().set(COTIZADOR_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COTIZADOR_SESSION_MAX_AGE,
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  cookies().delete(COTIZADOR_COOKIE);
  return NextResponse.json({ ok: true });
}
