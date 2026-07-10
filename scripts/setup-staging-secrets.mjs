#!/usr/bin/env node
/**
 * Staging uses its own GitHub OAuth App (classic OAuth apps allow only one callback URL).
 *
 *   npm run setup:staging-secrets
 *
 * Or non-interactive:
 *   KEYSTATIC_GITHUB_CLIENT_ID=Ov23... KEYSTATIC_GITHUB_CLIENT_SECRET=... npm run setup:staging-secrets
 */
import { execSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

async function put(name, value) {
  execSync(`npx wrangler secret put ${name} --env staging`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  console.log(`✓ ${name}`)
}

function patchWranglerClientId(clientId) {
  const path = 'wrangler.jsonc'
  const src = readFileSync(path, 'utf8')
  const next = src.replace(
    /"NEXT_PUBLIC_KEYSTATIC_GITHUB_CLIENT_ID": "REPLACE_WITH_STAGING_OAUTH_CLIENT_ID"/,
    `"NEXT_PUBLIC_KEYSTATIC_GITHUB_CLIENT_ID": "${clientId}"`,
  )
  if (next === src) {
    console.log('(wrangler.jsonc client ID already set or pattern not found — update manually if needed)')
    return
  }
  writeFileSync(path, next)
  console.log('✓ wrangler.jsonc staging client ID')
}

async function main() {
  const rl = createInterface({ input, output })

  let clientId = process.env.KEYSTATIC_GITHUB_CLIENT_ID?.trim()
  if (!clientId) {
    clientId = (
      await rl.question('Staging OAuth Client ID (new app from github.com/settings/developers): ')
    ).trim()
  }

  let secret = process.env.KEYSTATIC_GITHUB_CLIENT_SECRET?.trim()
  if (!secret) {
    secret = (await rl.question('Staging OAuth Client secret: ')).trim()
  }

  rl.close()

  if (!clientId || !secret) {
    console.error('Both KEYSTATIC_GITHUB_CLIENT_ID and KEYSTATIC_GITHUB_CLIENT_SECRET are required.')
    process.exit(1)
  }

  patchWranglerClientId(clientId)
  await put('KEYSTATIC_GITHUB_CLIENT_ID', clientId)
  await put('KEYSTATIC_GITHUB_CLIENT_SECRET', secret)

  console.log('\nRedeploy staging so the client ID is baked into the admin UI:')
  console.log('  npm run deploy:staging')
  console.log('\nThen open: https://kayalevents-dev.bobinthomas.workers.dev/keystatic')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
