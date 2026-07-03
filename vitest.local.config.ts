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
}

export default merged
