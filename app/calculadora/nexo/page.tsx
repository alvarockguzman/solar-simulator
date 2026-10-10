"use client";

import { Suspense } from "react";
import { CalculadoraWizard } from "../components/CalculadoraWizard";

export default function CalculadoraNexoPage() {
  return (
    <Suspense fallback={null}>
      <CalculadoraWizard />
    </Suspense>
  );
}
