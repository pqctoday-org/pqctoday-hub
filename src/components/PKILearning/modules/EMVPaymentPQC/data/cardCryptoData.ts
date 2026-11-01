// SPDX-License-Identifier: AGPL-3.0-only
import type { CardAuthSpec, ProvisioningStep, CertChainComparison } from './emvConstants'

export const CARD_AUTH_SPECS: CardAuthSpec[] = [
  {
    id: 'sda',
    name: 'SDA',
    fullName: 'Static Data Authentication',
    algorithm: 'RSA-1024/2048',
    keySize: 1024,
    signatureBytes: 128,
    offlineCapable: true,
    quantumVulnerable: true,
    description:
      'The simplest offline authentication method. Card data is signed once at personalization by the issuer. The terminal verifies this static signature but cannot detect cloned cards because any copy has the same valid signature.',
    howItWorks: [
      'During card personalization, the issuer signs critical card data (PAN, expiry, service code) with the Issuer RSA private key',
      'The signed data and Issuer Public Key Certificate are stored on the card',
      'At the terminal, the CA public key recovers the Issuer public key from its certificate',
      'The Issuer public key then verifies the static signature on the card data',
      'If valid, the terminal trusts the card data has not been tampered with',
    ],
    strengths: [
      'Simple implementation \u2014 minimal card processing power required',
      'Fast \u2014 no real-time signature generation',
      'Low storage \u2014 only one static signature stored',
    ],
    weaknesses: [
      'Cannot detect cloned cards \u2014 the static signature is identical on every copy',
      'No dynamic challenge \u2014 no proof the physical card is present',
      'Deprecated by most networks for new card issuance',
    ],
    pqcMigrationPath:
      'Replace RSA static signatures with ML-DSA-44 or FN-DSA-512. However, SDA is being phased out in favor of CDA regardless of PQC migration.',
    prevalence: '~5% of active EMV cards (legacy, declining)',
  },
  {
    id: 'dda',
    name: 'DDA',
    fullName: 'Dynamic Data Authentication',
    algorithm: 'RSA-2048',
    keySize: 2048,
    signatureBytes: 256,
    offlineCapable: true,
    quantumVulnerable: true,
    description:
      'Each transaction generates a unique RSA signature using the card\u2019s own ICC private key. The terminal sends a random challenge; the card signs it. This proves the card possesses the private key and prevents cloning.',
    howItWorks: [
      'Terminal sends a random unpredictable number (UN) to the card as a challenge',
      'Card signs the UN plus card-specific data using its ICC RSA private key',
      'Terminal recovers the ICC public key from the certificate chain (payment-system CA public key held by the terminal \u2192 Issuer certificate \u2192 ICC certificate)',
      'Terminal verifies the dynamic signature against the recovered ICC public key',
      'A unique signature per transaction proves the card has the private key (anti-cloning)',
    ],
    strengths: [
      'Prevents card cloning \u2014 each transaction has a unique cryptographic proof',
      'Offline capable \u2014 no network connection needed for authentication',
      'Widely deployed \u2014 standard for most EMV implementations since 2010+',
    ],
    weaknesses: [
      'Authentication and transaction data are separate \u2014 a sophisticated relay attack could theoretically intercept the challenge',
      'RSA-2048 signature generation is computationally expensive on constrained card chips',
      'Quantum computers could forge ICC signatures, undermining the entire offline trust model',
    ],
    pqcMigrationPath:
      'FN-DSA-512 (Falcon, FIPS 206 in development) produces compact signatures (~666 bytes, fixed padded size) that are easier to fit in constrained card NVM. ML-DSA-44 signatures are ~2,420 bytes. FIPS 206 standardization for FN-DSA is pending.',
    prevalence: '~35% of active EMV cards',
  },
  {
    id: 'cda',
    name: 'CDA',
    fullName: 'Combined DDA/Application Cryptogram Generation',
    algorithm: 'RSA-2048',
    keySize: 2048,
    signatureBytes: 256,
    offlineCapable: true,
    quantumVulnerable: true,
    description:
      'CDA (Combined DDA/Application Cryptogram Generation) combines dynamic card authentication with the Application Cryptogram (AC), binding card identity to the specific transaction. The card signs both its challenge response AND the transaction authorization data in a single RSA signature, providing both card authentication and transaction integrity.',
    howItWorks: [
      'Terminal requests a Generate AC command from the card, including transaction data',
      'Card computes the Application Cryptogram (AC) using its symmetric session key (3DES/AES)',
      'Card then signs the AC together with dynamic data (including terminal UN) using its ICC RSA private key',
      'Terminal verifies the certificate chain and recovers the ICC public key',
      'Terminal verifies the combined signature, confirming both card authenticity and transaction integrity',
    ],
    strengths: [
      'Strongest offline authentication \u2014 binds card identity to transaction',
      'Prevents both cloning AND transaction modification attacks',
      'Single signature covers authentication + authorization (efficiency)',
      'Recommended by EMVCo for all new card deployments',
    ],
    weaknesses: [
      'Most computationally expensive \u2014 requires both symmetric and asymmetric crypto on-card',
      'Larger certificate chain storage on card NVM',
      'All RSA signatures are quantum-vulnerable: compromising the ICC key allows forging any offline transaction',
    ],
    pqcMigrationPath:
      "This module's advice: Hybrid approach recommended: RSA-2048 + FN-DSA-512 dual signatures during transition. Long-term: pure FN-DSA-512 CDA when card chip capacity and terminal software support it.",
    prevalence: '~60% of active EMV cards (majority of new issuance)',
  },
]

