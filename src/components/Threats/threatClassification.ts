// SPDX-License-Identifier: GPL-3.0-only
/**
 * Threat-classification engine for the Threats page (PER-PAGE-CHANGES Threats
 * #2–#6). One pure, side-effect-free derivation layer that the Threats UI reads
 * to surface five additive dimensions over the existing `ThreatData` corpus:
 *
 *   #2 threat_class      — HNDL (decrypt-later) vs HNFL/TNFL (forge-later)
 *   #3 detection / SOC   — map a threat to its SOC use case (UC1–UC5)
 *   #4 Shor-resource tier — grade `cryptoAtRisk` by quantum-resource urgency
 *                           (ECC-256 == RSA-2048 urgency, per §3 / Google 2026)
 *   #6 IR playbook        — map a threat to its incident-response playbook
 *
 * Everything here is *derived* from fields already present in the threats CSV
 * (`cryptoAtRisk`, `pqcReplacement`, `description`), reusing the canonical
 * `ALGORITHM_SECURITY_DATA` Shor/Grover qubit estimates already maintained in
 * the QuantumThreats module. No CSV column is added; if a threat doesn't match
 * a rule it falls back to a neutral default so the page behaves as today.
 */
import { ALGORITHM_SECURITY_DATA } from '@/components/PKILearning/modules/QuantumThreats/data/quantumConstants'
import type { ThreatItem } from '@/data/threatsData'

// ---------------------------------------------------------------------------
// #2 — Threat class: HNDL (confidentiality) vs HNFL/TNFL (authenticity)
// ---------------------------------------------------------------------------

export type ThreatClass = 'hndl' | 'hnfl' | 'both'

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
  'mac',
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
  'encrypted',
  'confidential',
  'kms',
  'at rest',
  'at-rest',
  'backup',
  'archival',
  'vpn',
]

/** Substring presence in any of the threat's free-text crypto fields. */
function corpus(threat: ThreatItem): string {
  return `${threat.cryptoAtRisk} ${threat.pqcReplacement} ${threat.description}`.toLowerCase()
}

function anyHit(haystack: string, needles: string[]): boolean {
  return needles.some((n) => haystack.includes(n))
}

/**
 * Derive a threat's economic class. A threat exposing both encryption and
 * signing crypto (e.g. a full-PKI estate) is `both`; otherwise it leans to
 * whichever signal is present. Defaults to `hndl` (the harvest-now baseline)
 * when neither hint fires, matching the page's existing decrypt-later framing.
 */
export function getThreatClass(threat: ThreatItem): ThreatClass {
  const text = corpus(threat)
  const sig = anyHit(text, SIGNATURE_HINTS)
  const enc = anyHit(text, ENCRYPTION_HINTS)
  if (sig && enc) return 'both'
  if (sig) return 'hnfl'
  return 'hndl'
}

