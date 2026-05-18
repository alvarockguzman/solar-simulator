import type { Metadata } from "next";
import { InstitutionalPage } from "../components/InstitutionalPage";

export const metadata: Metadata = {
  title: "Política de privacidad | Renovatio",
  description: "Política de privacidad de Renovatio.",
};

export default function PrivacidadPage() {
  return (
    <InstitutionalPage title="Política de privacidad">
      <p>
        En Renovatio respetamos la privacidad de las personas y empresas que
        utilizan nuestras calculadoras y formularios de contacto. Los datos que
        nos proporcionás (nombre, empresa, correo, teléfono y datos técnicos del
        proyecto) se utilizan únicamente para responder consultas, elaborar
        propuestas y dar seguimiento comercial relacionado con soluciones solares.
      </p>
      <p>
        No vendemos ni cedemos tus datos a terceros con fines ajenos a la
        prestación del servicio solicitado. Podés solicitar acceso, rectificación
        o eliminación de tu información escribiendo a través de los canales de
        contacto publicados en este sitio.
      </p>
      <p>
        Este documento puede actualizarse periódicamente. La versión vigente es
        la publicada en esta página.
      </p>
    </InstitutionalPage>
  );
}
