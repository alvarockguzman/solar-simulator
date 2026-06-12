"use client";

import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, Sun } from "lucide-react";
import { BtnPrimary, FormField, inputClsEmpty } from "../components/ui/cotizador-ui";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/cotizador/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (res.ok) {
        const next = searchParams.get("next") || "/cotizador";
        router.push(next.startsWith("/cotizador") ? next : "/cotizador");
        router.refresh();
        return;
      }
      const data = await res.json().catch(() => null);
      setError(data?.error ?? "Error al iniciar sesión.");
    } catch {
      setError("Error de red. Probá de nuevo.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-lg"
    >
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
          <Sun className="h-6 w-6" />
        </span>
        <h1 className="text-xl font-semibold text-slate-900">Cotizador Solar</h1>
        <p className="text-sm text-slate-500">
          Herramienta interna del equipo comercial. Ingresá la contraseña compartida.
        </p>
        <span className="mt-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Interno
        </span>
      </div>

      <FormField label="Contraseña">
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoFocus
            className={`${inputClsEmpty(password)} pl-9`}
            placeholder="••••••••"
          />
        </div>
      </FormField>

      {error && (
        <div className="mt-4 rounded-r-lg border border-red-200 border-l-4 border-l-red-500 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      <BtnPrimary
        type="submit"
        disabled={loading || !password}
        className="mt-6 w-full"
      >
        {loading ? "Verificando…" : "Entrar"}
      </BtnPrimary>
    </form>
  );
}

export default function CotizadorLoginPage() {
  return (
    <main className="flex min-h-[100dvh] items-center justify-center bg-slate-50 p-4">
      <Suspense>
        <LoginForm />
      </Suspense>
    </main>
  );
}
