// SPDX-License-Identifier: GPL-3.0-only
/**
 * Threat-classification engine for the Threats page (PER-PAGE-CHANGES Threats
 * #2–#6). One pure, side-effect-free derivation layer that the Threats UI reads
 * to surface five additive dimensions over the existing `ThreatData` corpus:
 *
 *   #2 threat_class      — HNDL (decrypt-later) vs HNFL/TNFL (forge-later),
 *                           read from the row's reviewed `threat_class` column
 *   #3 detection / SOC   — map a threat to its SOC use cases (UC-1–UC-5)
 *   #4 Shor-resource tier — grade `cryptoAtRisk` by quantum-resource urgency
 *                           (ECC-256 == RSA-2048 urgency, per §3 / Google 2026)
 *   #6 IR playbooks       — map a threat to the source's IR playbooks
 *
 * The class is reviewed data (ruling R1, 2026-09-24); the other dimensions are
 * derived from fields already in the threats CSV (`cryptoAtRisk`), reusing the
 * canonical `ALGORITHM_SECURITY_DATA` Shor/Grover qubit estimates maintained in
 * the QuantumThreats module.
 */
import { ALGORITHM_SECURITY_DATA } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import type { ThreatItem } from '@/data/threatsData'
import type { ReviewedThreatClass } from '@/data/threatRowRules'
import {
  SOC_IR_PLAYBOOKS,
  SOC_USE_CASES,
  type SocIrPlaybook,
  type SocIrPlaybookId,
  type SocUseCase,
  type SocUseCaseId,
} from '@/data/socQuantumPlaybook'

export type { SocIrPlaybook, SocUseCase } from '@/data/socQuantumPlaybook'

// ---------------------------------------------------------------------------
// #2 — Threat class: HNDL (confidentiality) vs HNFL/TNFL (authenticity)
// ---------------------------------------------------------------------------

/**
 * A threat's class is the row's REVIEWED `threat_class` (ruling R1,
 * 2026-09-24) — hndl, hnfl or both. There is no "unclassified" state on the
 * page any more: every published row carries a reviewed value (validator
 * TP-4). The keyword rules further down survive only as `guessThreatClass`, a
 * checker a unit test runs against the reviewed values; readers never see a
 * guessed class.
 */
export type ThreatClass = ReviewedThreatClass

export interface ThreatClassDef {
  id: ThreatClass
  /** Short label for filters / badges. */
  label: string
  /** Expanded name. */
  full: string
  /** What the attacker's clock is. */
  clock: string
  /** Security property at stake. */
  property: 'Confidentiality' | 'Authenticity' | 'Both'
}

export const THREAT_CLASS_DEFS: Record<ThreatClass, ThreatClassDef> = {
  hndl: {
    id: 'hndl',
    label: 'HNDL',
    full: 'Harvest Now, Decrypt Later',
    clock: "data's secrecy lifetime",
    property: 'Confidentiality',
  },
  hnfl: {
    id: 'hnfl',
    label: 'HNFL / TNFL',
    full: 'Harvest/Tamper Now, Forge Later',
    clock: "credential's validity period",
    property: 'Authenticity',
  },
  both: {
    id: 'both',
    label: 'HNDL + HNFL',
    full: 'Both decrypt-later and forge-later exposure',
    clock: 'whichever expires first',
    property: 'Both',
  },
}

/** Signature/authentication crypto → forge-later (HNFL/TNFL). */
const SIGNATURE_HINTS = [
  'ecdsa',
  'eddsa',
  'ed25519',
  'rsa-pss',
  'rsa signature',
  'signing',
  'signature',
  'pki',
  'certificate',
  'cert ',
  'code sign',
  'firmware',
  'dsa',
  'authentication',
  // No bare 'mac': as a substring it hit KMAC / AES-CMAC — symmetric MACs,
  // which Shor does not forge — and pulled rows like RAIL-001 into
  // forge-later on the strength of their symmetric crypto.
]

