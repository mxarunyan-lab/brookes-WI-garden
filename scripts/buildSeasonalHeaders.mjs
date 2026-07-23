import { access, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const headerDir = path.join(root, 'public', 'images', 'garden-headers');
const seasons = ['spring', 'summer', 'fall', 'winter'];

await mkdir(headerDir, { recursive: true });

for (const season of seasons) {
  const source = path.join(headerDir, `garden-header-${season}.avif`);
  const output = path.join(headerDir, `garden-header-${season}.webp`);
  await access(source);
  await sharp(source)
    .webp({ lossless: true, effort: 6 })
    .toFile(output);
  console.log(`[seasonal-header] built ${path.relative(root, output)}`);
}
