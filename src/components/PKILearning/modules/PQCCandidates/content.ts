// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PQCCandidates module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-candidates',
  version: '1.0.0',
  lastReviewed: '2026-05-16',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8413'),
    getStandard('NIST IR 8545'),
    getStandard('NIST IR 8547'),
    getStandard('KpqC-Competition-Results'),
  ],

  algorithms: [],

  deadlines: [
    {
      label: 'NIST IR 8528 — Round 2 down-selection (additional signatures)',
      year: 2024,
      source: 'NIST IR 8528',
    },
    {
      label: 'HQC selected as KEM alternate',
      year: 2025,
      source: 'NIST IR 8545',
    },
    {
      label: 'Earliest projected on-ramp standardisation window',
      year: 2027,
      source: 'NIST IR 8528',
    },
    {
      label: 'KpqC target standardisation',
      year: 2029,
      source: 'KpqC-Competition-Results',
    },
  ],

  narratives: {
    overview:
      'PQC standardisation is a continuous, multi-track process — not a single 2024 event. NIST has finalised one KEM (ML-KEM / FIPS 203) and two signatures (ML-DSA / FIPS 204, SLH-DSA / FIPS 205), with a third signature (FN-DSA / FIPS 206) still in draft. HQC was selected as the alternate KEM in March 2025, and a signature on-ramp is mid-flight, down-selecting toward nine third-round candidates across four mathematical families. Parallel national processes in Korea (KpqC), China (CACR / OSCCA), and Japan (CRYPTREC) plus international tracks at ISO/IEC, IETF, and ETSI shape what actually ships in different jurisdictions.',
    keyConcepts:
      'Four mathematical families on the table: MPC-in-the-Head (FAEST, MQOM, SDitH) — symmetric-primitive trust, large signatures, small keys. Multivariate (UOV, MAYO, QR-UOV, SNOVA) — tiny signatures, big keys, recovering from the 2025 wedge attack. Isogeny (SQIsign) — smallest combined size of any PQC candidate but young assumptions and slow signing. Lattice (HAWK) — integer-only sampling alternative to FN-DSA.',
    validationProcess:
      'A candidate enters a round, gets benchmarked against NIST evaluation criteria (security, performance, implementation characteristics, IP), and is subjected to public cryptanalysis. Attacks like the 2022 SIKE break and the 2025 Ran wedge attack cull candidates or force reparameterisation. NIST publishes a status report (IR series) at the end of each round summarising what advanced and why.',
    worldwideProcess:
      'KpqC (Korea) ran its own competition and selected SMAUG-T, NTRU+, HAETAE, AIMer for national standardisation by 2029. CACR (China) selected LAC, AIGIS, and others; OSCCA is expected to publish PQC-extended SM-series specifications. ISO/IEC SC 27 adopts NIST PQC outputs as ISO/IEC 14888 and 18033 standards — the gating step for jurisdictions that pin procurement to ISO rather than FIPS. ETSI, IETF, BSI, ANSSI, and CRYPTREC overlay regional or protocol-specific guidance.',
    workshopSummary:
      'Six interactive steps: (1) Lifecycle simulator — advance a candidate through rounds and watch real cryptanalysis events fire. (2) Family math — animated visualisers for MPCitH, multivariate, isogeny, lattice. (3) Candidate comparator — sort/filter the 9 by use case. (4) Cryptanalysis timeline — SIKE break, Rainbow break, wedge attack, parameter pivots. (5) Future rounds forecaster — projected KEM diversification and post-2030 review cycles. (6) Worldwide standardisation map — NIST + KpqC + CACR + ISO/IEC + ETSI + IETF + CRYPTREC parallel tracks.',
    relatedStandards:
      'NIST IR 8528 (Round 2 on-ramp selection). NIST IR 8545 (HQC fourth-round selection). NIST IR 8547 (transition standards). FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA). KpqC Korea competition. CACR China competition.',
  },
}
