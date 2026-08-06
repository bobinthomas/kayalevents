#!/usr/bin/env node
/**
 * Resize + recompress oversized images in content/media/images/ in place.
 * Keeps filenames/extensions unchanged (no content JSON or route changes needed —
 * the /api/media/images/* route just serves whatever bytes are on disk).
 *
 * Caps the longest edge at --max-dimension (default 2000px) and re-encodes
 * JPEGs with mozjpeg at --quality (default 80). Only overwrites a file when
 * the result is smaller than the original and skips files already under
 * --skip-below (default 300 KB) at or under the max dimension.
 *
 *   npm run images:optimize            # apply
 *   npm run images:optimize -- --dry-run
 *   npm run images:optimize -- --max-dimension=1600 --quality=75
 */
import { readdir, readFile, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const mediaDir = path.join(root, 'content/media/images')

const args = process.argv.slice(2)
const flag = (name, fallback) => {
  const hit = args.find((a) => a.startsWith(`--${name}=`))
  return hit ? Number(hit.split('=')[1]) : fallback
}
const DRY_RUN = args.includes('--dry-run')
const MAX_DIMENSION = flag('max-dimension', 2000)
const QUALITY = flag('quality', 80)
const SKIP_BELOW_BYTES = flag('skip-below', 300) * 1024

const IMAGE_EXT = new Set(['.jpg', '.jpeg', '.png'])

async function collectImages(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectImages(full)))
    } else if (IMAGE_EXT.has(path.extname(entry.name).toLowerCase())) {
      files.push(full)
    }
  }
  return files
}

function formatKB(bytes) {
  return `${Math.round(bytes / 1024)} KB`
}

async function processImage(file) {
  const original = await readFile(file)
  const originalSize = original.byteLength
  const ext = path.extname(file).toLowerCase()

  const image = sharp(original)
  const meta = await image.metadata()
  const { width = 0, height = 0 } = meta

  const withinDimension = width <= MAX_DIMENSION && height <= MAX_DIMENSION
  if (withinDimension && originalSize <= SKIP_BELOW_BYTES) {
    return { file, skipped: true, originalSize }
  }

  let pipeline = image
  if (!withinDimension) {
    pipeline = pipeline.resize({
      width: MAX_DIMENSION,
      height: MAX_DIMENSION,
      fit: 'inside',
      withoutEnlargement: true,
    })
  }

  pipeline =
    ext === '.png'
      ? pipeline.png({ compressionLevel: 9, palette: true })
      : pipeline.jpeg({ quality: QUALITY, mozjpeg: true })

  const output = await pipeline.toBuffer()

  if (output.byteLength >= originalSize) {
    return { file, skipped: true, originalSize, reason: 'no-savings' }
  }

  if (!DRY_RUN) {
    await writeFile(file, output)
  }

  return { file, skipped: false, originalSize, newSize: output.byteLength, width, height }
}

async function main() {
  const files = await collectImages(mediaDir)
  if (files.length === 0) {
    console.log('No images found under content/media/images/.')
    return
  }

  console.log(
    `Scanning ${files.length} image(s) — max dimension ${MAX_DIMENSION}px, quality ${QUALITY}, skip-below ${formatKB(SKIP_BELOW_BYTES)}${DRY_RUN ? ' (dry run)' : ''}\n`,
  )

  let totalBefore = 0
  let totalAfter = 0
  let changed = 0

  for (const file of files) {
    const rel = path.relative(root, file)
    const result = await processImage(file)
    totalBefore += result.originalSize

    if (result.skipped) {
      totalAfter += result.originalSize
      continue
    }

    changed++
    totalAfter += result.newSize
    const pct = Math.round((1 - result.newSize / result.originalSize) * 100)
    console.log(`${rel}: ${formatKB(result.originalSize)} -> ${formatKB(result.newSize)} (-${pct}%)`)
  }

  const savedBytes = totalBefore - totalAfter
  const savedPct = totalBefore ? Math.round((savedBytes / totalBefore) * 100) : 0
  console.log(
    `\n${changed} of ${files.length} file(s) ${DRY_RUN ? 'would be optimized' : 'optimized'}. Total: ${formatKB(totalBefore)} -> ${formatKB(totalAfter)} (saved ${formatKB(savedBytes)}, -${savedPct}%).`,
  )
  if (DRY_RUN) {
    console.log('Dry run — no files were written. Re-run without --dry-run to apply.')
  }
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
