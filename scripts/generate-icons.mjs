import { writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const publicDir = join(__dirname, "..", "public");

const svg = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#1f6b3a"/>
  <circle cx="32" cy="32" r="18" fill="#f7faf7"/>
  <path fill="#1f6b3a" d="M32 18l4.5 3.3-1.7 5.3h-5.6l-1.7-5.3L32 18zm-9.3 6.8 3.3-4.5 5.3 1.7v5.6l-5.3 1.7-3.3-4.5zm18.6 0-3.3-4.5-5.3 1.7v5.6l5.3 1.7 3.3-4.5zM22.7 39.2l3.3 4.5 5.3-1.7v-5.6l-5.3-1.7-3.3 4.5zm18.6 0-3.3 4.5-5.3-1.7v-5.6l5.3-1.7 3.3 4.5zM32 46l-4.5-3.3 1.7-5.3h5.6l1.7 5.3L32 46z"/>
</svg>`;

function render(size, filename) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  const png = resvg.render().asPng();
  writeFileSync(join(publicDir, filename), png);
  console.log("wrote", filename);
}

render(16, "favicon-16x16.png");
render(32, "favicon-32x32.png");
render(48, "favicon-48x48.png");
render(192, "favicon-192x192.png");
render(512, "favicon-512x512.png");
render(180, "apple-touch-icon.png");

// Simple ICO: reuse 32x32 as favicon.ico fallback (browsers accept PNG renamed in many cases;
// write a minimal multi-size via 32 png bytes for modern browsers)
writeFileSync(join(publicDir, "favicon.ico"), renderBuffer(32));

function renderBuffer(size) {
  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: size },
  });
  return resvg.render().asPng();
}

console.log("Icons generated.");
