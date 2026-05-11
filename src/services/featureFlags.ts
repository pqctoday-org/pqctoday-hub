// SPDX-License-Identifier: GPL-3.0-only
/**
 * Feature flags — central registry for runtime-toggleable behaviour.
 *
 * Each flag has two sources, checked in order:
 *   1. Vite build-time env var `VITE_FEATURE_<NAME>` (`'1'` enables)
 *   2. localStorage key `pqc-feature-<name>` (`'1'` enables)
 *
 * Build-time wins over localStorage to give releases an authoritative
 * default. localStorage is the developer / power-user override that
 * doesn't require a rebuild.
 *
 * Flags here are PHASE-1+ runtime additions; existing toggles (provider,
 * persona, etc.) live in their own Zustand stores.
 */

function readFlag(name: string, envKey: string): boolean {
  // Build-time env var (Vite inlines `import.meta.env.VITE_*` at build time).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env
  if (env && env[envKey] === '1') return true
  try {
    if (typeof localStorage !== 'undefined' && localStorage.getItem(name) === '1') return true
  } catch {
    // SSR / private-mode / Safari ITP — fall through
  }
  return false
}

/**
 * T16 — embedding-based passage retrieval at runtime.
 * Off by default in the first release; flip on for measurement, then
 * default-on once telemetry is green (per embedding-optimization.md §9.1).
 */
export const useEmbeddingRetrieval = (): boolean =>
  readFlag('pqc-feature-embedding-retrieval', 'VITE_FEATURE_EMBEDDING_RETRIEVAL')
