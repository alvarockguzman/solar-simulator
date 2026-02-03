"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

interface RelevamientoRow {
  id: string;
  fecha: string;
  estado: string;
  nombre: string;
  city: string | null;
  surfaceM2: number;
}

export default function RelevamientoAdminPage() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState<boolean | null>(null);
  const [user, setUser] = useState("");
  const [password, setPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [list, setList] = useState<RelevamientoRow[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/relevamiento/admin", { credentials: "include" })
      .then((r) => {
        if (r.ok) setAuthenticated(true);
        else setAuthenticated(false);
      })
      .catch(() => setAuthenticated(false));
  }, []);

  useEffect(() => {
    if (!authenticated) return;
    fetch("/api/relevamiento", { credentials: "include" })
      .then((r) => (r.ok ? r.json() : []))
      .then((data) => setList(data))
      .catch(() => setList([]));
  }, [authenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    setLoading(true);
    const res = await fetch("/api/relevamiento/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user, password }),
      credentials: "include",
    });
    setLoading(false);
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setLoginError(data.error ?? "Credenciales incorrectas");
      return;
    }
    setAuthenticated(true);
  };

  const handleLogout = () => {
    document.cookie = "relevamiento_admin=; path=/; max-age=0";
    setAuthenticated(false);
    setUser("");
    setPassword("");
  };

  if (authenticated === null) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <p className="text-stone-500">Cargando…</p>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="flex-1 flex items-center justify-center p-4">
        <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
          <h1 className="text-xl font-bold text-stone-800">Acceso admin</h1>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Usuario</label>
            <input
              type="text"
              value={user}
              onChange={(e) => setUser(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-stone-300 px-4 py-3"
              required
            />
          </div>
          {loginError && <p className="text-red-600 text-sm">{loginError}</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-amber-500 py-3 font-semibold text-white hover:bg-amber-600 disabled:opacity-50"
          >
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0 p-4">
      <div className="flex items-center justify-between gap-4 mb-4">
        <h1 className="text-xl font-bold text-stone-800">Relevamientos</h1>
        <div className="flex items-center gap-2">
          <Link href="/relevamiento" className="text-sm text-amber-700 hover:underline">
            Ir a SolarCheck
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-lg border border-stone-300 px-3 py-1.5 text-sm text-stone-600 hover:bg-stone-100"
          >
            Salir
          </button>
        </div>
      </div>

      <div className="flex-1 min-h-0 overflow-auto rounded-xl border border-stone-200 bg-white">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50">
                <th className="text-left p-3 font-semibold text-stone-700">Fecha</th>
                <th className="text-left p-3 font-semibold text-stone-700">Cliente</th>
                <th className="text-left p-3 font-semibold text-stone-700">Ciudad</th>
                <th className="text-left p-3 font-semibold text-stone-700">Superficie</th>
                <th className="text-left p-3 font-semibold text-stone-700">Estado</th>
                <th className="text-left p-3 font-semibold text-stone-700"></th>
              </tr>
            </thead>
            <tbody>
              {list.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-6 text-center text-stone-500">
                    No hay relevamientos
                  </td>
                </tr>
              )}
              {list.map((row) => (
                <tr key={row.id} className="border-b border-stone-100 hover:bg-stone-50/50">
                  <td className="p-3 text-stone-600">
                    {new Date(row.fecha).toLocaleDateString("es-AR")}
                  </td>
                  <td className="p-3 font-medium text-stone-800">{row.nombre}</td>
                  <td className="p-3 text-stone-600">{row.city ?? "—"}</td>
                  <td className="p-3 text-stone-600">{Math.round(row.surfaceM2)} m²</td>
                  <td className="p-3">
                    <span className="rounded-full px-2 py-0.5 text-xs font-medium bg-amber-100 text-amber-800">
                      {row.estado}
                    </span>
                  </td>
                  <td className="p-3">
                    <Link
                      href={`/relevamiento/admin/${row.id}`}
                      className="text-amber-600 hover:underline font-medium"
                    >
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
