import Link from "next/link";
interface InstitutionalPageProps {
  title: string;
  children: React.ReactNode;
}

export function InstitutionalPage({ title, children }: InstitutionalPageProps) {
  return (
    <div className="flex min-h-screen flex-col bg-stone-50">
      <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-12 sm:px-6 lg:py-16">
        <Link
          href="/"
          className="text-sm font-medium text-stone-500 transition-colors hover:text-stone-800"
        >
          ← Volver al inicio
        </Link>
        <h1 className="mt-6 text-3xl font-bold tracking-tight text-stone-900">
          {title}
        </h1>
        <div className="mt-8 space-y-4 text-base leading-relaxed text-stone-700">
          {children}
        </div>
      </main>
    </div>
  );
}
