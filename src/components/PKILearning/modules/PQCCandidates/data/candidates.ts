// SPDX-License-Identifier: GPL-3.0-only
/**
 * The nine NIST PQC Additional Signatures Round 2 → Round 3 candidates.
 *
 * Sizes shown are NIST Category 1 representative parameter sets where a
 * stable Round 2 spec exists. Cross-checked against
 * src/data/pqc_complete_algorithm_reference_05072026.csv and NIST IR 8528.
 */
import type { FamilyId } from './families'

export type CandidateStatus = 'advancing' | 'reparameterised' | 'shrunk' | 'stable'

export interface Candidate {
  /** Stable URL-safe ID */
  id: string
  /** Display name as used by the submission team */
  name: string
  /** Mathematical family */
  family: FamilyId
  /** NIST Category 1 public key size (bytes) */
  publicKeyBytes: number
  /** NIST Category 1 signature size (bytes) */
  signatureBytes: number
  /** NIST Category 1 private key size (bytes) */
  privateKeyBytes: number
  /** Underlying hardness assumption (short label) */
  hardness: string
  /** One-sentence pitch — why NIST kept this scheme */
  whyAdvanced: string
  /** Round-2 status flag */
  status: CandidateStatus
  /** Specific concerns flagged by NIST or recent cryptanalysis */
  caveats: string
  /** Canonical reference URL */
  referenceUrl: string
}

