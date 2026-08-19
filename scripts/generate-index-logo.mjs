import sharp from 'sharp';

const [source, destination] = process.argv.slice(2);

if (!source || !destination) {
  throw new Error('Usage: node scripts/generate-index-logo.mjs <source.png> <destination.png>');
}

const { data, info } = await sharp(source)
  .resize({ width: 1800, withoutEnlargement: true })
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

for (let offset = 0; offset < data.length; offset += info.channels) {
  const blue = data[offset + 2];
  const sourceAlpha = data[offset + 3];
  const silhouette = Math.max(0, Math.min(255, Math.round(((255 - blue) / 177) * 255)));
  data[offset] = 255;
  data[offset + 1] = 255;
  data[offset + 2] = 255;
  data[offset + 3] = Math.round((silhouette * sourceAlpha) / 255);
}

await sharp(data, { raw: info }).png({ compressionLevel: 9 }).toFile(destination);
