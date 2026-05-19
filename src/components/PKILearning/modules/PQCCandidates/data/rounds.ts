// SPDX-License-Identifier: GPL-3.0-only
/**
 * NIST PQC standardisation lifecycle events — the timeline ribbon shown in
 * the Learn tab and the rounds simulator in Workshop step 1.
 */

export type EventKind =
  | 'milestone'
  | 'selection'
  | 'cryptanalysis'
  | 'reparameterisation'
  | 'standardisation'

export interface LifecycleEvent {
  id: string
  date: string // ISO YYYY-MM-DD (day-precision optional → use first of month if unknown)
  kind: EventKind
  title: string
  detail: string
  /** Optional candidate / scheme IDs affected (used by simulator to surface popups) */
  affects?: string[]
}

export const LIFECYCLE_EVENTS: LifecycleEvent[] = [
  {
    id: 'pqc-call-2016',
    date: '2016-12-20',
    kind: 'milestone',
    title: 'NIST PQC Standardisation call',
    detail:
      'NIST issues call for proposals for post-quantum public-key encryption, KEM, and signature schemes.',
  },
  {
    id: 'round-3-selection-2020',
    date: '2020-07-22',
    kind: 'selection',
    title: 'Original PQC Round 3 finalists',
    detail:
      'Kyber, Saber, NTRU, Classic McEliece (KEMs); Dilithium, Falcon, Rainbow (signatures). Plus alternates including SIKE, FrodoKEM, BIKE, HQC, SPHINCS+, Picnic, GeMSS.',
  },
  {
    id: 'sike-broken-2022',
    date: '2022-07-30',
    kind: 'cryptanalysis',
    title: 'SIKE broken — Castryck–Decru attack',
    detail:
      'A classical attack on Supersingular Isogeny Key Encapsulation recovers private keys in under an hour using a single core. SIKE eliminated. SQIsign is built on a different problem and is not affected.',
    affects: ['sqisign'],
  },
  {
    id: 'rainbow-broken-2022',
    date: '2022-02-25',
    kind: 'cryptanalysis',
    title: 'Rainbow broken — Beullens attack',
    detail:
      "A classical attack on the Rainbow multivariate signature scheme breaks all parameter sets. Rainbow eliminated. UOV (Rainbow's ancestor) was re-submitted in the on-ramp call.",
    affects: ['uov'],
  },
  {
    id: 'first-pqc-winners-2022',
    date: '2022-07-05',
    kind: 'selection',
    title: 'NIST selects ML-KEM, ML-DSA, FN-DSA, SLH-DSA',
    detail:
      'Kyber → ML-KEM, CRYSTALS-Dilithium → ML-DSA, Falcon → FN-DSA, SPHINCS+ → SLH-DSA. The first four PQC standards.',
  },
  {
    id: 'sig-on-ramp-call-2022',
    date: '2022-09-06',
    kind: 'milestone',
    title: 'NIST PQC Additional Signatures call',
    detail:
      'Recognising lattice over-concentration in the signature selections, NIST opens a parallel "on-ramp" call for additional digital signature schemes.',
  },
  {
    id: 'sig-round-1-2023',
    date: '2023-09-01',
    kind: 'milestone',
    title: 'Signature on-ramp Round 1 begins',
    detail: '40 submissions accepted for evaluation. First public cryptanalysis period opens.',
  },
  {
    id: 'fips-203-204-205-2024',
    date: '2024-08-13',
    kind: 'standardisation',
    title: 'FIPS 203 / 204 / 205 published',
    detail:
      'ML-KEM (FIPS 203), ML-DSA (FIPS 204), SLH-DSA (FIPS 205) become final federal standards.',
  },
  {
    id: 'sig-round-2-selection',
    date: '2024-10-24',
    kind: 'selection',
    title: 'NIST IR 8528 — Round 2 selection',
    detail:
      '14 of 40 first-round submissions advance to Round 2: CROSS, FAEST, HAWK, LESS, MAYO, Mirath, MQOM, PERK, QR-UOV, RYDE, SDitH, SNOVA, SQIsign, UOV. NIST cites security, performance, implementation characteristics, and IP as the four evaluation axes.',
  },
  {
    id: 'wedge-attack-2025',
    date: '2025-01-15',
    kind: 'cryptanalysis',
    title: 'Ran wedge attack on UOV (char 2)',
    detail:
      'Exterior-product attack exposes hidden oil subspace in characteristic-2 UOV instances. 3 of 4 UOV parameter sets fall below security target; MAYO-2 loses ~30 bits; most SNOVA parameter sets broken.',
    affects: ['uov', 'mayo', 'snova'],
  },
  {
    id: 'furue-ikematsu-2025',
    date: '2025-03-10',
    kind: 'cryptanalysis',
    title: 'Furue–Ikematsu small-field attack',
    detail:
      'Independent attack exploiting small-field characteristics in UOV pushes uov-Ip, uov-III, uov-V further below their advertised security strengths.',
    affects: ['uov'],
  },
  {
    id: 'hqc-kem-alternate-2025',
    date: '2025-03-11',
    kind: 'standardisation',
    title: 'HQC selected as KEM alternate',
    detail:
      'NIST announces HQC (code-based KEM) as the second KEM standard alongside ML-KEM — diversification against an unforeseen lattice break.',
  },
  {
    id: 'snova-reparam-2025',
    date: '2025-06-01',
    kind: 'reparameterisation',
    title: 'SNOVA odd-characteristic proposal',
    detail:
      'SNOVA team proposes modified parameters using odd-characteristic fields. Resulting Category-1 PK and signature are both smaller than FN-DSA.',
    affects: ['snova'],
  },
  {
    id: 'hawk-omsvp-refinement',
    date: '2025-07-15',
    kind: 'reparameterisation',
    title: 'HAWK omSVP refinement',
    detail:
      "HAWK team addresses an omSVP-definition discrepancy with a refined formulation. smLIP advances do not currently apply to HAWK's cyclotomic number fields.",
    affects: ['hawk'],
  },
  {
    id: 'sig-round-3-selection',
    date: '2026-01-01',
    kind: 'selection',
    title: 'Round 3 down-selection',
    detail:
      'Nine third-round candidates advance: FAEST, MQOM, SDitH (MPCitH); UOV, MAYO, QR-UOV, SNOVA (Multivariate); SQIsign (Isogeny); HAWK (Lattice). Five Round-2 schemes did not advance (CROSS, LESS, Mirath, PERK, RYDE).',
  },
  {
    id: 'sig-standard-projection',
    date: '2027-06-01',
    kind: 'standardisation',
    title: 'Earliest projected standardisation window',
    detail:
      'NIST flags a longer expected timeline for multivariate candidates; lattice / isogeny / MPCitH winners could see draft FIPS as early as 2027. Dates here are forecast, not commitment.',
  },
]
