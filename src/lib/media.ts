import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { getCloudflareContext } from '@opennextjs/cloudflare'
import { getRuntimeEnv } from '@/lib/runtime-env'
import { MEDIA_URL_PREFIX } from '@/lib/media-url'

const REPO = 'bobinthomas/kayalevents'
const MEDIA_ROOT = 'content/media/images'

const MIME: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
}

export function mediaContentPath(urlPath: string): string {
  const normalized = urlPath.replace(/^\/+/, '')
  const prefix = MEDIA_URL_PREFIX.replace(/^\/+/, '')
  if (!normalized.startsWith(prefix)) {
    throw new Error('Invalid media path')
  }
  const relative = normalized.slice(prefix.length)
  if (relative.includes('..')) {
    throw new Error('Invalid media path')
  }
  return path.posix.join(MEDIA_ROOT, relative)
}

export function contentTypeFor(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase()
  return MIME[ext] ?? 'application/octet-stream'
}

async function readFromGitHub(repoPath: string): Promise<ArrayBuffer> {
  const token = getRuntimeEnv('KEYSTATIC_GITHUB_TOKEN')
  if (!token) {
    throw new Error('KEYSTATIC_GITHUB_TOKEN is required to serve media on Workers')
  }

  const url = `https://api.github.com/repos/${REPO}/contents/${repoPath}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github.raw',
      'User-Agent': 'kayalevents/1.0 (media)',
    },
    next: { revalidate: 300 },
  })

  if (!res.ok) {
    throw new Error(`GitHub media fetch failed (${res.status})`)
  }

  return res.arrayBuffer()
}

async function readFromDisk(repoPath: string): Promise<ArrayBuffer> {
  const absolute = path.join(process.cwd(), repoPath)
  try {
    const buffer = await readFile(absolute)
    return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
  } catch {
    if (repoPath.startsWith(MEDIA_ROOT)) {
      const legacy = repoPath.replace(MEDIA_ROOT, 'public/images')
      const legacyAbs = path.join(process.cwd(), legacy)
      const buffer = await readFile(legacyAbs)
      return buffer.buffer.slice(buffer.byteOffset, buffer.byteOffset + buffer.byteLength)
    }
    throw new Error('Media file not found')
  }
}

/** Read image bytes from the repo (local disk in dev, GitHub API on Workers). */
export async function readMediaBytes(repoPath: string): Promise<ArrayBuffer> {
  try {
    getCloudflareContext()
    return readFromGitHub(repoPath)
  } catch {
    return readFromDisk(repoPath)
  }
}
