// Local-only test config (directive 2026-07-01: new suites run on the local
// gate, not in CI). Reuses the main vite.config for resolve/plugins but targets
// ONLY the `*.local.test.*` suites that the main config deliberately excludes.
import { mergeConfig, configDefaults, type UserConfig } from 'vitest/config'
import base from './vite.config'

const merged = mergeConfig(base, {}) as UserConfig & { test?: Record<string, unknown> }

// Fully override exclude/include: the base exclude drops *.local.test.*, and
// mergeConfig would only concatenate — so reset both here to target them.
merged.test = {
  ...(merged.test ?? {}),
  exclude: [...configDefaults.exclude, 'e2e/**', '.claude/**'],
  include: ['**/*.local.test.{ts,tsx}'],
  // ZERO-MATCH FILTER TRAP (pinned 2026-09-26, do not flip to true).
  //
  // This config is the one the trap actually bit: its `include` above accepts
  // ONLY `*.local.test.{ts,tsx}`, so `npm run test:local -- <some path>` with a
  // plain `*.test.ts` under it resolves to nothing. That must exit non-zero, or
  // the command reports an honest-looking "0 failures" for a file it never
  // loaded — which happened twice on 2026-09-26 (see `gate:pkcs11`'s second
  // leg). Inherited from `base` via the spread, but restated explicitly because
  // mergeConfig + a future base edit could quietly drop it.
  // Proven in both directions by scripts/ci/zero-match-filter.test.ts.
  passWithNoTests: false,
}

export default merged
