// SPDX-License-Identifier: GPL-3.0-only
/**
 * Pure-move extraction (IMPLEMENTATION-PLAN.md §5.4, E-4) — the PQC-only
 * scope toggle's localStorage key, URL param name, and the two read
 * functions were module-private to PatentsViewRedesign.tsx. Moved verbatim
 * so the mobile Patents screen reads and persists the same scope state the
 * desktop page does, rather than a separate toggle. PatentsViewRedesign.tsx
 * re-imports all four from here under the same names.
 *
 * `isPqcPatent` (the actual per-patent scope predicate) stays in
 * patentColumns.ts — it's already a pure data/logic module, not a view
 * component, and is woven through more of that file than this move's scope
 * covers. Mobile Patents (Phase 7) reads the already-scoped results via
 * usePatentKpis() rather than re-filtering itself.
 */

export const PQC_ONLY_LS_KEY = 'pqc-patents-pqc-only'
export const SCOPE_PARAM = 'scope'

export function readPqcOnly(): boolean {
  try {
    const saved = localStorage.getItem(PQC_ONLY_LS_KEY)
    return saved === null ? true : saved === 'true'
  } catch {
    return true
  }
}

/** Explicit scope from a shared-link URL, if present. `null` = not present in URL. */
export function readScopeParam(params: URLSearchParams): boolean | null {
  const s = params.get(SCOPE_PARAM)
  if (s === 'all') return false
  if (s === 'pqc') return true
  return null
}