/** Key-exchange / encryption crypto → decrypt-later (HNDL). */
const ENCRYPTION_HINTS = [
  'rsa-2048',
  'rsa-3072',
  'rsa-4096',
  'rsa key',
  'key wrapping',
  'key management',
  'key exchange',
  'kem',
  'ecdh',
  'dh',
  'x25519',
  'tls',
  'encryption',
  // 'encrypted' is matched on a word boundary (see WORD_BOUNDARY_HINTS) so
  // "ADS-B (unencrypted)" — the absence of encryption — is not read as HNDL.
  'encrypted',
  'confidential',
  'kms',
  'at rest',
  'at-rest',
  'backup',
  'archival',
  'vpn',
]

/**
 * Substring presence in the threat's `cryptoAtRisk` field ONLY. Deliberately
 * excludes `pqcReplacement` (and `description`, which often echoes the
 * replacement) — those fields name the recommended PQC fix, e.g. "ML-DSA" /
 * "ML-KEM", and including them let the match fire on the substrings "dsa" /
 * "kem" *inside the replacement algorithm's own name*, misclassifying threats
 * regardless of what crypto is actually at risk. `cryptoAtRisk` describes what
 * the threat endangers, which is the only field that should drive HNDL/HNFL.
 */
function corpus(threat: ThreatItem): string {
  return threat.cryptoAtRisk.toLowerCase()
}

/** Hints that must match as a whole word rather than a substring. */
const WORD_BOUNDARY_HINTS = new Set(['encrypted'])

function hintMatches(haystack: string, needle: string): boolean {
  if (!WORD_BOUNDARY_HINTS.has(needle)) return haystack.includes(needle)
  // eslint-disable-next-line security/detect-non-literal-regexp -- needle is from the fixed hint list above
  return new RegExp(`\\b${needle}\\b`).test(haystack)
}

function anyHit(haystack: string, needles: string[]): boolean {
  return needles.some((n) => hintMatches(haystack, n))
}

/**
 * The keyword guess at a threat's class from its at-risk cryptography — kept
 * ONLY as a checker. `threatClassification.test.ts` runs it over the live
 * rows and reports where it disagrees with the reviewed `threat_class`, as a
 * prompt for a second look at either the row or the rules; nothing on the page
 * reads it. `null` = no signal either way.
 */
export function guessThreatClass(threat: ThreatItem): ThreatClass | null {
  const text = corpus(threat)
  const sig = anyHit(text, SIGNATURE_HINTS)
  const enc = anyHit(text, ENCRYPTION_HINTS)
  if (sig && enc) return 'both'
  if (sig) return 'hnfl'
  if (enc) return 'hndl'
  return null
}

/**
 * A threat's class: the row's reviewed `threat_class`. A row without one can
 * only be a hand-built fixture or a future row validator TP-4 would already
 * fail; it is shown as `both` — exposed on both clocks, counted in both
 * totals and given every use case — rather than hidden or guessed.
 */
export function getThreatClass(threat: ThreatItem): ThreatClass {
  return threat.threatClass ?? 'both'
}

/**
 * Does a threat match a class filter? Selecting HNDL shows hndl + both;
 * selecting HNFL shows hnfl + both — the same on desktop and mobile (UX-15).
 * `both` itself (only reachable from an old `?class=both` link) shows just the
 * rows classed both.
 */
export function threatMatchesClass(threat: ThreatItem, filter: ThreatClass): boolean {
  const cls = getThreatClass(threat)
  if (filter === 'both') return cls === 'both'
  return cls === filter || cls === 'both'
}

// ---------------------------------------------------------------------------
// #4 — Shor-resource tier: grade crypto_at_risk by quantum-resource urgency
// ---------------------------------------------------------------------------

export type ShorTier = 'imminent' | 'near' | 'grover' | 'safe' | 'unknown'

export interface ShorTierDef {
  id: ShorTier
  label: string
  /** Tailwind text colour token. */
  color: string
  /** Tailwind bg/border token. */
  bg: string
  blurb: string
}

