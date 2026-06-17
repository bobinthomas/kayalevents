import { getRuntimeEnv } from '@/lib/runtime-env'

/** Git ref for GitHub API reads (e.g. `dev` on staging). Default branch when unset. */
export function getGitHubContentRef(): string | undefined {
  const ref = getRuntimeEnv('KEYSTATIC_GITHUB_REF')
  return ref && ref.length > 0 ? ref : undefined
}
