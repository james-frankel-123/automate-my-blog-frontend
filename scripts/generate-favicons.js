#!/usr/bin/env node
/**
 * Generate favicons and app icons from the master 1024px icon.
 * Run: node scripts/generate-favicons.js
 * Requires: sharp, sharp-ico (devDependencies)
 */
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const ico = require('sharp-ico');

const ROOT = path.resolve(__dirname, '..');
const MASTER = path.join(ROOT, 'src/assets/automateyourblog_icon_MASTER_1024.png');
const PUBLIC = path.join(ROOT, 'public');

async function main() {
  if (!fs.existsSync(MASTER)) {
    console.error('Master icon not found:', MASTER);
    process.exit(1);
  }
  fs.mkdirSync(PUBLIC, { recursive: true });

  const source = sharp(MASTER);

  // Favicon.ico: multiple sizes via sharp-ico
  const icoSizes = [256, 128, 64, 48, 32, 24, 16];
  const sharpInstances = await Promise.all(
    icoSizes.map((size) =>
      sharp(MASTER).resize(size, size).toBuffer().then((buf) => sharp(buf))
    )
  );
  await ico.sharpsToIco(sharpInstances, path.join(PUBLIC, 'favicon.ico'));
  console.log('Wrote public/favicon.ico');

  // PNGs for PWA and Apple
  const pngSizes = [
    { size: 192, name: 'logo192.png' },
    { size: 512, name: 'logo512.png' },
    { size: 180, name: 'apple-touch-icon.png' },
  ];
  for (const { size, name } of pngSizes) {
    await source
      .clone()
      .resize(size, size)
      .png()
      .toFile(path.join(PUBLIC, name));
    console.log('Wrote public/' + name);
  }

  console.log('Done.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
