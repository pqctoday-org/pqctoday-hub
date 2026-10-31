// SPDX-License-Identifier: AGPL-3.0-only
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
    pqcPosture: 'published-guidance',
    pqcStance: '',
    pqcInitiatives: [
      'Visa Research lists quantum-safe payments as a Quantum Security focus area',
      'The guidance calls for cryptographic inventory, algorithm evaluation, agile key management, standards coordination and non-production testing',
      'Visa is an equal owner of EMVCo, whose Security Working Group is assessing quantum risk to EMV Chip',
    ],
    pqcTimeline:
      'Published near-term plan (stablecoin scope): inventory vulnerable cryptography, prepare agile key management, join standards work and test in non-production. No public Visa card-network rollout sequence or commitment was found.',
    evidenceBasis:
      'Direct Visa publications plus EMVCo documents. The module does not extend Visa’s stablecoin guidance into a card-network deployment claim.',
    officialSources: [
      {
        label: 'Visa — Preparing stablecoins for the quantum era (2026)',
        url: 'https://global-corporate.review.visa.com/en/sites/visa-perspectives/trends-insights/stablecoins-post-quantum-cryptography-threats.html',
      },
      {
        label: 'Visa Research — Quantum information and computation',
        url: 'https://usa.visa.com/about-visa/visa-research/research-areas.html',
      },
    ],
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
    pqcPosture: 'prototype-testing',
    pqcStance:
      'Mastercard calls the threat urgent and says financial organizations should plan a migration. It has publicly described laboratory and cloud prototypes, but not a production card-network pilot or rollout commitment.',
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
      'Launched a Quantum Security and Communications project in 2021',
      'Built a cloud virtual network to test NIST candidate PQC algorithms between simulated businesses',
      'Tested whether existing network hardware could add PQC through software updates and separately modelled QKD',
      'Published "Migration to Post-Quantum Cryptography" guidance for financial institutions in 2025',
      'Paper frames HNDL as the central driver and compares PQC against Quantum Key Distribution (QKD), favoring PQC for deployability',
      'Cites Cloudflare’s internet-wide TLS 1.3 PQC adoption data (~2% of connections by March 2024, reaching double digits by end of 2024) as evidence of momentum — an industry-wide figure the paper quotes, not a claim about Mastercard’s own network',
    ],
    pqcTimeline:
      'Public sequence: inventory cryptography now, continue prototype and hardware-integration testing, and prepare migration away from RSA/ECC. No production rollout date or network-wide deployment commitment is public.',
    evidenceBasis:
      'Direct Mastercard newsroom and white-paper evidence. “Prototype testing” replaces the unsupported “Active Pilot” label.',
    officialSources: [
      {
        label: 'Mastercard — Quantum cyber security and a post-quantum world (2024)',
        url: 'https://www.mastercard.com/news/perspectives/2024/quantum-cyber-threats-are-likely-years-away-why-and-how-we-re-working-today-to-stop-them',
      },
      {
        label: 'Mastercard — Migration to post-quantum cryptography (2025)',
        url: 'https://www.mastercard.com/global/en/news-and-trends/Insights/2025/post-quantum-cryptography-white-paper.html',
      },
    ],
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
    pqcPosture: 'readiness-program',
    pqcStance:
      'American Express publicly describes post-quantum readiness and crypto-agility as an enterprise architecture responsibility spanning payment and non-payment systems. It has not published a network rollout commitment.',
    pqcInitiatives: [
      'A 2026 cryptographic architecture role is charged with leading PQC readiness and crypto-agility',
      'The stated work includes cryptographic inventory and CBOM, vulnerable-implementation discovery, migration patterns and modernization roadmaps',
      'The role connects standards to architecture-as-code, reusable patterns, enterprise services and automated assurance',
      'American Express is an equal owner of EMVCo and contributes experts to its working groups',
    ],
    pqcTimeline:
      'Publicly observable plan: build inventory and CBOM capability, identify vulnerable implementations, define migration patterns, and turn them into reusable engineering services and automated assurance. No Amex network deployment sequence or date is public.',
    evidenceBasis:
      'Direct American Express careers material is evidence of an active readiness capability, not proof of a deployed network migration.',
    officialSources: [
      {
        label: 'American Express — Director, Cryptographic Architecture & Engineering (2026)',
        url: 'https://careers.americanexpress.com/en/sites/CX_1/job/26014795',
      },
      {
        label: 'EMVCo — Organisation structure',
        url: 'https://www.emvco.com/about-us/organization-structure/',
      },
    ],
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
    pqcPosture: 'shared-standards',
    pqcStance:
      'No network-specific UnionPay PQC stance or roadmap was found on official UnionPay properties. UnionPay is an equal owner of EMVCo, so the verified public baseline is the shared EMVCo position—not a UnionPay deployment claim.',
    pqcInitiatives: [
      'UnionPay representatives participate in EMVCo governance and working groups',
      'EMVCo is monitoring the quantum threat, considering mitigations for vulnerable offline authentication, and expects PQC algorithms to enter e-commerce protection in due course',
      'No official UnionPay publication was found that commits its SM2/SM9 or card-network estate to a named PQC algorithm, pilot or schedule',
    ],
    // The "2029-2034, 80%+ migration" figure previously carried here traces to
    // an academic recommendation, not a published national commitment, and had
    // no cached source. Dropped 2026-07-31 rather than re-attributed.
    pqcTimeline:
      'Tentative dependency-led plan: participate in EMVCo assessment, preserve crypto agility, then test and adopt future EMV mitigations and applicable Chinese standards. This is an inference from standards dependencies; UnionPay has not published its own sequence.',
    evidenceBasis:
      'EMVCo ownership and working-group evidence only. Earlier national-standard forecasts were removed because they were not an official UnionPay roadmap.',
    officialSources: [
      {
        label: 'EMVCo — Organisation structure',
        url: 'https://www.emvco.com/about-us/organization-structure/',
      },
      {
        label: 'EMVCo — Quantum Computing and EMV Chip: What’s the Threat? (updated 2026)',
        url: 'https://www.emvco.com/news-publications/quantum-computing-and-emv-chip-whats-the-threat/',
      },
    ],
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
    pqcPosture: 'shared-standards',
    pqcStance:
      'No network-specific Discover PQC stance or roadmap was found on official Discover or Capital One properties. Discover Network remains operationally distinct inside Capital One and is an equal owner of EMVCo.',
    pqcInitiatives: [
      'Discover representatives participate in EMVCo governance and standards work',
      'The verified shared baseline is EMVCo’s ongoing assessment of offline public-key risk and future protection of remote payments',
      'Capital One says Discover Network, PULSE and Diners Club continue to operate independently after the acquisition',
    ],
    pqcTimeline:
      'Tentative dependency-led plan: continue EMVCo standards work, inventory Discover-specific dependencies, then test and adopt future EMV and payment-security changes. This is an inference; no Discover-specific rollout sequence is public.',
    evidenceBasis:
      'Direct EMVCo and Capital One evidence. The absence of a public Discover roadmap is stated explicitly rather than scored as inactivity.',
    officialSources: [
      {
        label: 'EMVCo — Organisation structure',
        url: 'https://www.emvco.com/about-us/organization-structure/',
      },
      {
        label: 'Capital One — Discover is now part of Capital One',
        url: 'https://www.capitalone.com/about/capital-one-discover/',
      },
      {
        label: 'EMVCo — Quantum Computing and EMV Chip: What’s the Threat? (updated 2026)',
        url: 'https://www.emvco.com/news-publications/quantum-computing-and-emv-chip-whats-the-threat/',
      },
    ],
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
