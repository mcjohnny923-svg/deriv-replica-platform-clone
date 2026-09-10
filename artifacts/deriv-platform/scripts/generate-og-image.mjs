import sharp from "sharp";
import { writeFileSync } from "fs";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

const __dirname = dirname(fileURLToPath(import.meta.url));

const svg = `
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0e0e0e" />
      <stop offset="100%" stop-color="#1a1a1a" />
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <circle cx="600" cy="260" r="70" fill="#ef4444" />
  <text x="600" y="282" font-family="Arial, sans-serif" font-size="56" font-weight="800" fill="#ffffff" text-anchor="middle">NB</text>
  <text x="600" y="410" font-family="Arial, sans-serif" font-size="72" font-weight="800" fill="#ffffff" text-anchor="middle">NovBinary</text>
  <text x="600" y="460" font-family="Arial, sans-serif" font-size="28" font-weight="400" fill="#9ca3af" text-anchor="middle">Trade Volatility Indices. Anytime, Anywhere.</text>
</svg>
`;

const outPath = join(__dirname, "..", "public", "og-image.png");
await sharp(Buffer.from(svg)).png().toFile(outPath);
console.log("Wrote", outPath);
