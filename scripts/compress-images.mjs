import sharp from "sharp";
import { readdir, stat, rename } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dir = path.join(__dirname, "../public/images");

const MAX_WIDTH = 1920;
const JPEG_QUALITY = 82;

async function collectJpegs(base) {
  const entries = await readdir(base, { withFileTypes: true });
  const files = [];
  for (const e of entries) {
    const full = path.join(base, e.name);
    if (e.isDirectory()) {
      files.push(...(await collectJpegs(full)));
    } else if (/\.(jpe?g)$/i.test(e.name)) {
      files.push(full);
    }
  }
  return files;
}

const files = await collectJpegs(dir);
let totalBefore = 0;
let totalAfter = 0;

for (const fp of files) {
  const tmp = fp + ".tmp";
  const before = (await stat(fp)).size;
  totalBefore += before;

  const img = sharp(fp);
  const meta = await img.metadata();
  const needsResize = (meta.width ?? 0) > MAX_WIDTH;

  await (needsResize ? img.resize(MAX_WIDTH) : img)
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
    .toFile(tmp);

  const after = (await stat(tmp)).size;
  totalAfter += after;

  await rename(tmp, fp);

  const rel = path.relative(dir, fp);
  const pct = (((before - after) / before) * 100).toFixed(0);
  console.log(`${rel}: ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB (−${pct}%)`);
}

console.log(
  `\nTotal: ${(totalBefore / 1e6).toFixed(0)} MB → ${(totalAfter / 1e6).toFixed(0)} MB`
);
