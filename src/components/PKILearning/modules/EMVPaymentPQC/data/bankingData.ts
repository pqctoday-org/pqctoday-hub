// SPDX-License-Identifier: GPL-3.0-only
/**
 * Banking and interbank-settlement data for the Financial Services & Payments
 * module (the banking half of the card/banking/retail merge).
 *
 * Grounded in cached evidence, quoted rather than recalled:
 *  - EPC 342-08 v16.0.1, 24 June 2026 — the annual European payments crypto
 *    guideline. Library `EPC-342-08-v16-0-1-Guidelines-on-Cryptographic-Algorithms-Us`.
 *  - Swift Customer Security Controls Framework v2026 — library
 *    `Swift-Customer-Security-Controls-Framework-CSCF-v2026`.
 *  - BIS Project Leap Phase 2 (othp107) — library `BIS-OTHP107`.
 *  - CMORG PQC guidance, Europol Quantum Safe Financial Forum, FS-ISAC
 *    migration timeline, G7 Cyber Expert Group, MAS, HKMA.
 */

export interface SettlementRail {
  id: string
  label: string
  description: string
  /** what protects it today */
  classical: string
  /** confidentiality lifetime that drives HNDL exposure */
  dataLifetime: string
  pqcPosture: string
}

export const SETTLEMENT_RAILS: SettlementRail[] = [
  {
    id: 'swift',
    label: 'Swift messaging (FIN / ISO 20022)',
    description:
      'Cross-border instruction messaging between correspondent institutions. Not itself a settlement system — it moves the instruction, not the money.',
    classical: 'TLS + PKI-based message authentication; controls 2.1/2.4/2.5A/2.6 of the CSCF',
    dataLifetime:
      'Instruction metadata is commercially sensitive for years; sanctions and AML records are retained far longer.',
    pqcPosture:
      'The CSCF v2026 points these controls at Swift’s cryptography guidance, which Swift states will be updated in line with its post-quantum strategy. No dated mandate yet.',
  },
  {
    id: 'rtgs',
    label: 'Domestic RTGS',
    description:
      'Real-time gross settlement operated by a central bank — the leg where finality actually happens.',
    classical: 'HSM-backed signing, national PKI, TLS between participants',
    dataLifetime:
      'Individual payments are short-lived, but participant identity keys and the audit trail are long-lived.',
    pqcPosture:
      'BIS Project Leap Phase 2 is the reference experiment — quantum-proofing payment-system communications between central banks.',
  },
  {
    id: 'correspondent',
    label: 'Correspondent banking chains',
    description:
      'A payment may traverse several institutions. Security is only as good as the weakest hop, and no single party sees the whole chain.',
    classical: 'Bilateral TLS + message authentication at each hop',
    dataLifetime:
      'Each hop retains records independently — HNDL exposure multiplies along the chain.',
    pqcPosture:
      'The hardest coordination problem in the sector: migration cannot be unilateral, which is why the sector bodies below publish jointly.',
  },
]

/**
 * Key blocks — the part of banking cryptography most often taught from the
 * wrong (superseded) standard.
 */
export const KEY_BLOCK_FACTS = {
  what: 'A key block wraps a cryptographic key together with its usage attributes, so a key issued for one purpose cannot be repurposed. The attribute binding is the security property — not the encryption alone.',
  controlVector:
    'Sometimes called a key control vector (CV): every operation outside the declared usage fails. EPC 342-08 notes this only works if all parties use compatible CVs with the same certified TRSMs enforcing the policy.',
  currentStandard: 'ANSI X9.143',
  supersededStandard: 'ANSI X9 TR-31',
  supersessionNote:
    'EPC 342-08 v16.0.1 describes ISO 20038 as "based on ANSI TR31" and cites X9.143 as the standard for key wrapping using AES and Triple DES. Material still teaching TR-31 as current is out of date — X9.143 is the live specification.',
  paywallNote:
    'X9.143, X9.24-1/-2 and TR-31 are all ANSI-webstore purchases. This module teaches the concepts from EPC 342-08 (freely downloadable and mechanism-naming) and cites the X9 documents as normative but unobtainable, rather than paraphrasing standards nobody on the team has read.',
  pciMandate:
    'PCI SSC mandates key blocks for PIN security (Requirement 18-3), phased across acquiring and POS estates.',
}

/**
 * PQC status as EPC 342-08 v16.0.1 states it — useful because it is a
 * payments-industry document restating the NIST position in its own words,
 * including the renaming that trips up estate searches.
 */
