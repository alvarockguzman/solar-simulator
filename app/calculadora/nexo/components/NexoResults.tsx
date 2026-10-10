"use client";

import {
  Bar,
  BarChart,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useBrand } from "@/app/lib/BrandContext";
import { useWizard } from "../../context/WizardContext";
import { WizardStepLayout } from "../../components/WizardStepLayout";
import { WizardStepBanner } from "../../components/WizardStepBanner";
import { nexoBtnPrimary, nexoBtnSecondary } from "../../components/wizardButtons";
import {
  formatKwp,
  formatUsd,
  type CalculationResult,
} from "../../lib/calculations";

const RAZONES = [
  {
    title: "Menor factura eléctrica",
    text: "reducís el costo de energía todos los meses.",
  },
  {
    title: "Más previsibilidad",
    text: "disminuís el impacto de los futuros aumentos tarifarios.",
  },
  {
    title: "Retorno atractivo",
    text: "el ahorro generado permite recuperar la inversión en pocos años.",
  },
  {
    title: "Valor durante décadas",
    text: "los paneles continúan generando energía por aproximadamente 30 años.",
  },
  {
    title: "Mejor imagen empresarial",
    text: "proyectás una empresa moderna, eficiente y comprometida con la sostenibilidad.",
  },
] as const;

function formatKwh(value: number): string {
  return `${Math.round(value).toLocaleString("es-AR")} kWh`;
}

export function NexoResults({
  results,
  stepIndex,
  onBack,
  onRequestQuote,
}: {
  results: CalculationResult;
  stepIndex: number;
  onBack: () => void;
  onRequestQuote: () => void;
}) {
  const brand = useBrand();
  const { consumptionKwhPerYear } = useWizard();
  const generated = results.energyKwhPerYear;
  const consumption = consumptionKwhPerYear;
  const selfConsumed = Math.min(generated, Math.max(consumption, 0));
  const fromGrid = Math.max(0, consumption - generated);
  const injected = Math.max(0, generated - consumption);
  const coverage =
    consumption > 0 ? Math.min(100, (generated / consumption) * 100) : null;

  const chartRows = [
    { name: "Autoconsumo", value: Math.round(selfConsumed), fill: "#009657", dashed: false },
    { name: "Consumo de red", value: Math.round(fromGrid), fill: "#04127A", dashed: false },
    { name: "Generación", value: Math.round(generated), fill: "#7CC142", dashed: false },
    { name: "Inyección", value: Math.round(injected), fill: "#0397D1", dashed: true },
  ];

  const paybackLabel =
    results.paybackYears === null
      ? null
      : results.paybackYears.toLocaleString("es-AR", {
          minimumFractionDigits: 1,
          maximumFractionDigits: 1,
        });

  return (
    <WizardStepLayout
      banner={
        <WizardStepBanner
          stepIndex={stepIndex}
          title="Tu instalación a medida"
          subtitle="Revisá los resultados y solicitá un presupuesto."
        />
      }
    >
      <div className="mx-auto w-full max-w-3xl space-y-8 pb-4">
        <section className="rounded-[20px] bg-brand-primary px-6 py-8 text-white sm:px-8">
          <h2 className="text-lg font-bold sm:text-2xl">La inversión se recupera en</h2>
          {paybackLabel ? (
            <p className="mt-3 font-bold leading-none text-brand-cyan text-5xl sm:text-6xl">
              {paybackLabel}
              <span className="ml-2 text-2xl font-semibold text-white sm:text-3xl">años</span>
            </p>
          ) : (
            <p className="mt-3 text-lg text-white/90">
              Con estos supuestos el repago no se puede estimar.
            </p>
          )}
        </section>

        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          <Kpi label="Inversión" value={formatUsd(results.investmentUsd)} />
          <Kpi label="Ahorro anual" value={formatUsd(results.savingsUsdPerYear)} />
          <Kpi label="Energía generada" value={formatKwh(generated)} />
          <Kpi
            label="Cobertura"
            value={coverage === null ? "—" : `${Math.round(coverage)}%`}
          />
          <Kpi label="Potencia" value={formatKwp(results.powerKwp)} />
        </div>

        <section>
          <h3 className="text-lg font-bold text-brand-primary">Balance de energía</h3>
          <p className="mt-1 text-sm text-brand-muted">Valores anuales estimados, en kWh.</p>
          <div className="mt-4 h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartRows}
                layout="vertical"
                margin={{ top: 4, right: 8, left: 0, bottom: 4 }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={108}
                  tick={{ fontSize: 12, fill: "#16213B" }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  formatter={(value) => [
                    `${Number(value).toLocaleString("es-AR")} kWh/año`,
                    "Energía",
                  ]}
                />
                <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={16}>
                  {chartRows.map((row) => (
                    <Cell
                      key={row.name}
                      fill={row.dashed ? "transparent" : row.fill}
                      stroke={row.fill}
                      strokeWidth={row.dashed ? 2 : 0}
                      strokeDasharray={row.dashed ? "4 3" : undefined}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="overflow-hidden rounded-[20px] bg-brand-surface-alt">
          <div className="flex">
            <div
              className="w-1.5 shrink-0"
              style={{
                background: "linear-gradient(180deg, #009657 0%, #7CC142 55%, #0397D1 100%)",
              }}
              aria-hidden
            />
            <div className="px-5 py-6 sm:px-6">
              <h3 className="text-lg font-bold text-brand-primary">
                ¿Por qué invertir en energía solar?
              </h3>
              <ul className="mt-4 space-y-3">
                {RAZONES.map((razon) => (
                  <li key={razon.title} className="flex gap-3 text-sm leading-relaxed text-brand-ink">
                    <span
                      className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-brand-accent"
                      aria-hidden
                    />
                    <span>
                      <strong className="font-semibold">{razon.title}</strong>
                      {" — "}
                      {razon.text}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        <section className="rounded-[20px] bg-brand-primary px-6 py-8 text-white">
          <h3 className="text-2xl font-bold">¿Hablamos de tu proyecto?</h3>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-white/85">
            Ingeniería, financiamiento y ejecución llave en mano.
          </p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <button type="button" onClick={onRequestQuote} className={nexoBtnPrimary}>
              Quiero una propuesta de Nexo
            </button>
            <a
              href={brand.whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-brand-primary"
            >
              WhatsApp
            </a>
          </div>
          <button type="button" onClick={onBack} className={`${nexoBtnSecondary} mt-4`}>
            Atrás
          </button>
        </section>

        <p className="text-xs text-brand-muted">
          Valores orientativos para una primera conversación. Una propuesta de Nexo ajusta
          supuestos y dimensionamiento.
        </p>
      </div>
    </WizardStepLayout>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-xl border-x border-b border-brand-line border-t-4 border-t-brand-accent bg-white px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-muted">{label}</p>
      <p className="mt-2 text-lg font-bold text-brand-primary sm:text-xl">{value}</p>
    </article>
  );
}
