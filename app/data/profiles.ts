export type ProfileId = "mediana-plano" | "grande-plano" | "serrucho";

export interface Profile {
  id: ProfileId;
  name: string;
  shortName: string;
  description: string;
  power: number;
  surface: number;
  icon: "roof-flat" | "roof-flat-large" | "roof-saw";
}

export interface Economics {
  energyKwh: number;
  savingsUsd: number;
  paybackYears: number;
  powerKwp: number;
}

export const PROFILES: Profile[] = [
  {
    id: "mediana-plano",
    name: "Techo plano – Instalación mediana",
    shortName: "Instalación mediana",
    description:
      "Instalación solar típica para cubiertas planas, pensada para empresas con consumos eléctricos medios.",
    power: 60,
    surface: 450,
    icon: "roof-flat",
  },
  {
    id: "grande-plano",
    name: "Techo plano – Instalación grande",
    shortName: "Instalación grande",
    description:
      "Instalación de mayor escala que aprovecha mejor la superficie disponible y maximiza el ahorro energético.",
    power: 150,
    surface: 1100,
    icon: "roof-flat-large",
  },
  {
    id: "serrucho",
    name: "Techo serrucho – Instalación mediana",
    shortName: "Techo serrucho",
    description:
      "Instalación solar adaptada a techos con geometría serrucho, con menor flexibilidad de orientación y rendimiento.",
    power: 60,
    surface: 510,
    icon: "roof-saw",
  },
];

export const ECONOMICS_BY_PROFILE: Record<ProfileId, Economics> = {
  "mediana-plano": {
    energyKwh: 87564,
    savingsUsd: 10251,
    paybackYears: 5.4,
    powerKwp: 60,
  },
  "grande-plano": {
    energyKwh: 218910,
    savingsUsd: 25628,
    paybackYears: 4.7,
    powerKwp: 150,
  },
  serrucho: {
    energyKwh: 84420,
    savingsUsd: 9883,
    paybackYears: 6.1,
    powerKwp: 60,
  },
};
