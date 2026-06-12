import React from "react";
import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import { ProductionReportPdf } from "./ProductionReportPdf";
import type { ProductionReportData } from "../types";

/** Genera el buffer PDF del reporte (server-only, sin pasar por webpack de Next). */
export async function renderProductionReportBuffer(args: {
  report: ProductionReportData;
  numero: string;
  snapshotDataUrl?: string | null;
  borrador?: boolean;
}): Promise<Buffer> {
  const buffer = await renderToBuffer(
    React.createElement(ProductionReportPdf, args) as React.ReactElement<DocumentProps>
  );
  return Buffer.from(buffer);
}
