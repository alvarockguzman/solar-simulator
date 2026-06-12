import { promises as fs } from "fs";
import path from "path";

const COUNTER_PATH = path.join(process.cwd(), "data", "report-counter.json");

interface CounterFile {
  year: number;
  last: number;
}

/** Numeración AAAA-NNN para reportes de producción. */
export async function nextReportNumber(): Promise<string> {
  const year = new Date().getFullYear();
  let data: CounterFile = { year, last: 0 };
  try {
    const raw = await fs.readFile(COUNTER_PATH, "utf-8");
    data = JSON.parse(raw) as CounterFile;
  } catch {
    /* primer uso */
  }
  if (data.year !== year) {
    data = { year, last: 0 };
  }
  data.last += 1;
  await fs.mkdir(path.dirname(COUNTER_PATH), { recursive: true });
  await fs.writeFile(COUNTER_PATH, JSON.stringify(data, null, 2), "utf-8");
  return `${year}-${String(data.last).padStart(3, "0")}`;
}
