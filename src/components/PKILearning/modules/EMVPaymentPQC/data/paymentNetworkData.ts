// SPDX-License-Identifier: GPL-3.0-only
import type { PaymentNetwork } from './emvConstants'

export const PAYMENT_NETWORKS: PaymentNetwork[] = [
  {
    id: 'visa',
    name: 'Visa',
    abbreviation: 'V',
    headquartersRegion: 'Americas',
    cardsInCirculation: '4.6 billion',
    cardsInCirculationNum: 4_600_000_000,
    annualTransactionVolume: '$14.8 trillion',
    offlineAuthSupported: true,
    tokenizationPlatform: 'Visa Token Service (VTS)',
    emvcoMember: true,
    currentCrypto: {
      offlineAuth: ['RSA-2048 (CDA)', 'RSA-1024 (legacy DDA)'],
      onlineAuth: ['3DES DUKPT', 'AES DUKPT (migration)'],
      keyManagement: ['RSA-2048 key transport', 'ECDSA P-256 (newer terminals)'],
      ecommerce: ['TLS 1.2/1.3 RSA/ECDSA', '3-D Secure 2.x ECDSA'],
    },
    pqcPosture: 'research',
    pqcInitiatives: [
      'Visa Research quantum computing lab (since 2022)',
      'EMVCo PQC study group participation',
      'Internal crypto-agility framework development',
    ],
    pqcTimeline: 'No public timeline; monitoring NIST and EMVCo guidance',
    radarScores: {
      scale: 4,
      offlineExposure: 4,
      tokenization: 5,
      pqcReadiness: 2,
      regulatoryPressure: 4,
      legacyBurden: 3,
    },
  },
  {
    id: 'mastercard',
    name: 'Mastercard',
    abbreviation: 'MC',
    headquartersRegion: 'Americas',
    cardsInCirculation: '3.3 billion',
    cardsInCirculationNum: 3_300_000_000,
    annualTransactionVolume: '$9.0 trillion',
    offlineAuthSupported: true,
    tokenizationPlatform: 'Mastercard Digital Enablement Service (MDES)',
    emvcoMember: true,
    currentCrypto: {
      offlineAuth: ['RSA-2048 (CDA)', 'RSA-1024 (legacy DDA)'],
      onlineAuth: ['3DES DUKPT', 'AES DUKPT (adoption growing)'],
      keyManagement: ['RSA-2048 key transport', 'ECDSA P-256'],
      ecommerce: ['TLS 1.2/1.3 RSA/ECDSA', '3-D Secure 2.x ECDSA'],
    },
    pqcPosture: 'active-pilot',
    /**
     * PROOF NOTE (2026-07-31). Mastercard's "Migration to Post-Quantum
     * Cryptography" white paper (2025) is real — it is registered in
     * industry_landscape_*.csv and corroborated by independent search hits —
     * but mastercard.com bot-blocks every automated fetch, so the platform has
     * NO cached copy and cannot verify anything the document says.
     *
     * This module states elsewhere that it "cites nothing it has not read"
     * (SectorRegulationTimeline). So the figures previously summarised from it
     * — a double-digit percentage of TLS 1.3 connections PQC-secured by end
     * 2024, QKD trials, a five-year readiness recommendation — are not
     * asserted here. Only the paper's existence is, which is independently
     * established.
     *
     * TO REVERSE THIS: drop the PDF in
     * pqctoday-priv/local-evidence-cache/_inbox/ and run
     * ingest_manual_evidence.py, then cite it properly.
     */
    pqcInitiatives: [
      'Published "Migration to Post-Quantum Cryptography" white paper (2025) — the only card network to publish a dedicated PQC paper',
      'Contents not verifiable here: the paper is not fetchable by the evidence pipeline, so no figure from it is quoted',
      'EMVCo PQC study group participation',
    ],
    pqcTimeline:
      'Publicly engaged, with a published white paper; no dated commitment the platform can verify from a cached source',
    radarScores: {
      scale: 3,
      offlineExposure: 4,
      tokenization: 5,
      pqcReadiness: 4,
      regulatoryPressure: 4,
      legacyBurden: 3,
    },
  },
  {
    id: 'amex',
    name: 'American Express',
    abbreviation: 'AMEX',
    headquartersRegion: 'Americas',
    cardsInCirculation: '140 million',
    cardsInCirculationNum: 140_000_000,
    annualTransactionVolume: '$1.6 trillion',
    offlineAuthSupported: true,
    tokenizationPlatform: 'American Express Token Service (EST)',
    emvcoMember: true,
    currentCrypto: {
      offlineAuth: ['RSA-2048 (CDA)'],
      onlineAuth: ['3DES DUKPT', 'AES DUKPT'],
      keyManagement: ['RSA-2048 key transport'],
      ecommerce: ['TLS 1.2/1.3 RSA/ECDSA', 'SafeKey 2.0 (3DS-based)'],
    },
    pqcPosture: 'no-public-stance',
    pqcInitiatives: [
      'EMVCo PQC study group participation (as founding member)',
      'No public white papers or pilot announcements',
    ],
    pqcTimeline: 'No public timeline',
    radarScores: {
      scale: 1,
      offlineExposure: 2,
      tokenization: 4,
      pqcReadiness: 1,
      regulatoryPressure: 3,
      legacyBurden: 2,
    },
  },
  {
    id: 'unionpay',
    name: 'China UnionPay',
    abbreviation: 'CUP',
    headquartersRegion: 'Asia-Pacific',
    cardsInCirculation: '9.4 billion',
    cardsInCirculationNum: 9_400_000_000,
    annualTransactionVolume: '$21 trillion',
    offlineAuthSupported: true,
    tokenizationPlatform: 'UnionPay Online Payment (UPOP) Token Service',
    emvcoMember: true,
    currentCrypto: {
      offlineAuth: ['RSA-2048 (CDA)', 'SM2 (China national standard)'],
      onlineAuth: ['3DES DUKPT', 'SM4 (China national standard)'],
      keyManagement: ['RSA-2048 key transport', 'SM2 key exchange'],
      ecommerce: ['TLS 1.2/1.3 RSA/SM2', 'UnionPay 3DS-like protocol'],
    },
    pqcPosture: 'announced',
    pqcInitiatives: [
      'Governed by China ICCS national PQC competition (Feb 2025 call for quantum-resistant algorithms)',
      'GB/T PQC standards not yet final — in March 2026 Wang Xiaoyun (Tsinghua) said China expects to finalize them within three years',
      'National approach: a main algorithm plus a backup algorithm',
      'SM2/SM9 → national PQC algorithm transition planned',
    ],
    // The "2029-2034, 80%+ migration" figure previously carried here traces to
    // an academic recommendation, not a published national commitment, and had
    // no cached source. Dropped 2026-07-31 rather than re-attributed.
    pqcTimeline:
      'Tied to GB/T standards that are still in development — finalization expected around 2029 on the most recent public statement, with scale migration after',
    radarScores: {
      scale: 5,
      offlineExposure: 5,
      tokenization: 3,
      pqcReadiness: 2,
      regulatoryPressure: 5,
      legacyBurden: 4,
    },
  },
  {
    id: 'discover',
    name: 'Discover / Diners Club',
    abbreviation: 'DFS',
    headquartersRegion: 'Americas',
    cardsInCirculation: '70 million',
    cardsInCirculationNum: 70_000_000,
    annualTransactionVolume: '$200 billion',
    offlineAuthSupported: true,
    tokenizationPlatform: 'Discover Network Token Service',
    emvcoMember: true,
    currentCrypto: {
      offlineAuth: ['RSA-2048 (DDA primarily)'],
      onlineAuth: ['3DES DUKPT'],
      keyManagement: ['RSA-2048 key transport'],
      ecommerce: ['TLS 1.2/1.3 RSA/ECDSA', 'ProtectBuy (3DS-based)'],
    },
    pqcPosture: 'no-public-stance',
    pqcInitiatives: [
      'EMVCo PQC study group participation',
      'No public announcements or white papers',
    ],
    pqcTimeline: 'No public timeline; expected to follow PCI SSC and EMVCo guidance',
    radarScores: {
      scale: 1,
      offlineExposure: 1,
      tokenization: 2,
      pqcReadiness: 1,
      regulatoryPressure: 3,
      legacyBurden: 2,
    },
  },
]
