// Nightly-only test config (maintainer decision 2026-09-26). Targets ONLY the
// `*.nightly.test.*` suites, which the main config and vitest.local.config.ts both
// exclude: suites too slow for pre-push that still must run somewhere. Run by
// `npm run test:nightly`, scheduled in .github/workflows/validation-nightly.yml.
// Same shape as vitest.local.config.ts; see that file for why exclude/include are
// reset rather than merged.
import { mergeConfig, configDefaults, type UserConfig } from 'vitest/config'
import base from './vite.config'

const merged = mergeConfig(base, {}) as UserConfig & { test?: Record<string, unknown> }

merged.test = {
  ...(merged.test ?? {}),
  exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
  include: ['**/*.nightly.test.{ts,tsx}'],
  // A filter that resolves to nothing must fail, never report "0 failures" —
  // see the ZERO-MATCH FILTER TRAP note in vitest.local.config.ts.
  passWithNoTests: false,
}

export default merged