/** Does a threat match a selected class filter? `both` matches either lens. */
export function threatMatchesClass(threat: ThreatItem, filter: ThreatClass): boolean {
  const cls = getThreatClass(threat)
  if (cls === 'both') return true
  return cls === filter
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
      'Shor-breakable but needs more resource (larger RSA / P-384+). Still on the migration clock; weeks behind Tier 1.',
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
 * Grade a whole threat by the *most urgent* algorithm it puts at risk. We scan
 * the free-text `cryptoAtRisk` (and fall back to the broader corpus) for known
 * algorithm tokens and take the max tier. Heuristic tokens cover the common
 * free-text spellings the CSV uses ("ECDSA P-256", "RSA", "AES", "ECC").
 */
export function getShorTier(threat: ThreatItem): ShorTier {
  const haystack = `${threat.cryptoAtRisk} ${threat.description}`.toLowerCase()

  // Direct token hits against the canonical table.
  let best: ShorTier = 'unknown'
  for (const { key } of ALGO_INDEX) {
    if (haystack.includes(key)) {
      const tier = tierForAlgo(key)
      // eslint-disable-next-line security/detect-object-injection
      if (tier && TIER_RANK[tier] > TIER_RANK[best]) best = tier
    }
  }
  if (best !== 'unknown') return best

  // Family-level fallbacks for the loose free-text the CSV often uses.
  if (/\b(ecdsa|ecdh|ecc|p-?256|secp256|x25519|ed25519|curve25519)\b/.test(haystack))
    return 'imminent'
  if (/\b(p-?521|rsa-?4096)\b/.test(haystack)) return 'near'
  if (/\b(rsa|dsa|dh|diffie|p-?384)\b/.test(haystack)) return 'imminent'
  if (/\b(aes|sha-?\d|sha3|hmac|symmetric)\b/.test(haystack)) return 'grover'
  if (/\b(ml-kem|ml-dsa|slh-dsa|kyber|dilithium|sphincs|falcon|hqc|pqc)\b/.test(haystack))
    return 'safe'
  return 'unknown'
}

// ---------------------------------------------------------------------------
// #3 — Detection / SOC use case (SOC UC1–UC5, p.165–170)
// ---------------------------------------------------------------------------

export interface SocUseCase {
  /** Use-case id from the SOC chapter (UC1–UC5). */
  id: string
  title: string
  /** What the SOC is watching for. */
  detection: string
  /** Telemetry / signal source. */
  signal: string
}

export const SOC_USE_CASES: Record<string, SocUseCase> = {
  UC1: {
    id: 'UC1',
    title: 'Quantum-vulnerable handshake detection',
    detection:
      'Flag TLS/SSH/VPN handshakes still negotiating classical-only key exchange (RSA, ECDH) on internet-facing services.',
    signal: 'TLS inspection, JA3/JA4 fingerprints, network metadata',
  },
  UC2: {
    id: 'UC2',
    title: 'Harvest-Now-Decrypt-Later exfiltration',
    detection:
      'Detect bulk capture or exfiltration of long-lived encrypted data — the precursor to a future decrypt-later attack.',
    signal: 'DLP, egress volume anomalies, packet-capture at boundaries',
  },
  UC3: {
    id: 'UC3',
    title: 'Signature-forgery / certificate abuse',
    detection:
      'Monitor for anomalous use of signing keys, unexpected certificate issuance, or code/firmware signed outside change windows.',
    signal: 'CA/CT logs, code-signing telemetry, PKI audit trail',
  },
  UC4: {
    id: 'UC4',
    title: 'Crypto-agility / config drift',
    detection:
      'Alert when deployed crypto config drifts below policy (downgrade to vulnerable suites, expired PQC pilots reverting).',
    signal: 'CBOM diffing, config-management state, scanner output',
  },
  UC5: {
    id: 'UC5',
    title: 'CTI — CRQC capability tracking',
    detection:
      'Track external CRQC progress signals and adversary PQC-tooling so detection thresholds move with the threat.',
    signal: 'Threat-intel feeds, vendor disclosures, CRQC estimate updates',
  },
}

/**
 * Map a threat to its primary SOC use case. Forge-later threats route to the
 * signature-forgery use case (UC3); decrypt-later to HNDL exfiltration (UC2);
 * everything classical-handshake-shaped gets the handshake detector (UC1).
 * Always returns at least UC1 + UC5 so every threat shows actionable detection.
 */
export function getSocUseCases(threat: ThreatItem): SocUseCase[] {
  const cls = getThreatClass(threat)
  const out: SocUseCase[] = [SOC_USE_CASES.UC1]
  if (cls === 'hndl' || cls === 'both') out.push(SOC_USE_CASES.UC2)
  if (cls === 'hnfl' || cls === 'both') out.push(SOC_USE_CASES.UC3)
  out.push(SOC_USE_CASES.UC4)
  out.push(SOC_USE_CASES.UC5)
  return out
}

// ---------------------------------------------------------------------------
// #6 — Incident-response playbook link (SOC p.171–173)
// ---------------------------------------------------------------------------

export interface IrPlaybook {
  id: string
  title: string
  summary: string
  /** Anchor on the Command Center IR-playbook generator. */
  href: string
}

export const IR_PLAYBOOKS: Record<ThreatClass, IrPlaybook> = {
  hndl: {
    id: 'pb-hndl',
    title: 'Decrypt-Later Exposure Response',
    summary:
      'Scope harvested-data blast radius, rotate long-lived keys, re-encrypt at-rest data with PQC, and notify per data-breach obligations.',
    href: '/business?tool=ir-playbook&scenario=hndl',
  },
  hnfl: {
    id: 'pb-hnfl',
    title: 'Signature-Forgery / Key-Compromise Response',
    summary:
      'Revoke and re-issue affected certificates, invalidate forged artifacts, rebuild trust chains on PQC signatures, and audit downstream verifiers.',
    href: '/business?tool=ir-playbook&scenario=hnfl',
  },
  both: {
    id: 'pb-both',
    title: 'Combined Crypto-Compromise Response',
    summary:
      'Run both the decrypt-later and forge-later playbooks: contain harvested data and revoke/re-issue credentials in parallel.',
    href: '/business?tool=ir-playbook&scenario=combined',
  },
}

export function getIrPlaybook(threat: ThreatItem): IrPlaybook {
  return IR_PLAYBOOKS[getThreatClass(threat)]
}
