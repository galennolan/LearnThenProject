import sharp from 'sharp';
import { mkdirSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'public', 'icons');
mkdirSync(outDir, { recursive: true });

const baseSvg = readFileSync(join(root, 'public', 'favicon.svg'));

// Versi full-bleed (tanpa transparansi) untuk maskable & Apple.
const solidSvg = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">` +
  `<rect width="64" height="64" fill="#059669"/>` +
  `<text x="32" y="44" font-family="system-ui, sans-serif" font-size="34" font-weight="700" fill="#ffffff" text-anchor="middle">O</text></svg>`;

const jobs = [
  sharp(baseSvg).resize(192, 192).png().toFile(join(outDir, 'pwa-192.png')),
  sharp(baseSvg).resize(512, 512).png().toFile(join(outDir, 'pwa-512.png')),
  sharp(Buffer.from(solidSvg(512))).resize(512, 512).png().toFile(join(outDir, 'maskable-512.png')),
  sharp(Buffer.from(solidSvg(180))).resize(180, 180).png().toFile(join(outDir, 'apple-touch-icon.png')),
];

await Promise.all(jobs);
console.log('Ikon PWA dibuat di public/icons/');
