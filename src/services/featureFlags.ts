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

/**
 * Structured claim citations — asks the model to emit a machine-checkable
 * `\`\`\`citations` block (claimExcerpt + chunkId pairs) alongside its
 * prose, verified against the retrieved chunks via exact chunk-id +
 * text-containment matching (citationVerification.ts), not fuzzy
 * entity-presence matching. Off by default: whether Gemini 2.5 Flash and
 * WebLLM Qwen3-8B reliably comply with the new output format across real
 * query variety is a live-traffic question that hasn't been measured —
 * flip on for measurement, then default-on once compliance is green. See
 * pqctoday-hub-assistant-hallucination-reduction-plan-08182026.md §7.1.
 */
export const useStructuredCitations = (): boolean =>
  readFlag('pqc-feature-structured-citations', 'VITE_FEATURE_STRUCTURED_CITATIONS')

/**
 * Mobile UX layer (design_handoff_pqc_mobile_ux, IMPLEMENTATION-PLAN.md).
 * Off by default: `MainLayout` and `SimulationView` keep rendering their
 * existing desktop/legacy-mobile trees exactly as today (Rule 1 — zero
 * full-size impact) until this is explicitly turned on. localStorage
 * override lets the branch be reviewed live without a rebuild; the
 * build-time env var is the release gate (§Phase 11 of the plan — flipping
 * the default is a deliberate go-live decision, not a side effect of
 * merging).
 */
export const useMobileShell = (): boolean =>
  readFlag('pqc-feature-mobile-shell', 'VITE_FEATURE_MOBILE_SHELL')
