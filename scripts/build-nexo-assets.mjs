/**
 * Genera los assets públicos de Nexo a partir de docs/referencia-nexo/.
 * Logo a 600 px, versión blanca, isotipo recortado, y las fotos del HTML.
 */
import { mkdirSync, readFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const root = process.cwd();
const srcDir = path.join(root, "docs", "referencia-nexo");
const outDir = path.join(root, "public", "brand", "nexo");

const LOGO_FILE = "NEXO - Logo POSITIVO fondo transparente.png";
const HTML_FILE = "Propuesta Nexo Energia v2.html";
const OBRA_NAMES = ["obra-puma-pilar.webp", "obra-aca-acopio.webp", "obra-chascomus.webp"];

mkdirSync(outDir, { recursive: true });

async function toWhite(input) {
  const { data, info } = await input.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255;
    data[i + 1] = 255;
    data[i + 2] = 255;
  }
  return sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  });
}

/** Recorta el círculo de la izquierda: la primera masa opaca, antes del hueco con el wordmark. */
async function cropIsotipo(filePath) {
  const trimmed = sharp(filePath).trim();
  const { data, info } = await trimmed.ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const columnHasInk = (x) => {
    for (let y = 0; y < height; y++) {
      if (data[(y * width + x) * channels + 3] > 16) return true;
    }
    return false;
  };

  let start = 0;
  while (start < width && !columnHasInk(start)) start++;
  let end = start;
  let gap = 0;
  while (end < width) {
    if (columnHasInk(end)) {
      gap = 0;
      end++;
      continue;
    }
    gap++;
    if (gap > 8) break;
    end++;
  }
  end -= gap;

  const iconWidth = Math.max(1, end - start);
  return sharp(filePath)
    .trim()
    .extract({ left: start, top: 0, width: iconWidth, height })
    .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } });
}

function jpegFromDataUri(base64) {
  return sharp(Buffer.from(base64, "base64")).resize({
    width: 1600,
    withoutEnlargement: true,
  }).webp({ quality: 80 });
}

const logoPath = path.join(srcDir, LOGO_FILE);
const logo600 = sharp(logoPath).resize({ width: 600, withoutEnlargement: false });

await logo600.clone().png().toFile(path.join(outDir, "nexo-logo.png"));
await (await toWhite(logo600.clone())).png().toFile(path.join(outDir, "nexo-logo-white.png"));
await (await cropIsotipo(logoPath)).png().toFile(path.join(outDir, "nexo-isotipo.png"));

const html = readFileSync(path.join(srcDir, HTML_FILE), "utf8");
const portada = html.match(/--u-portada:url\("data:image\/jpeg;base64,([^"]+)"\)/);
if (!portada) {
  console.error("No encontré --u-portada en el HTML.");
  process.exit(1);
}
await jpegFromDataUri(portada[1]).toFile(path.join(outDir, "portada.webp"));

const obrasAt = html.indexOf("Obras ejecutadas");
if (obrasAt < 0) {
  console.error("No encontré la sección Obras ejecutadas.");
  process.exit(1);
}
const obras = [...html.slice(obrasAt).matchAll(/src="data:image\/jpeg;base64,([^"]+)"/g)];
if (obras.length < OBRA_NAMES.length) {
  console.error(`Esperaba ${OBRA_NAMES.length} fotos de obras y hay ${obras.length}.`);
  process.exit(1);
}
for (let i = 0; i < OBRA_NAMES.length; i++) {
  await jpegFromDataUri(obras[i][1]).toFile(path.join(outDir, OBRA_NAMES[i]));
}

console.log("Assets en", outDir);
