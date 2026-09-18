// SPDX-License-Identifier: GPL-3.0-only
/**
 * lineage-admission.ts — the hub's mirror of `admission_state()` in
 * pqctoday-priv/maintenance/lineage/admit.py.
 *
 * The evidence door (admit.py) is the ONLY thing that writes a manifest
 * entry, and `admission_state(entry)` is its own definition of "this copy
 * may back a live row". The hub must agree with it exactly and must never
 * carry a hand-edited copy that drifts: lineage-admission.local.test.ts
 * parses admit.py whenever the sibling priv checkout is present and fails
 * if REJECT or the accepted `unified` values differ from what is here.
 * (CI has no priv checkout, so there the mirror is what runs — which is
 * why the local test exists: pre-push catches drift before CI trusts it.)
 *
 * Source (admit.py, 2026-09-18):
 *   REJECT = frozenset({"BOT-CHALLENGE", "ERROR-PAGE", "PAYWALL", "LOGIN-WALL",
 *     "REDIRECT", "JS-SHELL", "CONSENT-WALL", "LANDING", "EMPTY", "PARSE-FAILED",
 *     "BUNDLE", "PLACEHOLDER"})
 *   admission_state(entry):
 *     a, i, u = artefact, identity, unified
 *     if not (a and i and u): NOT_ADMITTED
 *     if a in REJECT or a == "FORMAT-MISMATCH": f"artefact {a}"
 *     if i == "CONTRADICTED": "identity CONTRADICTED"
 *     if u not in ("converted", "current"): f"unified {u}"
 *     "admitted"
 */

/** Rows/records stamped on or after this date are held to the ERROR tier (user decision 2026-09-17). */
export const LINEAGE_CUTOFF = '2026-09-18'

export const REJECT_ARTEFACTS: ReadonlySet<string> = new Set([
  'BOT-CHALLENGE',
  'ERROR-PAGE',
  'PAYWALL',
  'LOGIN-WALL',
  'REDIRECT',
  'JS-SHELL',
  'CONSENT-WALL',
  'LANDING',
  'EMPTY',
  'PARSE-FAILED',
  'BUNDLE',
  'PLACEHOLDER',
])

/** Checked beside REJECT in admit.py, not a member of it. */
export const FORMAT_MISMATCH = 'FORMAT-MISMATCH'

export const ADMITTED_UNIFIED: ReadonlySet<string> = new Set(['converted', 'current'])

/** What admit.py returns for an entry that never went through steps 1–3. */
export const NOT_ADMITTED = 'not admitted (no artefact/identity/unified)'

export interface AdmissionFields {
  artefact?: unknown
  identity?: unknown
  unified?: unknown
}

/** Mirror of admit.py's admission_state(): 'admitted', or the reason it is not. */
export function admissionState(entry: AdmissionFields): string {
  const a = typeof entry.artefact === 'string' ? entry.artefact : ''
  const i = typeof entry.identity === 'string' ? entry.identity : ''
  const u = typeof entry.unified === 'string' ? entry.unified : ''
  if (!a || !i || !u) return NOT_ADMITTED
  if (REJECT_ARTEFACTS.has(a) || a === FORMAT_MISMATCH) return `artefact ${a}`
  if (i === 'CONTRADICTED') return 'identity CONTRADICTED'
  if (!ADMITTED_UNIFIED.has(u)) return `unified ${u}`
  return 'admitted'
}
