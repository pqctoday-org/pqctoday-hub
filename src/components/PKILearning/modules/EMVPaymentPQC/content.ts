// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Financial Services & Payments module
 * (module id remains `emv-payment-pqc` — see manifest.ts for why).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'emv-payment-pqc',
  version: '2.1.1',
  lastReviewed: '2026-08-01',

  standards: [
    getStandard('FIPS 186-5'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 206'),
    // Banking half — each verified against its cached PDF this session.
    getStandard('EPC-342-08-v16-0-1-Guidelines-on-Cryptographic-Algorithms-Us'),
    getStandard('Swift-Customer-Security-Controls-Framework-CSCF-v2026'),
    getStandard('BIS-OTHP107'),
    getStandard('UK-CMORG-PQC-Guidance-2025'),
    getStandard('Europol-QSFF-Call-to-Action-2025'),
    getStandard('FS-ISAC-PQC-Timeline-2026'),
    getStandard('DORA-REG-2022-2554'),
    // Added 2026-07-31: both are sector bodies the module already deep-links to
    // from SECTOR_BODIES, but they were absent here, so they never reached the
    // References tab.
    getStandard('G7-Financial-PQC-Roadmap-2026'),
    getStandard('SG-MAS-Quantum-Advisory-2024'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-256'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // Deliberately empty. Unlike Government & Defense, the financial sector has
    // no dated algorithm mandate — its pressure comes from operational-
    // resilience regulation and HNDL exposure. Inventing dates here would
    // misrepresent the sector.
  ],

  narratives: {
    overview:
      'Advanced module covering post-quantum migration across the whole payments and banking estate: the EMV card ecosystem (14.7 billion chip cards at the end of 2024, across Visa, Mastercard, Amex, UnionPay and Discover), retail and card-not-present acceptance, interbank settlement rails, bank key management, and the sector regulation setting the pace. Three learner paths — Cards & Acceptance, Banking & Settlement, Retail & E-Commerce — so no audience is asked for the full 110 minutes.',
    keyConcepts:
      'EMV card authentication: SDA (static RSA), DDA (dynamic RSA per transaction), CDA (combined with application cryptogram), all resting on RSA-2048 certificate chains. Settlement rails: Swift messaging, domestic RTGS, and correspondent chains, where the weakest hop sets the security of the whole path and no participant can migrate it alone. Key blocks: a key wrapped together with its usage attributes so it cannot be repurposed — the attribute binding is the security property, and the current standard is ANSI X9.143, not the far more frequently cited X9 TR-31. Harvest-now-decrypt-later drives the timetable: exposure is a function of how long data stays sensitive, not of a guessed CRQC date.',
    workshopSummary:
      'Payment Network Comparator. Transaction Simulator. Card Provisioning Visualizer. Tokenization Explorer. POS Crypto Analyzer. Migration Risk Matrix. Settlement Exposure Modeller — HNDL exposure per rail, driven by retention rather than a guessed CRQC year. Sector Regulation Timeline — sector bodies filtered by jurisdiction, each linked to its cached source document.',
    relatedStandards:
      'EPC 342-08 v16.0.1 (24 June 2026) anchors the banking half: it names ML-KEM, ML-DSA, SLH-DSA and FN-DSA, and cites ANSI X9.143 as the current key-block standard. Swift CSCF v2026 controls 2.1/2.4/2.5A/2.6 point at Swift cryptography guidance that Swift states will follow its post-quantum strategy. BIS Project Leap Phase 2 is the central-bank experiment. PCI DSS v4.0.1 is current — there is no v5.0 — but only the Quick Reference Guide is freely downloadable. ANSI X9.143, X9.24-1/-2 and TR-31 are paywalled, and are cited here as normative but unobtainable rather than paraphrased.',
  },
}
