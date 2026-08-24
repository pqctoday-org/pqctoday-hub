// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the DigitalID module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'digital-id',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('eIDAS-2-Regulation'),
    getStandard('EUDI-Wallet-ARF'),
    // ISO publishes 18013-5 behind a paywall, so this row is marked
    // access_type=paid: the References tab labels it "Purchase required" and
    // offers a free summary rather than presenting a shop page as a download.
    // Still cited, because the standard's NAME is what matters here — it
    // defines the mso_mdoc format the PID credential in this module uses.
    getStandard('ISO-18013-5-mDL'),
    getStandard('RFC-9901-SD-JWT-VC'),
    getStandard('OpenID4VCI-Spec'),
    getStandard('OpenID4VP-Spec'),
    getStandard('CSC-API-v2-Spec'),
    getStandard('ETSI-EN-319-411'),
    // 'ENISA-EUDI-Wallet-Security' was cited here until 2026-07-31 and has been
    // dropped: that library row's download_url points at the unrelated 2022
    // ENISA PQC Integration Study, so the citation could not be substantiated.
    // 'EU PQC Recommendation' is the document that actually carries the
    // 2026/2030/2035 transition dates this module teaches.
    getStandard('EU PQC Recommendation'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('BSI TR-02102-1'),
    getStandard('FIPS 203'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'EUDI Wallet mandatory for all 27 EU member states',
      year: 2026,
      source: 'eIDAS-2-Regulation',
      timelineEventId: 'european-union-ec-eudi-wallet-available-all-member-states',
    },
    // The 2026/2030/2035 dates come from the NIS Cooperation Group "Coordinated
    // Implementation Roadmap for the Transition to Post-Quantum Cryptography"
    // (11 June 2025), which implements Commission Recommendation (EU) 2024/1101.
    // They are NOT in the EUDI ARF (v3.0.0 contains no PQC roadmap at all) and
    // NOT in the ENISA wallet-architecture analysis — both were cited here
    // previously and neither states these dates.
    {
      label: 'National PQC transition roadmaps due',
      year: 2026,
      source: 'EU PQC Recommendation',
      timelineEventId: 'european-union-ec-member-state-strategy-initiation',
    },
    {
      label: 'High-risk system PQC migration',
      year: 2030,
      source: 'EU PQC Recommendation',
      timelineEventId: 'european-union-ec-high-risk-systems-secured',
    },
    {
      label: 'Full PQC transition for EUDI infrastructure',
      year: 2035,
      source: 'EU PQC Recommendation',
      timelineEventId: 'european-union-ec-full-eu-pqc-transition',
    },
  ],

  narratives: {
    keyConcepts:
      'eIDAS 2.0 (Regulation EU 2024/1183) mandates every EU member state issue an EUDI Wallet. Person Identification Data (PID) is the foundational credential a national PID Issuer grants after citizen authentication; every other attestation builds on it. Two credential formats carry that data: mso_mdoc (ISO 18013-5, CBOR, proximity via NFC/BLE) and SD-JWT VC (RFC 9901 base SD-JWT, JSON, built for remote/online verification). Selective disclosure lets a holder reveal only the requested attributes — e.g. proving age without revealing a birthplace — enforcing GDPR data-minimization by construction, not policy. Qualified Electronic Attestations (QEAA) and Qualified Electronic Signatures (QES) are issued by QTSPs listed on National Trusted Lists, giving them the same legal weight as a handwritten signature across all 27 member states via the eIDAS trust-framework bridge. Today, every one of these credentials and signatures is secured by classical ECDSA P-256 — a harvest-now-decrypt-later target precisely because a wallet credential is meant to outlive the person it identifies.',
    workshopSummary:
      'EUDI Wallet: inspect a holder’s stored credentials, keys, and activity history. PID Issuer: authenticate as a citizen and receive an mso_mdoc PID credential. University Attestation: obtain an SD-JWT diploma attestation, gated on already holding a valid PID. Relying Party: present selective attributes to a bank to open an account, without the bank ever contacting the issuer. QES: sign a document through a QTSP via the CSC API, producing a legally binding qualified signature.',
  },
}
