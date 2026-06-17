#!/usr/bin/env node
/**
 * One-time staging secrets sync.
 *
 * Usage (paste your GitHub OAuth App client secret when prompted):
 *   npm run setup:staging-secrets
 *
 * Or non-interactive:
 *   KEYSTATIC_GITHUB_CLIENT_SECRET=gho_... npm run setup:staging-secrets
 */
import { execSync } from 'node:child_process'
import { createInterface } from 'node:readline/promises'
import { stdin as input, stdout as output } from 'node:process'

async function put(name, value) {
  execSync(`npx wrangler secret put ${name} --env staging`, {
    input: value,
    stdio: ['pipe', 'inherit', 'inherit'],
  })
  console.log(`✓ ${name}`)
}

async function main() {
  let secret = process.env.KEYSTATIC_GITHUB_CLIENT_SECRET?.trim()
  if (!secret) {
    const rl = createInterface({ input, output })
    secret = (await rl.question('GitHub OAuth client secret (from github.com/settings/developers): ')).trim()
    rl.close()
  }
  if (!secret) {
    console.error('KEYSTATIC_GITHUB_CLIENT_SECRET is required.')
    process.exit(1)
  }
  await put('KEYSTATIC_GITHUB_CLIENT_SECRET', secret)
  console.log('\nDone. Test CMS: https://kayalevents-dev.bobinthomas.workers.dev/keystatic')
  console.log('Add OAuth callback if missing:')
  console.log('  https://kayalevents-dev.bobinthomas.workers.dev/api/keystatic/github/oauth/callback')
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
