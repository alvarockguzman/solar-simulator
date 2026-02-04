import type { Metadata } from "next";
import { LandingClient } from "./components/LandingClient";

export const metadata: Metadata = {
  title: "Renovatio - Cuidando tu energía",
  description:
    "Renovatio. Calculadoras solares, relevamiento técnico y soluciones para tu energía.",
};

export default function HomePage() {
  return <LandingClient />;
}
