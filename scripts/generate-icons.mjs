import sharp from "sharp";
import { mkdirSync } from "node:fs";

// Simple procedural app icon: void background, gold ring, cyan glow —
// matches the design system without needing a designer asset yet.
const svg = (size) => `
<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">
  <defs>
    <radialGradient id="bg" cx="50%" cy="35%" r="75%">
      <stop offset="0%" stop-color="#141c33"/>
      <stop offset="100%" stop-color="#05060b"/>
    </radialGradient>
    <linearGradient id="ring" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#FFC24B"/>
      <stop offset="100%" stop-color="#FF8A3D"/>
    </linearGradient>
  </defs>
  <rect width="512" height="512" rx="112" fill="url(#bg)"/>
  <circle cx="256" cy="256" r="118" fill="none" stroke="url(#ring)" stroke-width="34"/>
  <circle cx="256" cy="256" r="118" fill="none" stroke="#22E4FF" stroke-width="2" opacity="0.5"/>
</svg>`;

mkdirSync("public/icons", { recursive: true });

const sizes = [
  ["icon-192.png", 192],
  ["icon-512.png", 512],
  ["apple-touch-icon.png", 180],
  ["maskable-512.png", 512],
];

for (const [name, size] of sizes) {
  await sharp(Buffer.from(svg(size)))
    .resize(size, size)
    .png()
    .toFile(`public/icons/${name}`);
  console.log("generated", name);
}
