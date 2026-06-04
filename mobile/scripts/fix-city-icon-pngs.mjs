/**
 * Re-encode city seal images as valid Android-compatible PNGs.
 * JPEG/WebP files mislabeled as .png break AAPT2 on release builds.
 */
import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const assetsDir = path.join(import.meta.dirname, '..', 'assets');
const outDir = path.join(assetsDir, 'city-icons');
const sources = [
  ['boston-icon.png', ['boston-icon.png', 'boston-icon.png.tmp']],
  ['salem-icon.png', ['salem-icon.png']],
  ['worcester-seal.png', ['worcester-seal.png']],
  ['springfield-seal.png', ['springfield-seal.png']],
];
const size = 256;

fs.mkdirSync(outDir, { recursive: true });

for (const [outName, candidates] of sources) {
  const input = candidates.map((c) => path.join(assetsDir, c)).find((p) => fs.existsSync(p));
  if (!input) {
    console.warn(`skip ${outName}: no source found`);
    continue;
  }
  const buffer = await sharp(input)
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9, force: true })
    .toBuffer();
  const dest = path.join(outDir, outName);
  fs.writeFileSync(dest, buffer);
  const ok = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  console.log(`${outName}: ${buffer.length} bytes, valid PNG=${ok} (from ${path.basename(input)})`);
}