export const PROVISIONING_STEPS: ProvisioningStep[] = [
  {
    id: 'prov-1',
    phase: 'chip-os',
    order: 1,
    label: 'Chip OS Installation',
    description:
      'Silicon vendor loads the chip operating system (Java Card, MULTOS, or proprietary OS) onto the IC. The OS provides the cryptographic runtime environment.',
    actor: 'Chip Manufacturer',
    cryptoUsed: ['ROM-based crypto engine (3DES, AES, RSA hardware accelerator)'],
    quantumVulnerable: false,
    dataElements: ['Chip OS', 'Crypto engine firmware', 'Hardware random number generator'],
  },
  {
    id: 'prov-2',
    phase: 'pre-perso',
    order: 2,
    label: 'Pre-Personalization',
    description:
      'Card bureau loads the payment applet (Visa VIS, MC M/Chip, etc.) and initializes the file structure. Transport keys protect the card during manufacturing.',
    actor: 'Card Bureau',
    cryptoUsed: ['3DES transport keys (card-bureau key pair)'],
    quantumVulnerable: false,
    dataElements: [
      'Payment applet',
      'File structure (DFs, EFs)',
      'Transport key set',
      'Card production lifecycle data',
    ],
  },
  {
    id: 'prov-3',
    phase: 'personalization',
    order: 3,
    label: 'Data Personalization',
    description:
      'Issuer-specific data is written to the card: PAN, expiry, cardholder name, card risk management data. Issuer and network CA certificates are loaded for offline authentication.',
    actor: 'Issuer / Personalization Bureau',
    cryptoUsed: ['Secure channel (SCP02/SCP03) with 3DES/AES session keys'],
    quantumVulnerable: false,
    dataElements: [
      'PAN (Primary Account Number)',
      'Expiry date',
      'Cardholder name',
      'Issuer public key certificate',
      'Card risk management data object list (CDOL)',
      'Application usage control',
    ],
  },
  {
    id: 'prov-4',
    phase: 'key-injection',
    order: 4,
    label: 'Cryptographic Key Injection',
    description:
      'The most security-critical step. ICC key pair is generated (on-card or injected), card master keys are loaded, and the ICC public key certificate is created and signed by the Issuer CA using RSA-2048.',
    actor: 'Issuer CA / HSM',
    cryptoUsed: [
      'RSA-2048 key generation (ICC key pair)',
      'RSA-2048 signature (Issuer CA signs ICC public key certificate)',
      'RSA-2048 key transport (master key injection from HSM)',
    ],
    quantumVulnerable: true,
    pqcReplacement:
      'FN-DSA-512 ICC key pair + ML-DSA-44 Issuer CA signature + ML-KEM-768 key transport',
    dataElements: [
      'ICC RSA key pair (public + private)',
      'ICC public key certificate (signed by Issuer CA)',
      'Card master key (3DES/AES, for AC generation)',
      'PIN encryption key',
      'Issuer CA public key certificate',
    ],
  },
  {
    id: 'prov-5',
    phase: 'activation',
    order: 5,
    label: 'Card Activation & Testing',
    description:
      'Card is tested for correct personalization, offline authentication capability, and online authorization. Transport keys are revoked and production keys activated.',
    actor: 'Issuer QA',
    cryptoUsed: ['Test ARQC generation/verification', 'Offline auth test (DDA/CDA signature)'],
    quantumVulnerable: false,
    dataElements: ['Card verification results', 'Activation flag', 'Lifecycle management data'],
  },
]

