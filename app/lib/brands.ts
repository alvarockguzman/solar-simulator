import {
  MONDAY_PRESUPUESTO_FORM_URL,
  WHATSAPP_ADVISOR_URL,
} from "./renovatioLinks";

/**
 * Datos de marca de las dos calculadoras. Los hex están para recharts y
 * Leaflet. En Renovatio, accent es el ámbar que ya usan los botones
 * (#F59E0B) y marker el naranja del polígono (#EA580C).
 */

export type BrandId = "renovatio" | "nexo";

export interface BrandColors {
  primary: string;
  primaryDark: string;
  accent: string;
  accentDark: string;
  accent2: string;
  highlight: string;
  ink: string;
  muted: string;
  line: string;
  surface: string;
  surfaceAlt: string;
  cyan: string;
  blue050: string;
  /** Trazo y marcadores del polígono en el mapa. */
  marker: string;
  /** Relleno del polígono. */
  polygonFill: string;
}

export interface BrandConfig {
  id: BrandId;
  name: string;
  tagline: string;
  claim: string;
  phone: string;
  email: string;
  website: string;
  whatsappUrl: string;
  /** null si la marca no usa el formulario de relevamiento de Monday. */
  mondayFormUrl: string | null;
  basePath: string;
  /** A dónde vuelve "Volver al inicio" del formulario de contacto. */
  homePath: string;
  /** Valor de `origen` que se manda con el lead. Renovatio hoy usa "avanzada". */
  leadOrigen: string;
  /**
   * Nombre de una env var opcional con la URL del Apps Script de esta marca.
   * Si no está definida en el servidor, el lead usa LEAD_FORM_URL.
   */
  leadFormUrlEnv?: string;
  /**
   * Nombre de una env var opcional con el board de Monday de esta marca.
   * Si no está definida en el servidor, el lead usa MONDAY_BOARD_ID.
   */
  mondayBoardIdEnv?: string;
  colors: BrandColors;
}

function whatsappUrl(phone: string, text: string): string {
  return `https://wa.me/${phone}?text=${encodeURIComponent(text)}`;
}

export const brands: Record<BrandId, BrandConfig> = {
  renovatio: {
    id: "renovatio",
    name: "Renovatio",
    tagline: "Cuidamos tu energía",
    claim: "Simulación técnica y análisis económico para empresas industriales.",
    phone: "+54 9 11 2396 9892",
    email: "",
    website: "https://www.renovatio.lat",
    whatsappUrl: WHATSAPP_ADVISOR_URL,
    mondayFormUrl: MONDAY_PRESUPUESTO_FORM_URL,
    basePath: "/calculadora",
    homePath: "/",
    leadOrigen: "avanzada",
    colors: {
      primary: "#F39A2D",
      primaryDark: "#C77816",
      accent: "#F59E0B",
      accentDark: "#D97706",
      accent2: "#0F2747",
      highlight: "#F59E0B",
      ink: "#1C1917",
      muted: "#6B7280",
      line: "#E7E5E4",
      surface: "#FAFAF9",
      surfaceAlt: "#FFF7EC",
      cyan: "#0F2747",
      blue050: "#FFF7EC",
      marker: "#EA580C",
      polygonFill: "#F59E0B",
    },
  },
  nexo: {
    id: "nexo",
    name: "Nexo Energía",
    tagline: "Soluciones en energía renovable",
    claim: "Menos costos. Más autonomía.",
    phone: "+54 9 11 2661 0707",
    email: "info@nexoenergia.com",
    website: "https://nexoenergia.com.ar",
    whatsappUrl: whatsappUrl(
      "5491123969892",
      "Hola, vengo de la calculadora solar de Nexo y quiero hablar con un asesor",
    ),
    mondayFormUrl: null,
    basePath: "/calculadora/nexo",
    homePath: "/calculadora/nexo",
    leadOrigen: "nexo",
    leadFormUrlEnv: "NEXO_LEAD_FORM_URL",
    mondayBoardIdEnv: "NEXO_MONDAY_BOARD_ID",
    colors: {
      primary: "#04127A",
      primaryDark: "#030C4E",
      accent: "#009657",
      accentDark: "#007443",
      accent2: "#0397D1",
      highlight: "#7CC142",
      ink: "#16213B",
      muted: "#5B6780",
      line: "#DCE2EC",
      surface: "#F1F3FA",
      surfaceAlt: "#EEF7F2",
      cyan: "#01A3E1",
      blue050: "#EEF6FC",
      marker: "#009657",
      polygonFill: "#7CC142",
    },
  },
};
