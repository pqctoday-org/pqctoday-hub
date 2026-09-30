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

/**
 * T16 — embedding-based passage retrieval at runtime.
 * On by default. The bundled embedding index improves recall without sending
 * queries to a service. Build-time or localStorage `0` is an emergency opt-out.
 */
export const useEmbeddingRetrieval = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env
  if (env?.VITE_FEATURE_EMBEDDING_RETRIEVAL === '0') return false
  try {
    if (localStorage.getItem('pqc-feature-embedding-retrieval') === '0') return false
  } catch {
    // Storage unavailable: keep the safe bundled default.
  }
  return true
}

/**
 * Structured claim citations — asks the model to emit a machine-checkable
 * `\`\`\`citations` block (claimExcerpt + chunkId pairs) alongside its
 * prose, verified against the retrieved chunks via exact chunk-id +
 * text-containment matching (citationVerification.ts), not fuzzy
 * entity-presence matching. Always on: corpus-only mode cannot safely
 * display model output without claim-to-chunk evidence. Kept as a function
 * so existing callers retain a stable API.
 */
export const useStructuredCitations = (): boolean => true

/**
 * Mobile UX layer (design_handoff_pqc_mobile_ux, IMPLEMENTATION-PLAN.md).
 * ON by default as of 2026-08-23 — a deliberate go-live decision made
 * directly by the user, not a side effect of a merge. Every phone visitor
 * (viewport below `lg`, not embedded — see useIsMobileShell) now sees this
 * layer. Finished sections (Home, Explore, Learn) get the real mobile
 * redesign; sections not yet rebuilt fall back to their desktop rendering
 * inside the mobile chrome, or an explicit "not built for mobile yet"
 * message where one exists — never a blank or broken screen (Rule 1 still
 * guarantees desktop at >=lg is completely unaffected either way).
 *
 * Opt-out without a rebuild: localStorage 'pqc-feature-mobile-shell' = '0'.
 * Opt-out at build time: VITE_FEATURE_MOBILE_SHELL = '0'. ('1' / unset both
 * mean on, kept for anyone who already has the old opt-in value set.)
 */
export const useMobileShell = (): boolean => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const env = (import.meta as any).env
  if (env && env.VITE_FEATURE_MOBILE_SHELL === '0') return false
  try {
    if (
      typeof localStorage !== 'undefined' &&
      localStorage.getItem('pqc-feature-mobile-shell') === '0'
    ) {
      return false
    }
  } catch {
    // SSR / private-mode / Safari ITP — fall through to default-on
  }
  return true
}