export const SHOR_TIER_DEFS: Record<ShorTier, ShorTierDef> = {
  imminent: {
    id: 'imminent',
    label: 'Tier 1 — Imminent',
    color: 'text-destructive',
    bg: 'bg-destructive/10 border-destructive/20',
    blurb:
      'Shor-breakable with the fewest logical qubits (≲1,500). ECC-256 sits here alongside RSA-2048 — equal urgency, not equal key size.',
  },
  near: {
    id: 'near',
    label: 'Tier 2 — Near-term',
    color: 'text-warning',
    bg: 'bg-warning/10 border-warning/20',
    blurb:
      'Shor-breakable but needs more resource (larger RSA / P-384+). Still on the migration clock — close behind Tier 1, just needing more quantum resources.',
  },
  grover: {
    id: 'grover',
    label: 'Tier 3 — Grover-weakened',
    color: 'text-primary',
    bg: 'bg-primary/10 border-primary/20',
    blurb:
      'Symmetric/hash crypto only quadratically weakened by Grover. Double the key size (AES-256, SHA-384+) to stay safe.',
  },
  safe: {
    id: 'safe',
    label: 'PQC-safe',
    color: 'text-success',
    bg: 'bg-success/10 border-success/20',
    blurb: 'Already a NIST PQC parameter set — no quantum-resource exposure.',
  },
  unknown: {
    id: 'unknown',
    label: 'Unscored',
    color: 'text-muted-foreground',
    bg: 'bg-muted/30 border-border',
    blurb: 'No recognised algorithm token to grade; review manually.',
  },
}

/** Lowercased algorithm-name index over the canonical security table. */
const ALGO_INDEX = ALGORITHM_SECURITY_DATA.map((a) => ({
  key: a.name.toLowerCase(),
  data: a,
}))

/**
 * Classify a single algorithm token into a Shor tier. Reuses the published
 * logical-qubit estimates: standard deployed Shor-broken asymmetric (RSA-2048/
 * 3072 and every ECC curve, ≲6,200 logical qubits) is Tier-1 imminent — this
 * is the row's core point that ECC-256 carries the *same* urgency as RSA-2048,
 * not a smaller one. Oversized variants (RSA-4096, P-521) are Tier-2 near,
 * Grover-weakened symmetric/hash is Tier-3, and PQC sets are safe.
 */
const IMMINENT_QUBIT_CEILING = 6200

function tierForAlgo(token: string): ShorTier | null {
  const t = token.toLowerCase().trim()
  if (!t) return null
  const match = ALGO_INDEX.find((a) => t.includes(a.key) || a.key.includes(t))
  if (!match) return null
  const { data } = match
  if (data.type === 'pqc') return 'safe'
  if (data.quantumAttack === 'shor') {
    const qubits = data.estimatedQubits ?? Number.POSITIVE_INFINITY
    return qubits <= IMMINENT_QUBIT_CEILING ? 'imminent' : 'near'
  }
  if (data.quantumAttack === 'grover') {
    return data.status === 'safe' ? 'safe' : 'grover'
  }
  return 'safe'
}

const TIER_RANK: Record<ShorTier, number> = {
  imminent: 4,
  near: 3,
  grover: 2,
  safe: 1,
  unknown: 0,
}

/**
 * Family-level patterns for the loose free-text the CSV uses. Classical
 * tokens match only where they are not the tail of a hyphenated name, so the
 * "dsa" in ML-DSA / SLH-DSA / FN-DSA is never read as classical DSA. First
 * match wins, in urgency order.
 */
const FAMILY_TIERS: [RegExp, ShorTier][] = [
  [/(?<![\w-])(ecdsa|ecdh|ecc|p-?256|secp256|x25519|ed25519|curve25519)\b/, 'imminent'],
  [/(?<![\w-])(p-?521|rsa-?4096)\b/, 'near'],
  [/(?<![\w-])(rsa|dsa|dh|diffie|p-?384)\b/, 'imminent'],
  [/(?<![\w-])(aes|sha-?\d|sha3|hmac|symmetric)\b/, 'grover'],
  [/\b(ml-kem|ml-dsa|slh-dsa|fn-dsa|kyber|dilithium|sphincs|falcon|hqc)\b/, 'safe'],
]