export const CERT_CHAIN_COMPARISONS: CertChainComparison[] = [
  {
    algorithm: 'rsa-2048',
    label: 'RSA-2048 (Current)',
    description:
      'The current EMV standard. RSA-2048 provides 112-bit classical security but zero post-quantum security.',
    fipsStatus: 'FIPS 186-5 (approved, but quantum-vulnerable)',
    levels: [
      {
        level: 'root',
        label: 'Payment-system (scheme) CA — public key held by the terminal',
        algorithm: 'RSA-2048',
        publicKeyBytes: 256,
        signatureBytes: 256,
        certificateBytes: 384,
      },
      {
        level: 'issuer',
        label: 'Issuer CA',
        algorithm: 'RSA-2048',
        publicKeyBytes: 256,
        signatureBytes: 256,
        certificateBytes: 384,
      },
      {
        level: 'icc',
        label: 'ICC Certificate',
        algorithm: 'RSA-2048',
        publicKeyBytes: 256,
        signatureBytes: 256,
        certificateBytes: 384,
      },
    ],
    totalChainBytes: 1152,
  },
  {
    algorithm: 'ml-dsa-44',
    label: 'ML-DSA-44 (FIPS 204)',
    description:
      'NIST FIPS 204 standard. Provides NIST Level 2 post-quantum security. Larger keys and signatures than RSA, but a standardised design based on the Module Learning With Errors problem and believed to be secure even against quantum adversaries (FIPS 204), with a claimed category-2 security strength.',
    fipsStatus: 'FIPS 204 (approved August 2024)',
    levels: [
      {
        level: 'root',
        label: 'Payment-system (scheme) CA — public key held by the terminal',
        algorithm: 'ML-DSA-44',
        publicKeyBytes: 1312,
        signatureBytes: 2420,
        certificateBytes: 3832,
      },
      {
        level: 'issuer',
        label: 'Issuer CA',
        algorithm: 'ML-DSA-44',
        publicKeyBytes: 1312,
        signatureBytes: 2420,
        certificateBytes: 3832,
      },
      {
        level: 'icc',
        label: 'ICC Certificate',
        algorithm: 'ML-DSA-44',
        publicKeyBytes: 1312,
        signatureBytes: 2420,
        certificateBytes: 3832,
      },
    ],
    totalChainBytes: 11496,
  },
  {
    algorithm: 'fn-dsa-512',
    label: 'FN-DSA-512 (FIPS 206 in development)',
    description:
      'Hash-and-sign lattice scheme with compact signatures, giving the smallest footprint of the post-quantum chains compared here. In its March 2024 position statement EMVCo named no post-quantum algorithm for EMV cards; the card-side evidence is research (IDEMIA, 2022: Falcon or Dilithium in the certificates of a banking-card prototype). NIST lists FIPS 206 as in development (checked 29 October 2026).',
    fipsStatus: 'FIPS 206 (in development \u2014 not yet published)',
    levels: [
      {
        level: 'root',
        label: 'Payment-system (scheme) CA — public key held by the terminal',
        algorithm: 'FN-DSA-512',
        publicKeyBytes: 897,
        signatureBytes: 666,
        certificateBytes: 1687,
      },
      {
        level: 'issuer',
        label: 'Issuer CA',
        algorithm: 'FN-DSA-512',
        publicKeyBytes: 897,
        signatureBytes: 666,
        certificateBytes: 1687,
      },
      {
        level: 'icc',
        label: 'ICC Certificate',
        algorithm: 'FN-DSA-512',
        publicKeyBytes: 897,
        signatureBytes: 666,
        certificateBytes: 1687,
      },
    ],
    totalChainBytes: 5061,
  },
]

