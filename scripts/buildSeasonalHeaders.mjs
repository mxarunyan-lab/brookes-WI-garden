import { access, mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const root = process.cwd();
const headerDir = path.join(root, 'public', 'images', 'garden-headers');
const stagingDir = path.join(root, '.asset-staging');
const seasons = ['spring', 'summer', 'fall', 'winter'];

await mkdir(headerDir, { recursive: true });

async function restoreSummerMaster() {
  const chunks = [
    'summer.avif.b64.part00',
    'summer.avif.b64.part01',
    'summer.avif.b64.part02',
  ];
  const encoded = (await Promise.all(chunks.map((name) => readFile(path.join(stagingDir, name), 'utf8'))))
    .join('')
    .replace(/\s+/g, '');
  const restored = Buffer.from(encoded, 'base64');
  if (restored.subarray(4, 12).toString('ascii') !== 'ftypavif') {
    throw new Error('Restored summer header is not a valid AVIF container.');
  }
  await writeFile(path.join(headerDir, 'garden-header-summer.avif'), restored);
  console.log('[seasonal-header] restored approved summer AVIF from protected source chunks');
}

// The previous summer AVIF blob was truncated during an earlier upload. Rebuild it
// deterministically from the complete protected source before Sharp reads any asset.
await restoreSummerMaster();

for (const season of seasons) {
  const source = path.join(headerDir, `garden-header-${season}.avif`);
  const output = path.join(headerDir, `garden-header-${season}.webp`);
  await access(source);
  const image = sharp(source, { failOn: 'error' });
  const metadata = await image.metadata();
  if (!metadata.width || !metadata.height || Math.abs(metadata.width / metadata.height - 2) > 0.02) {
    throw new Error(`${season} seasonal header is not the approved 2:1 image.`);
  }
  await image.webp({ quality: 94, effort: 6, smartSubsample: true }).toFile(output);
  console.log(`[seasonal-header] built ${path.relative(root, output)} (${metadata.width}x${metadata.height})`);
}