export const EPC_PQC_POSITION = {
  standardised:
    'NIST standardised the first PQC algorithms in August 2024: CRYSTALS-Kyber became ML-KEM (FIPS 203), CRYSTALS-Dilithium became ML-DSA (FIPS 204), SPHINCS+ became SLH-DSA (FIPS 205).',
  inPreparation:
    'A further signature standard based on FALCON is in preparation, renamed FN-DSA (FIPS 206).',
  tlsDirection:
    'Two IETF drafts for PQC TLS are in standardisation: a native scheme using ML-KEM and a hybrid combining EC-DHE with ML-KEM, so an eavesdropper must break both.',
  hndlDriver:
    'EPC attributes the urgency to Harvest Now, Decrypt Later — adopting PQC without the scrutiny period normally advisable for new primitives, under confirmed high-risk circumstances.',
  symmetricNote:
    'Hash functions requiring one-wayness can continue with SHA-256; doubling output length for symmetric primitives is described as unnecessary.',
}

export interface SectorBody {
  id: string
  label: string
  jurisdiction: string
  libraryRef: string
  contribution: string
}

/**
 * The sector's coordinating publications. Deliberately jurisdiction-tagged:
 * a bank's obligations depend on where it is regulated, and this is the
 * question the Industry Landscape sends learners here to answer.
 */
export const SECTOR_BODIES: SectorBody[] = [
  {
    id: 'bis-leap',
    label: 'BIS Project Leap Phase 2',
    jurisdiction: 'Global (central banks)',
    libraryRef: 'BIS-OTHP107',
    contribution: 'Practical quantum-proofing of payment-system communications.',
  },
  {
    id: 'g7-ceg',
    label: 'G7 Cyber Expert Group',
    jurisdiction: 'G7',
    // 2026-08-01: re-pointed from G7-Financial-PQC-Roadmap-2026 (the Treasury
    // press release) to the statement itself. See content.ts standards[].
    libraryRef: 'G7-Financial-PQC-Roadmap-2026',
    contribution:
      'Coordinated roadmap for financial-sector PQC. Explicitly sets no regulatory expectation: it prioritises risk-based sequencing "rather than prescribe fixed timelines".',
  },
  {
    id: 'cmorg',
    label: 'CMORG PQC Guidance',
    jurisdiction: 'United Kingdom',
    libraryRef: 'UK-CMORG-PQC-Guidance-2025',
    contribution: 'UK financial-sector guidance for the migration.',
  },
  {
    id: 'qsff',
    label: 'Europol Quantum Safe Financial Forum',
    jurisdiction: 'European Union',
    libraryRef: 'Europol-QSFF-Call-to-Action-2025',
    contribution: 'Call to action; convenes European financial institutions and law enforcement.',
  },
  {
    id: 'fs-isac',
    label: 'FS-ISAC migration timeline',
    jurisdiction: 'Global (member institutions)',
    libraryRef: 'FS-ISAC-PQC-Timeline-2026',
    contribution: 'Sector migration timeline and prioritisation of activities.',
  },
  {
    id: 'mas',
    label: 'MAS Quantum Advisory',
    jurisdiction: 'Singapore',
    libraryRef: 'SG-MAS-Quantum-Advisory-2024',
    contribution: 'Supervisory advisory on quantum cybersecurity risk.',
  },
  {
    id: 'dora',
    label: 'DORA (Regulation EU 2022/2554)',
    jurisdiction: 'European Union',
    libraryRef: 'DORA-REG-2022-2554',
    contribution:
      'Operational-resilience obligations. Not PQC-specific, but the instrument under which an EU institution’s crypto-resilience failures become a regulatory matter.',
  },
  {
    id: 'eu-nis-cg-roadmap',
    label: 'EU NIS CG Coordinated Implementation Roadmap v1.1',
    jurisdiction: 'European Union',
    libraryRef: 'EU-NIS-CG-Roadmap-v1.1',
    contribution:
      'Commission Recommendation-derived roadmap addressed to Member States: national transition strategies by end-2026, high-risk use cases transitioned by end-2030. Horizontal EU policy — the word "financial" does not appear in it — that reaches EU banks through NIS2/DORA rather than as a payments-sector instrument, and sets no algorithm names or dates.',
  },
]

/**
 * Newer sector references that EPC 342-08 v16.0.1 itself points to. Listed so
 * the module can name current work rather than implying the field stopped in
 * 2025 — and so the next intake pass has a queue.
 */
export const EPC_CITED_EMERGING = [
  'GFMA — Quantum migration: mapping the emerging landscape',
  // Mastercard's white paper moved off this list 2026-07-31: it has now been
  // read (industry-landscape evidence manifest, sha256 3ac0c764...) and its
  // claims cited properly in PAYMENT_NETWORKS' Mastercard entry instead of
  // sitting here as named-but-unread.
  //
  // The EU NIS CG Coordinated Implementation Roadmap moved off this list
  // 2026-08-01: it has now been read (local-evidence-cache/library/
  // EU-NIS-CG-Roadmap-v1.1.pdf) and is cited properly in SECTOR_BODIES
  // instead of sitting here as named-but-unread.
  'US SEC Crypto Task Force — Post-Quantum Financial Infrastructure roadmap',
  'ETSI TR 103 967 — Impact of Quantum Computing on Symmetric Cryptography',
]