/**
 * Grade a whole threat by the *most urgent* algorithm it puts at risk, read
 * from `cryptoAtRisk` ONLY. The description is deliberately excluded — it
 * usually describes the PQC *fix* ("migrate to ML-KEM"), and reading it
 * graded 22 active rows, Critical ones included, as "PQC-safe" (same bug
 * class `corpus()` above already fixed for the threat class). A row whose
 * at-risk text names no algorithm (e.g. "all public-key cryptography in NC3
 * systems") is `unknown` — Unscored — never `safe`: the generic word "PQC" is
 * not an algorithm.
 *
 * Canonical-table hits are taken first (max tier). If they found nothing, or
 * only PQC parameter sets, the family-level patterns for the loose free-text
 * the CSV uses ("RSA", "ECC", "AES") get a say, so a row naming both a
 * classical family and a PQC set grades by the classical one.
 */
export function getShorTier(threat: ThreatItem): ShorTier {
  const text = threat.cryptoAtRisk.toLowerCase()

  // Direct token hits against the canonical table.
  let best: ShorTier = 'unknown'
  for (const { key } of ALGO_INDEX) {
    if (text.includes(key)) {
      const tier = tierForAlgo(key)
      // eslint-disable-next-line security/detect-object-injection
      if (tier && TIER_RANK[tier] > TIER_RANK[best]) best = tier
    }
  }
  if (best !== 'unknown' && best !== 'safe') return best

  // Family-level fallbacks for the loose free-text the CSV often uses.
  const family = FAMILY_TIERS.find(([re]) => re.test(text))?.[1]
  // eslint-disable-next-line security/detect-object-injection
  if (family && TIER_RANK[family] > TIER_RANK[best]) return family
  return best
}

// ---------------------------------------------------------------------------
// #3 / #6 — Detection use cases and IR playbooks (Applied Quantum SOC section)
// ---------------------------------------------------------------------------

/**
 * Which of the source's five detection use cases apply to a threat, from its
 * class. Drift monitoring (UC2) watches every migrated system, so it applies
 * to every threat; decrypt-later exposure adds downgrade detection (UC1) and
 * horizon-weighted exfiltration detection (UC5); forge-later exposure adds
 * certificate-lifecycle (UC3) and signature-integrity (UC4) monitoring.
 */
const CLASS_USE_CASES: Record<ThreatClass, SocUseCaseId[]> = {
  hndl: ['hybrid-downgrade', 'hndl-indicator'],
  hnfl: ['cert-lifecycle-anomalies', 'tnfl-signature-integrity'],
  both: [
    'hybrid-downgrade',
    'cert-lifecycle-anomalies',
    'tnfl-signature-integrity',
    'hndl-indicator',
  ],
}

export function getSocUseCases(threat: ThreatItem): SocUseCase[] {
  const ids = new Set<SocUseCaseId>(['crypto-drift', ...CLASS_USE_CASES[getThreatClass(threat)]])
  return SOC_USE_CASES.filter((uc) => ids.has(uc.id))
}

/**
 * Which of the source's four IR playbooks are relevant to a threat. Algorithm
 * vulnerability disclosure, a credible CRQC announcement and emergency
 * rotation can reach any quantum-vulnerable system; a confirmed hybrid
 * downgrade is a key-exchange event, so it applies only to decrypt-later
 * exposure.
 */
export function getIrPlaybooks(threat: ThreatItem): SocIrPlaybook[] {
  const cls = getThreatClass(threat)
  const ids = new Set<SocIrPlaybookId>([
    'pqc-vulnerability-disclosure',
    'credible-crqc-announcement',
    'emergency-algorithm-rotation',
  ])
  if (cls === 'hndl' || cls === 'both') ids.add('confirmed-hybrid-downgrade')
  return SOC_IR_PLAYBOOKS.filter((pb) => ids.has(pb.id))
}
