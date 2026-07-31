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
     * PROOF NOTE (2026-07-31, updated). The "Migration to Post-Quantum
     * Cryptography" white paper (Mastercard R&D, 2025) was manually acquired
     * — mastercard.com bot-blocks the automated pipeline — and is now cached
     * (industry-landscape evidence manifest, sha256 3ac0c764...). Read in
     * full. Claims below are what the paper actually says, not what earlier
     * secondary reporting implied:
     *
     * - The "double-digit % of TLS 1.3 connections secured with PQC by end
     *   2024" figure IS in the paper — but it is Cloudflare's internet-wide
     *   adoption statistic, which the paper CITES, not a claim about
     *   Mastercard's own network. Attributed correctly below.
     * - No QKD trial or pilot is described anywhere in the paper — that
     *   claim had no basis and stays dropped.
     * - No specific FI-readiness timeline (3 years, 5 years, or otherwise)
     *   appears anywhere in the text. The paper's one concrete
     *   recommendation is to invest in cryptographic inventory tooling
     *   immediately, independent of an institution's own migration
     *   timeline — quoted below instead of the invented "5 years".
     */
    pqcInitiatives: [
      'Published "Migration to Post-Quantum Cryptography" white paper (Mastercard R&D, 2025) — the only card network to publish a dedicated PQC paper',
      'Paper frames HNDL as the central driver and compares PQC against Quantum Key Distribution (QKD), favoring PQC for deployability',
      'Cites Cloudflare’s internet-wide TLS 1.3 PQC adoption data (~2% of connections by March 2024, reaching double digits by end of 2024) as evidence of momentum — an industry-wide figure the paper quotes, not a claim about Mastercard’s own network',
      'EMVCo PQC study group participation',
    ],
    pqcTimeline:
      'No pilot or dated commitment described in the paper. Its guidance to financial institutions: invest in cryptographic inventory tooling now, "regardless of the timeline for PQC migration that it deems to be ideal"',
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
