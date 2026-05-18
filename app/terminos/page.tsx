import type { Metadata } from "next";
import { InstitutionalPage } from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Términos | Renovatio",
  description: "Términos de uso de las herramientas Renovatio.",
};

export default function TerminosPage() {
  return (
    <InstitutionalPage title="Términos">
      <p>
        Las calculadoras y simuladores de este sitio entregan estimaciones
        orientativas basadas en parámetros técnicos y económicos de referencia.
        No constituyen una oferta comercial vinculante ni un diseño de ingeniería
        definitivo.
      </p>
      <p>
        Los resultados pueden variar según condiciones reales de la instalación,
        regulación vigente, tarifas eléctricas y factores climáticos. Cualquier
        proyecto debe ser validado por el equipo técnico de Renovatio antes de
        tomar decisiones de inversión.
      </p>
      <p>
        Al utilizar estas herramientas aceptás usar la información de manera
        responsable y reconocés que Renovatio no se responsabiliza por decisiones
        tomadas exclusivamente sobre la base de simulaciones preliminares.
      </p>
    </InstitutionalPage>
  );
}