export const PQC_ALGORITHM_SIZES = [
  {
    algorithm: 'RSA-2048 (current)',
    publicKeyBytes: 256,
    signatureOrCiphertextBytes: 256,
    suitableForCard: true,
    suitableForTerminal: true,
    notes: 'Quantum-vulnerable. No post-quantum security.',
  },
  {
    algorithm: 'FN-DSA-512 (Falcon)',
    publicKeyBytes: 897,
    signatureOrCiphertextBytes: 666,
    suitableForCard: true,
    suitableForTerminal: true,
    notes:
      'Compact signatures: the smallest of the post-quantum signatures compared. FIPS 206 in development.',
  },
  {
    algorithm: 'ML-DSA-44',
    publicKeyBytes: 1312,
    signatureOrCiphertextBytes: 2420,
    suitableForCard: false,
    suitableForTerminal: true,
    notes:
      'Large signatures strain card NVM (the 32-64 KB range is this module’s assumption). Better for terminal/server.',
  },
  {
    algorithm: 'ML-DSA-65',
    publicKeyBytes: 1952,
    signatureOrCiphertextBytes: 3309,
    suitableForCard: false,
    suitableForTerminal: true,
    notes: 'Too large for card chips. Suitable for HSMs and servers.',
  },
  {
    algorithm: 'ML-KEM-768',
    publicKeyBytes: 1184,
    signatureOrCiphertextBytes: 1088,
    suitableForCard: false,
    suitableForTerminal: true,
    notes: 'Key encapsulation for TLS and key transport. Not used on cards directly.',
  },
]

/**
 * Card-side findings that were measured or reported by others, kept apart from
 * the computed size tables above. Each statement follows its source's own
 * modality: one research prototype is not a general limit, and a report cited
 * by a vendor white paper is not a measurement made here.
 */
export interface CardChipFinding {
  id: string
  label: string
  statement: string
  /** Library reference id of the document the statement comes from */
  libraryRef: string
  source: string
}

export const CARD_CHIP_FINDINGS: CardChipFinding[] = [
  {
    id: 'idemia-prototype',
    label: 'One measured prototype',
    statement:
      'IDEMIA researchers built post-quantum and hybrid versions of two EMV payment protocols on a banking smart card (an Arm Cortex-M3 derivative running a basic “toy” application profile), with NTRU or Kyber512 for key encapsulation and Falcon or Dilithium in the certificates. Dilithium-5 data reached the application’s maximum capacity and could not be loaded. The authors conclude that such products are possible, but that several issues remain. Figures depend on the chip and the application profile, so this is one prototype, not a general limit.',
    libraryRef: 'Post-Quantum-Protocols-for-Banking-Applications',
    source:
      'Bettale, De Oliveira and Dottax (IDEMIA), NIST 4th PQC Standardization Conference, 2022',
  },
  {
    id: 'idemia-timing',
    label: 'Where the time goes',
    statement:
      'In the same prototype, most of the transaction time was the transmission of the card’s certificate chain to the terminal, because post-quantum certificates are large and the card-terminal interface is slow. This is the same chain-size effect the certificate chain comparison above shows.',
    libraryRef: 'Post-Quantum-Protocols-for-Banking-Applications',
    source: 'Bettale, De Oliveira and Dottax (IDEMIA), 2022',
  },
  {
    id: 'banque-de-france-ram',
    label: 'Chip RAM',
    statement:
      'A Mastercard white paper cites a Banque de France report (annual report of the Observatoire de la sécurité des moyens de paiement, 2023) estimating 4 to 6 times more chip RAM for post-quantum algorithms, depending on the algorithm chosen. The same paper calls combining chip cards and quantum resistance a work in progress.',
    libraryRef: 'Mastercard-Migration-to-Post-Quantum-Cryptography-White-Pape',
    source: 'Mastercard, Migration to Post-Quantum Cryptography white paper (2025)',
  },
  {
    id: 'emvco-position',
    label: 'EMVCo names no algorithm',
    statement:
      'EMVCo’s position statement (8 March 2024, published September 2024) names no post-quantum algorithm. Its Security Working Group says it will monitor and support standards development of quantum-resistant solutions.',
    libraryRef: 'EMVCo-Quantum-Position-Statement',
    source: 'EMVCo Position Statement: Quantum Computing and EMV Chip Cryptography',
  },
]
