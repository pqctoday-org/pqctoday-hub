// SPDX-License-Identifier: GPL-3.0-only
import type { TokenizationFlow, MobileWallet } from './emvConstants'

export const TOKENIZATION_FLOWS: TokenizationFlow[] = [
  {
    id: 'visa-vts',
    name: 'Visa Token Service (VTS)',
    tsp: 'visa-vts',
    description:
      'Visa\u2019s Token Service Provider replaces the real PAN with a Visa token for use in mobile wallets, e-commerce, and IoT payments. Token lifecycle managed by Visa\u2019s token vault.',
    steps: [
      {
        id: 'vts-1',
        order: 1,
        label: 'Enrollment Request',
        actor: 'Mobile Wallet App',
        description:
          'Cardholder enters card details or scans card. Wallet app collects PAN, expiry, and device information, then sends enrollment request to Visa.',
        cryptoUsed: ['TLS 1.2/1.3 (ECDSA/RSA key exchange)'],
        quantumVulnerable: true,
        pqcReplacement: 'Hybrid ML-KEM + X25519 TLS 1.3',
      },
      {
        id: 'vts-2',
        order: 2,
        label: 'ID&V (Identification & Verification)',
        actor: 'Issuer',
        description:
          'Visa routes the request to the card issuer for identity verification. Issuer may use SMS OTP, in-app push, or call center verification.',
        cryptoUsed: ['TLS (issuer API)', 'ECDSA token request signing'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA-44 request signing',
      },
      {
        id: 'vts-3',
        order: 3,
        label: 'Token Generation',
        actor: 'Visa TSP',
        description:
          'Visa generates a payment token (16-digit surrogate PAN) and creates a mapping entry in the token vault. Token is assigned a domain restriction (e.g., mobile NFC only).',
        cryptoUsed: ['HSM-secured token generation (AES-256)', 'RSA-2048 HSM key wrapping'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 HSM key wrapping',
      },
      {
        id: 'vts-4',
        order: 4,
        label: 'Token Cryptographic Key Provisioning',
        actor: 'Visa TSP',
        description:
          'A unique per-device token cryptographic key (LUK \u2014 Limited Use Key) is generated and encrypted for transport to the device Secure Element.',
        cryptoUsed: ['RSA-2048 or ECDH key agreement', 'AES-256 key wrapping'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 key agreement + AES-256 wrapping',
      },
      {
        id: 'vts-5',
        order: 5,
        label: 'Secure Element Provisioning',
        actor: 'Device Secure Element',
        description:
          'Token and LUK are installed into the device Secure Element (Apple SEP, Android StrongBox, Samsung Knox). Device attestation confirms the SE integrity.',
        cryptoUsed: ['ECDSA device attestation certificate', 'AES-256 secure channel'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA device attestation',
      },
      {
        id: 'vts-6',
        order: 6,
        label: 'Activation Confirmation',
        actor: 'Visa TSP',
        description:
          'Token is activated in the vault. Cardholder receives confirmation. Token is now ready for contactless or in-app payments.',
        cryptoUsed: ['TLS (confirmation API)'],
        quantumVulnerable: false,
      },
    ],
  },
  {
    id: 'mc-mdes',
    name: 'Mastercard Digital Enablement Service (MDES)',
    tsp: 'mc-mdes',
    description:
      'Mastercard\u2019s tokenization platform provides lifecycle management for digitized credentials. Supports cloud-based payments (HCE) and Secure Element-based wallets.',
    steps: [
      {
        id: 'mdes-1',
        order: 1,
        label: 'Digitization Request',
        actor: 'Wallet Provider',
        description:
          'Wallet provider submits a digitization request with encrypted card data. MDES validates the request format and routes to the issuer.',
        cryptoUsed: ['TLS 1.2/1.3', 'JWE (JSON Web Encryption) with RSA-OAEP'],
        quantumVulnerable: true,
        pqcReplacement: 'JWE with ML-KEM key wrapping',
      },
      {
        id: 'mdes-2',
        order: 2,
        label: 'Issuer Approval & ID&V',
        actor: 'Issuer',
        description:
          'Issuer performs risk assessment and identity verification. May require additional authentication (step-up) via SMS, app push, or email.',
        cryptoUsed: ['TLS (issuer API)', 'HMAC-SHA256 request authentication'],
        quantumVulnerable: false,
      },
      {
        id: 'mdes-3',
        order: 3,
        label: 'Token & Credential Generation',
        actor: 'MDES',
        description:
          'MDES generates the token PAN and associated credentials. For HCE (cloud), generates cloud-based payment credentials. For SE, generates SE-targeted credentials.',
        cryptoUsed: ['HSM token generation (AES-256)', 'RSA-2048 HSM key wrapping'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 HSM key wrapping',
      },
      {
        id: 'mdes-4',
        order: 4,
        label: 'Credential Delivery',
        actor: 'MDES',
        description:
          'Encrypted credentials delivered to the wallet provider for installation on the device. Uses Mastercard\u2019s secure credential delivery protocol.',
        cryptoUsed: ['RSA-2048 key transport', 'AES-256-GCM payload encryption'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 key transport',
      },
      {
        id: 'mdes-5',
        order: 5,
        label: 'Device Provisioning',
        actor: 'Device',
        description:
          'Wallet app installs credentials in Secure Element or cloud-based TEE. Device attestation verifies platform integrity.',
        cryptoUsed: ['ECDSA device attestation', 'AES-256 secure channel (GlobalPlatform SCP03)'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA device attestation',
      },
      {
        id: 'mdes-6',
        order: 6,
        label: 'Token Activation',
        actor: 'MDES',
        description:
          'Token activated in MDES vault. For HCE tokens, replenishment keys are provisioned for dynamic credential refresh.',
        cryptoUsed: ['TLS (activation API)'],
        quantumVulnerable: false,
      },
    ],
  },
  {
    id: 'amex-est',
    name: 'American Express Token Service (EST)',
    tsp: 'amex-est',
    description:
      'Amex\u2019s three-domain model tokenization service. Amex is unique as both the network and issuer for most cards, simplifying the token lifecycle.',
    steps: [
      {
        id: 'est-1',
        order: 1,
        label: 'Token Request',
        actor: 'Wallet Provider',
        description:
          'Wallet sends a token request with encrypted card data to Amex. As both network and issuer, Amex handles the full lifecycle internally.',
        cryptoUsed: ['TLS 1.2/1.3', 'RSA-OAEP payload encryption'],
        quantumVulnerable: true,
        pqcReplacement: 'Hybrid ML-KEM TLS + ML-KEM payload encryption',
      },
      {
        id: 'est-2',
        order: 2,
        label: 'Internal ID&V',
        actor: 'Amex (issuer role)',
        description:
          'Amex performs internal identity verification. Since Amex is typically both network and issuer, there is no inter-party routing.',
        cryptoUsed: ['Internal HSM operations'],
        quantumVulnerable: false,
      },
      {
        id: 'est-3',
        order: 3,
        label: 'Token Generation & Key Material',
        actor: 'Amex TSP',
        description:
          'Token and associated cryptographic material generated in Amex HSMs. Token mapped to the card account in the internal vault.',
        cryptoUsed: ['HSM token generation (AES-256)', 'RSA-2048 key wrapping'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 HSM key wrapping',
      },
      {
        id: 'est-4',
        order: 4,
        label: 'Credential Delivery',
        actor: 'Amex TSP',
        description:
          'Encrypted token and LUK delivered to wallet provider for device provisioning.',
        cryptoUsed: ['RSA-2048 key transport', 'AES-256-GCM encryption'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-KEM-768 key transport',
      },
      {
        id: 'est-5',
        order: 5,
        label: 'Device Provisioning',
        actor: 'Device SE',
        description: 'Credentials installed in the device Secure Element with device attestation.',
        cryptoUsed: ['ECDSA device attestation', 'AES-256 secure channel'],
        quantumVulnerable: true,
        pqcReplacement: 'ML-DSA device attestation',
      },
      {
        id: 'est-6',
        order: 6,
        label: 'Token Activation',
        actor: 'Amex TSP',
        description:
          'Token activated. Amex\u2019s closed-loop model means the token vault lookup during transactions is internal, reducing latency.',
        cryptoUsed: ['TLS (internal API)'],
        quantumVulnerable: false,
      },
    ],
  },
]

export const MOBILE_WALLETS: MobileWallet[] = [
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    secureElement: 'Apple Secure Enclave Processor (SEP)',
    tokenProtocol: 'Hardware SE-based (NFC via eSE chip)',
    biometricAuth: ['Face ID', 'Touch ID', 'Device Passcode'],
    cryptoCapabilities: [
      'ECDSA P-256 (device attestation)',
      'AES-256 (credential storage)',
      'AES-256 (per-transaction cryptogram)',
      'ECDH (secure channel to SE)',
    ],
    pqcStatus:
      'Apple PQ3 protocol deployed for iMessage (Feb 2024) but NOT for Apple Pay. Payment tokenization still uses classical ECDSA/RSA. No public PQC payment timeline.',
  },
  {
    id: 'google-pay',
    name: 'Google Pay',
    secureElement: 'Titan M2 chip (Pixel) / StrongBox Keymaster (Android)',
    tokenProtocol: 'Cloud-based HCE + hardware SE hybrid',
    biometricAuth: ['Fingerprint', 'Face Unlock', 'Device PIN'],
    cryptoCapabilities: [
      'ECDSA P-256 (device attestation via SafetyNet/Play Integrity)',
      'AES-256 (cloud credential encryption)',
      'AES-256 (per-transaction cryptogram)',
      'RSA-2048 (key transport for cloud credentials)',
    ],
    pqcStatus:
      'Google Chrome supports ML-KEM hybrid TLS (since 2024) but Google Pay tokenization has not been updated to PQC. Cloud-based model may enable faster migration than hardware SE approaches.',
  },
  {
    id: 'samsung-pay',
    name: 'Samsung Pay',
    secureElement: 'Samsung Knox Vault (eSE + TEE)',
    tokenProtocol: 'Hardware SE-based (NFC + MST legacy)',
    biometricAuth: ['Fingerprint', 'Iris Scan', 'Device PIN'],
    cryptoCapabilities: [
      'ECDSA P-256 (device attestation)',
      'AES-256 (Knox Vault storage)',
      'AES-256 (per-transaction cryptogram)',
      'Samsung S3SSE2A secure microcontroller (ANSSI PQC certified Oct 2025)',
    ],
    pqcStatus:
      'Samsung S3SSE2A microcontroller received ANSSI PQC security certification (Oct 2025) \u2014 first PQC-certified payment-grade secure element. Samsung Pay integration not yet announced.',
  },
]
