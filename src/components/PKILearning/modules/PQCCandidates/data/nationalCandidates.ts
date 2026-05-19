// SPDX-License-Identifier: GPL-3.0-only
/**
 * Candidate schemes advancing in non-NIST national standardisation tracks.
 * Limited to schemes published as finalists in their respective national
 * competitions (KpqC Korea, CACR China, CRYPTREC Japan).
 */

export type NationalTrack = 'kpqc' | 'cacr' | 'cryptrec'
export type AlgKind = 'KEM' | 'Signature'

export interface NationalCandidate {
  id: string
  name: string
  track: NationalTrack
  kind: AlgKind
  family: string
  /** Brief one-paragraph summary */
  summary: string
  /** Also a NIST on-ramp candidate? */
  alsoInNistOnRamp: boolean
}

export const NATIONAL_CANDIDATES: NationalCandidate[] = [
  // ── KpqC (Korea) ───────────────────────────────────────────────────────
  {
    id: 'smaug',
    name: 'SMAUG-T',
    track: 'kpqc',
    kind: 'KEM',
    family: 'Lattice (MLWE/MLWR hybrid)',
    summary:
      'KpqC Round 2 KEM finalist. Compact key sizes; uses combined MLWE + MLWR for performance-security balance.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'ntru-plus',
    name: 'NTRU+',
    track: 'kpqc',
    kind: 'KEM',
    family: 'Lattice (NTRU variant)',
    summary:
      'KpqC Round 2 KEM finalist. Improvement on classic NTRU with structural changes that simplify implementation.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'paloma',
    name: 'PALOMA',
    track: 'kpqc',
    kind: 'KEM',
    family: 'Code-based (QC-LDPC)',
    summary:
      'KpqC Round 2 KEM finalist. Code-based KEM for code-family diversity in the Korean portfolio.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'redog',
    name: 'REDOG',
    track: 'kpqc',
    kind: 'KEM',
    family: 'Code-based (rank metric)',
    summary: 'KpqC Round 2 KEM finalist. Rank-metric code-based design.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'layered-rollo',
    name: 'Layered ROLLO-I',
    track: 'kpqc',
    kind: 'KEM',
    family: 'Code-based (rank metric)',
    summary: 'KpqC Round 2 KEM finalist. Korean adaptation of the ROLLO design.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'haetae',
    name: 'HAETAE',
    track: 'kpqc',
    kind: 'Signature',
    family: 'Lattice (Module-LWE)',
    summary:
      'KpqC signature finalist. Also submitted to the NIST Additional Signatures Round 1 but did not advance to Round 2. Continued domestic evaluation in Korea.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'aimer',
    name: 'AIMer',
    track: 'kpqc',
    kind: 'Signature',
    family: 'Symmetric (MPCitH)',
    summary:
      'KpqC signature finalist. AIM symmetric primitive + MPC-in-the-Head transform — conceptually similar to FAEST but with a different symmetric base.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'solmae',
    name: 'SOLMAE',
    track: 'kpqc',
    kind: 'Signature',
    family: 'Lattice (NTRU variant)',
    summary: 'KpqC signature finalist. NTRU-style Falcon-adjacent design.',
    alsoInNistOnRamp: false,
  },

  // ── CACR (China) ───────────────────────────────────────────────────────
  {
    id: 'lac',
    name: 'LAC',
    track: 'cacr',
    kind: 'KEM',
    family: 'Lattice (Ring-LWE)',
    summary:
      'CACR competition winner. Originally a NIST Round 2 candidate but withdrew; continued as a domestic Chinese reference design.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'aigis',
    name: 'AIGIS',
    track: 'cacr',
    kind: 'Signature',
    family: 'Lattice (Module-LWE)',
    summary:
      'CACR signature track winner. Dilithium-family construction adapted for Chinese national standardisation; baseline for an expected SM-series PQC signature.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'aigis-enc',
    name: 'AIGIS-Enc',
    track: 'cacr',
    kind: 'KEM',
    family: 'Lattice (Module-LWE/LWR)',
    summary:
      'CACR KEM track winner. Kyber-family construction adapted for Chinese national standardisation.',
    alsoInNistOnRamp: false,
  },
  {
    id: 'scloud',
    name: 'SCloud',
    track: 'cacr',
    kind: 'KEM',
    family: 'Lattice (LWE)',
    summary:
      'CACR finalist using unstructured-LWE construction for conservative security at higher bandwidth cost — analogous role to FrodoKEM.',
    alsoInNistOnRamp: false,
  },

  // ── CRYPTREC (Japan) ───────────────────────────────────────────────────
  // Japan does not run its own PQC competition; instead CRYPTREC monitors
  // and is expected to adopt NIST PQC outputs once domestic deployment
  // guidance is mature. Listed here for completeness but with no domestic
  // finalists to enumerate.
]

export const KPQC_CANDIDATES = NATIONAL_CANDIDATES.filter((c) => c.track === 'kpqc')
export const CACR_CANDIDATES = NATIONAL_CANDIDATES.filter((c) => c.track === 'cacr')
