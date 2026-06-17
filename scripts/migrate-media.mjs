#!/usr/bin/env node
/**
 * Move images from public/images → content/media/images and rewrite JSON paths.
 * Run once before removing public/images from the deploy bundle.
 *
 *   npm run images:migrate
 */
import { cp, mkdir, readdir, readFile, rename, stat, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = path.join(__dirname, '..')
const fromDir = path.join(root, 'public/images')
const toDir = path.join(root, 'content/media/images')
const contentDir = path.join(root, 'content')

async function copyTree(src, dest) {
  await mkdir(dest, { recursive: true })
  const entries = await readdir(src, { withFileTypes: true })
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name)
    const destPath = path.join(dest, entry.name)
    if (entry.isDirectory()) {
      await copyTree(srcPath, destPath)
    } else {
      await cp(srcPath, destPath)
    }
  }
}

async function collectJsonFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  const files = []
  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      files.push(...(await collectJsonFiles(full)))
    } else if (entry.name.endsWith('.json')) {
      files.push(full)
    }
  }
  return files
}

async function main() {
  try {
    await stat(fromDir)
  } catch {
    console.log('No public/images directory — nothing to migrate.')
    return
  }

  await copyTree(fromDir, toDir)
  console.log(`Copied files to content/media/images/`)

  const jsonFiles = await collectJsonFiles(contentDir)
  let updated = 0
  for (const file of jsonFiles) {
    const original = await readFile(file, 'utf8')
    const next = original.replaceAll('/images/', '/api/media/images/')
    if (next !== original) {
      await writeFile(file, next, 'utf8')
      updated++
      console.log(`updated ${path.relative(root, file)}`)
    }
  }

  console.log(`\nUpdated ${updated} content file(s).`)
  console.log('Legacy /images/* URLs redirect to /api/media/images/* automatically.')
  console.log('After verifying locally, delete public/images/ and redeploy.')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
