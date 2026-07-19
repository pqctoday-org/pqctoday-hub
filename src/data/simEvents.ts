// SPDX-License-Identifier: GPL-3.0-only
/**
 * simEvents — the End-Quarter world-event pool for the simulation turn loop.
 * `{sector}` / `{country}` / `{authority}` tokens are substituted at draw
 * time. Severities map to the hub's status tokens (danger→error, warning,
 * success, info).
 *
 * Wave 1 item 2.5 (07192026): part of the pool is now DERIVED from the
 * maintained library/jurisdiction data (real NIST publication titles, real
 * per-country regulator names) rather than 100% hand-authored fiction — a
 * refresh to the underlying CSV now shows up here automatically, the same
 * "single source of truth" principle the exec-tour's REAL_DOC_GENERATORS
 * already established. A small hand-authored pool stays for texture
 * (`FICTION_*` below) — deliberately version-free (no product/date claims
 * that could go stale), matching the plan's explicit allowance.
 */
import { libraryData } from './libraryData'
import { jurisdictionFor } from './jurisdiction'

export type EventSeverity = 'danger' | 'warning' | 'success' | 'info'

export interface SimEvent {
  sev: EventSeverity
  /** Turn label, e.g. "Q3 2026". */
  t: string
  txt: string
}

// ---- derived: real library additions ("library additions (new standard
// published)" per the plan) -------------------------------------------------

/** Stable, hand-picked reference_ids — not "first N of the CSV", which would
 *  shift unpredictably as rows are added/reordered. Each is a real, active,
 *  NIST-authored, peer-reviewed-or-partial document genuinely relevant to a
 *  migration program. The event TEXT is still resolved live from
 *  `libraryData` at module load, so a title correction upstream propagates
 *  here without a code change — only the SELECTION is pinned. */
const FEATURED_LIBRARY_REFS = ['NIST SP 800-208', 'NIST SP 800-227', 'NIST IR 8545']

function deriveLibraryEvents(): string[] {
  const byId = new Map(libraryData.map((item) => [item.referenceId, item]))
  const out: string[] = []
  for (const ref of FEATURED_LIBRARY_REFS) {
    const item = byId.get(ref)
    if (!item) continue // dropped/renamed upstream — skip rather than cite a stale title
    out.push(
      `NIST publishes "${item.documentTitle}" (${item.referenceId}) — review for {sector} impact`
    )
  }
  return out
}

// ---- derived: real per-jurisdiction regulator names ------------------------

/** {authority} resolves via jurisdictionFor(countryId) at draw time (see
 *  fillEvent below) — these templates are safe to keep generic/date-free
 *  because the regulator NAME is a stable fact, unlike a claimed deadline. */
const JURISDICTION_WARNING_TEMPLATES = [
  '{authority} opens an audit window in {country} — evidence due next review cycle',
  '{authority} publishes updated hybrid-mandate guidance for {country} — re-check your stance',
]

// ---- hand-authored fiction pool (texture; deliberately version-free) ------

const FICTION_DANGER = [
  'Harvest-now capture suspected on classical TLS — {sector} records exposed',
  "Ransomware crew advertises 'store-now-decrypt-later' archive of your VPN traffic",
  'Auditor flags {country} hybrid-mandate gap — remediation clock started',
]
const FICTION_WARNING = [
  '{country} regulator opens an audit window — evidence due in 2 quarters',
  'Vendor slips ML-KEM delivery by a quarter — bridging pattern required',
  'RSA-2048 code-signing certificates flagged for sunset by your CA',
]
const FICTION_SUCCESS = [
  'Your TLS stack ships an AVX-512-optimized ML-DSA build — perf headroom recovered',
  'Pilot cutover clean: zero rollbacks on Tier-1 internet-facing service',
  'Vendor confirms dated ML-KEM commitment in renewed contract',
]
const FICTION_INFO = [
  'New CBOM scanner signatures available — re-run discovery',
  'Peer org in {sector} publishes their PQC migration retro',
]

export const SIM_EVENT_POOL: Record<EventSeverity, string[]> = {
  danger: FICTION_DANGER,
  warning: [...FICTION_WARNING, ...JURISDICTION_WARNING_TEMPLATES],
  success: FICTION_SUCCESS,
  info: [...FICTION_INFO, ...deriveLibraryEvents()],
}

/** Substitute {sector}/{country}/{authority} tokens in an event template.
 *  {authority} resolves via the real per-country jurisdiction data
 *  (jurisdiction.ts) — falls back to "the regulator" for a country with no
 *  registered rule, rather than leaving a raw unresolved token on screen. */
export function fillEvent(template: string, sectorLabel: string, countryId: string): string {
  const authority = jurisdictionFor(countryId)?.authority ?? 'the regulator'
  return template
    .replace('{sector}', sectorLabel.toLowerCase())
    .replace('{country}', countryId)
    .replace('{authority}', authority)
}
