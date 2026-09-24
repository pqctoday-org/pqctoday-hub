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

import type { SecondarySource } from './threatsData'

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
  status: ThreatClaimStatusFile | null,
  secondarySources?: SecondarySource[]
): SourceCaveat | null {
  // An approved second source states the description: the caveat's "our
  // analysis" is no longer true, and the second-source line says who does.
  if (secondarySources?.some((s) => s.claims.includes('threat_description'))) return null
  const entry = status?.rows?.[threatId]?.claims?.threat_description
  const verdict = entry?.verdict?.trim().toLowerCase()
  if (verdict !== 'undeterminable' && verdict !== 'contradicted') return null
  return { text: SOURCE_CAVEAT_TEXT, checkedAt: entry?.decidedAt?.trim() || undefined }
}

/** `sourceCaveatFor` against the bundled file. */
export function getSourceCaveat(
  threatId: string,
  secondarySources?: SecondarySource[]
): SourceCaveat | null {
  return sourceCaveatFor(threatId, THREAT_CLAIM_STATUS, secondarySources)
}

const CLAIM_WORDS: Record<string, string> = {
  threat_description: 'the threat description',
  crypto_at_risk: 'the cryptography at risk',
  pqc_replacement: 'the replacement',
}

/**
 * "Also stated in RFC 7935: the threat description." — one line per approved
 * second source, naming only the claims it was checked to state. A source
 * with no recognised claim gets no line.
 */
export function secondSourceLines(
  sources: SecondarySource[] | undefined
): { ref: string; text: string }[] {
  return (sources ?? []).flatMap((s) => {
    const words = s.claims.map((c) => CLAIM_WORDS[c]).filter(Boolean)
    if (words.length === 0) return []
    const list =
      words.length > 1 ? `${words.slice(0, -1).join(', ')} and ${words.at(-1)}` : words[0]
    return [{ ref: s.ref, text: `Also stated in ${s.ref}: ${list}.` }]
  })
}

/** The caveat as one line: the text plus "(checked <date>)" when dated. */
export function formatSourceCaveat(caveat: SourceCaveat): string {
  return caveat.checkedAt ? `${caveat.text} (checked ${caveat.checkedAt})` : caveat.text
}
