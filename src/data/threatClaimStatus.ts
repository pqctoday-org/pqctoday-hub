// SPDX-License-Identifier: GPL-3.0-only
/**
 * Per-threat claim verdicts from the private claim ledger
 * (`public/threats/claim-status.json`, written by the data pipeline): for each
 * row, whether the document it cites TODAY states each claim. Verdict words
 * only — no document text, and none of the internal data_quality_notes.
 *
 * The page uses exactly one thing from it: when the cited document does not
 * itself state the row's quantum-specific description, the detail view says
 * so in one muted line. Loaded the way trustScoreData loads the evidence
 * manifests (eager import.meta.glob), so a missing file means "no caveat",
 * never a crash.
 */

export type ClaimVerdict = 'supported' | 'undeterminable' | 'contradicted'

interface ClaimEntry {
  verdict?: string
  decidedAt?: string
}

export interface ThreatClaimStatusFile {
  version?: number
  rows?: Record<string, { evidenceSha256?: string; claims?: Record<string, ClaimEntry> }>
}

const claimStatusModules = import.meta.glob('/public/threats/claim-status.json', {
  import: 'default',
  eager: true,
}) as Record<string, ThreatClaimStatusFile>

/** The bundled claim-status file, or null when it is not present. */
export const THREAT_CLAIM_STATUS: ThreatClaimStatusFile | null =
  Object.values(claimStatusModules)[0] ?? null

export const SOURCE_CAVEAT_TEXT =
  "The cited source is the regulation or standard behind this entry. It doesn't itself state the quantum-specific points above — those are our analysis."

export interface SourceCaveat {
  text: string
  /** When the verdict was reached (YYYY-MM-DD), if recorded. */
  checkedAt?: string
}

/**
 * The reader caveat for a threat, or null. Shown when the verdict on the
 * row's `threat_description` is "undeterminable" OR "contradicted" — the two
 * are treated identically on purpose: these are AI verdicts, and at least one
 * "contradicted" (AERO-002) is a naming mix-up (Kyber vs ML-KEM), so the page
 * must never claim the source disagrees. "supported", an absent row, or an
 * absent file → no caveat.
 */
export function sourceCaveatFor(
  threatId: string,
  status: ThreatClaimStatusFile | null
): SourceCaveat | null {
  const entry = status?.rows?.[threatId]?.claims?.threat_description
  const verdict = entry?.verdict?.trim().toLowerCase()
  if (verdict !== 'undeterminable' && verdict !== 'contradicted') return null
  return { text: SOURCE_CAVEAT_TEXT, checkedAt: entry?.decidedAt?.trim() || undefined }
}

/** `sourceCaveatFor` against the bundled file. */
export function getSourceCaveat(threatId: string): SourceCaveat | null {
  return sourceCaveatFor(threatId, THREAT_CLAIM_STATUS)
}

/** The caveat as one line: the text plus "(checked <date>)" when dated. */
export function formatSourceCaveat(caveat: SourceCaveat): string {
  return caveat.checkedAt ? `${caveat.text} (checked ${caveat.checkedAt})` : caveat.text
}