export const CANDIDATES: Candidate[] = [
  // ── MPC-in-the-Head ────────────────────────────────────────────────────
  {
    id: 'faest',
    name: 'FAEST',
    family: 'mpcith',
    publicKeyBytes: 32,
    privateKeyBytes: 32,
    signatureBytes: 6336,
    hardness: 'AES (symmetric)',
    whyAdvanced:
      'Security reduces to AES — the most studied symmetric cipher in existence. Most conservative MPCitH foundation.',
    status: 'stable',
    caveats:
      'Signatures are 5.7–28 KB depending on parameter set; bandwidth cost is the tradeoff for tiny keys.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    id: 'mqom',
    name: 'MQOM',
    family: 'mpcith',
    publicKeyBytes: 80,
    privateKeyBytes: 128,
    signatureBytes: 3540,
    hardness: 'Random multivariate quadratic (MQ)',
    whyAdvanced:
      'Best combined pk+sig sizes across all three NIST levels among MPCitH candidates; competitive signing/verification speeds. MQOM v2 (Round 2) halved signature size vs v1 — Category I now 2.8–4.2 KB across variants.',
    status: 'stable',
    caveats:
      'NIST explicitly flagged that ROM and QROM security proofs need further maturation. Multiple parameter sets (gf2/gf256 × short/fast); sizes shown are for MQOM2-L1-gf256-short-3r (recommended).',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    id: 'sdith',
    name: 'SDitH',
    family: 'mpcith',
    publicKeyBytes: 70,
    privateKeyBytes: 163,
    signatureBytes: 3705,
    hardness: 'Syndrome decoding (random linear codes)',
    whyAdvanced:
      "Coding-theory hardness is studied since the 1970s — alongside FAEST's AES, the most well-analysed foundation in the MPCitH category. SDitH-2 Round 2 achieves pk+sig combined of 3.7 KB at Cat I.",
    status: 'stable',
    caveats:
      'Typically slower than MQOM and FAEST; sizes only become competitive with careful tuning. Sizes shown are for SDitH2-L1-gf2-short (recommended Cat I variant).',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },

  // ── Multivariate ───────────────────────────────────────────────────────
  {
    id: 'uov',
    name: 'UOV',
    family: 'multivariate',
    publicKeyBytes: 66000,
    privateKeyBytes: 237000,
    signatureBytes: 96,
    hardness: 'Unbalanced Oil and Vinegar (MQ + trapdoor)',
    whyAdvanced:
      'Smallest signatures in the competition at NIST Category 1 (96 B). Construction dates to 1999 — an old, well-studied design. Raw uov-Ip public key is ~66 KB; compressed pk ~1.2 KB is recommended for deployment.',
    status: 'reparameterised',
    caveats:
      '2025 Ran wedge attack + Furue–Ikematsu small-field attack pushed 3 of 4 parameter sets (uov-Ip, uov-III, uov-V) below their security targets. Reparameterisation with odd-characteristic fields restores security.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    id: 'mayo',
    name: 'MAYO',
    family: 'multivariate',
    publicKeyBytes: 1168,
    privateKeyBytes: 24,
    signatureBytes: 321,
    hardness: 'UOV variant — whipping algorithm expands seed to UOV instance',
    whyAdvanced:
      "Tiny SK (24 B) and small signature (321 B) with manageable PK (~1.1 KB). Solves UOV's public-key-size problem via seed expansion.",
    status: 'shrunk',
    caveats:
      'MAYO-2 lost ~30 bits to the wedge attack at Category 1. Reparameterisation in progress; expected to recover.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    id: 'qr-uov',
    name: 'QR-UOV',
    family: 'multivariate',
    publicKeyBytes: 24255,
    privateKeyBytes: 32,
    signatureBytes: 200,
    hardness: 'Quotient-ring UOV (odd characteristic)',
    whyAdvanced:
      'Only multivariate candidate immune to the original Ran wedge attack — odd-characteristic field design dodged the structural exploit. Sizes shown are for recommended Cat I set (q=127, v=156, m=54, ℓ=3).',
    status: 'stable',
    caveats:
      'Subsequent extensions of the wedge attack to odd characteristic did not reduce security below existing attack complexities, but the analysis remains ongoing.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
  {
    id: 'snova',
    name: 'SNOVA',
    family: 'multivariate',
    publicKeyBytes: 1016,
    privateKeyBytes: 48,
    signatureBytes: 248,
    hardness: 'Simple Noncommutative-ring UOV (block-ring + whipping)',
    whyAdvanced:
      'Most aggressive size optimisation in the multivariate family. Post-reparameterisation Category 1 PK+sig is smaller than FN-DSA.',
    status: 'reparameterised',
    caveats:
      'NIST notes SNOVA has "not reached a stable form" — original parameter sets were hit hardest by the wedge attack, sometimes by a wide margin. Odd-characteristic reparameterisation is the active proposal.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },

  // ── Isogeny ────────────────────────────────────────────────────────────
  {
    id: 'sqisign',
    name: 'SQIsign',
    family: 'isogeny',
    publicKeyBytes: 65,
    privateKeyBytes: 353,
    signatureBytes: 148,
    hardness: 'Supersingular isogeny endomorphism ring problem',
    whyAdvanced:
      'Smallest combined pk+sig of any PQC signature candidate by a wide margin (148 B sig + 65 B pk at NIST Cat 1, fits in one Ethernet frame).',
    status: 'stable',
    caveats:
      'Cousin scheme SIKE was broken in 2022 by torsion-point exploit — SQIsign does not expose torsion points but the math remains young. Constant-time signing is an open implementation challenge.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },

  // ── Lattice ────────────────────────────────────────────────────────────
  {
    id: 'hawk',
    name: 'HAWK',
    family: 'lattice',
    publicKeyBytes: 1024,
    privateKeyBytes: 2480,
    signatureBytes: 555,
    hardness: 'Search Module Lattice Isomorphism (smLIP) + One-More-SVP (omSVP)',
    whyAdvanced:
      'Compact lattice signatures with integer-only arithmetic — eliminates the floating-point side-channel hazard that makes FN-DSA hard to deploy on constrained hardware.',
    status: 'stable',
    caveats:
      'omSVP discrepancy required formal-definition refinement during Round 2. NIST flagged smLIP for further community analysis.',
    referenceUrl:
      'https://csrc.nist.gov/projects/pqc-dig-sig/round-2-additional-digital-signature-schemes',
  },
]

export const CANDIDATES_BY_ID: Record<string, Candidate> = Object.fromEntries(
  CANDIDATES.map((c) => [c.id, c])
)

export function getCandidate(id: string): Candidate | undefined {
  return CANDIDATES_BY_ID[id] // eslint-disable-line security/detect-object-injection
}
