// SPDX-License-Identifier: AGPL-3.0-only
import { withTokenizationAssessment } from './tokenizationAssessment'
import type { TokenizationFlow, TokenizationStep, MobileWallet } from './emvConstants'

const TOKENIZATION_FLOW_INPUTS: Array<
  Omit<TokenizationFlow, 'steps'> & { steps: Omit<TokenizationStep, 'quantumVulnerable'>[] }
> = [
  {
    id: 'visa-vts',
    name: 'Visa Token Service (VTS)',
    tsp: 'visa-vts',
    description:
      'Visa\u2019s Token Service Provider replaces the real PAN with a Visa token for use in mobile wallets, e-commerce, and IoT payments. Token lifecycle managed by Visa\u2019s token vault. Illustrative sequence: the six steps below are this module\u2019s simplification, not Visa\u2019s published protocol.',
    steps: [
      {
        id: 'vts-1',
        order: 1,
        label: 'Enrollment Request',
        actor: 'Mobile Wallet App',
        description:
          'Cardholder enters card details or scans card. Wallet app collects PAN, expiry, and device information, then sends enrollment request to Visa.',
        cryptoUsed: ['TLS 1.2/1.3 ((EC)DHE key exchange, ECDSA/RSA certificate signatures)'],
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
        ],
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
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
          {
            boundary: 'request-authentication',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'ECDSA signs the token request.',
          },
        ],
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
        protectionComponents: [
          {
            boundary: 'internal-operation',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the authored HSM token-generation operation.',
          },
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-2048 wraps the HSM key.',
          },
        ],
        pqcReplacement:
          'ML-KEM-768 key establishment + KDF + authenticated AES key wrap (conceptual)',
      },
      {
        id: 'vts-4',
        order: 4,
        label: 'Token Cryptographic Key Provisioning',
        actor: 'Visa TSP',
        description:
          'A unique per-device token cryptographic key (LUK \u2014 Limited Use Key) is generated and encrypted for transport to the device Secure Element.',
        cryptoUsed: ['RSA-2048 or ECDH key agreement', 'AES-256 key wrapping'],
        protectionComponents: [
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description:
              'The authored RSA-2048 or ECDH key-delivery alternatives are classical public-key operations.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 wraps key material within this step.',
          },
        ],
        pqcReplacement: 'ML-KEM-768 key agreement + AES-256 wrapping',
      },
      {
        id: 'vts-5',
        order: 5,
        label: 'Secure Element Provisioning',
        actor: 'Device Secure Element',
        description:
          'Token and LUK are installed in the wallet\u2019s protected store. Wallet architectures differ: a payment applet in an embedded Secure Element (as in Apple Pay), a TEE- or hardware-backed store, or cloud credentials used through host card emulation (HCE). Device attestation confirms the integrity of the protected store.',
        cryptoUsed: ['ECDSA device attestation certificate', 'AES-256 secure channel'],
        protectionComponents: [
          {
            boundary: 'device-attestation',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'ECDSA device attestation authenticates the device.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the secure channel.',
          },
        ],
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
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
        ],
      },
    ],
  },
  {
    id: 'mc-mdes',
    name: 'Mastercard Digital Enablement Service (MDES)',
    tsp: 'mc-mdes',
    description:
      'Mastercard\u2019s tokenization platform provides lifecycle management for digitized credentials. Supports cloud-based payments (HCE) and Secure Element-based wallets. Illustrative sequence: the six steps below are this module\u2019s simplification, not Mastercard\u2019s published protocol.',
    steps: [
      {
        id: 'mdes-1',
        order: 1,
        label: 'Digitization Request',
        actor: 'Wallet Provider',
        description:
          'Wallet provider submits a digitization request with encrypted card data. MDES validates the request format and routes to the issuer.',
        cryptoUsed: ['TLS 1.2/1.3', 'JWE (JSON Web Encryption) with RSA-OAEP'],
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'The authored JWE request uses RSA-OAEP payload protection.',
          },
        ],
        pqcReplacement:
          'JWE with ML-KEM key establishment, KDF and authenticated key wrap (conceptual)',
      },
      {
        id: 'mdes-2',
        order: 2,
        label: 'Issuer Approval & ID&V',
        actor: 'Issuer',
        description:
          'Issuer performs risk assessment and identity verification. May require additional authentication (step-up) via SMS, app push, or email.',
        cryptoUsed: ['TLS (issuer API)', 'HMAC-SHA256 request authentication'],
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
          {
            boundary: 'request-authentication',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description:
              'HMAC-SHA256 authenticates the request; it does not replace TLS key establishment or certificate authentication.',
          },
        ],
      },
      {
        id: 'mdes-3',
        order: 3,
        label: 'Token & Credential Generation',
        actor: 'MDES',
        description:
          'MDES generates the token PAN and associated credentials. For HCE (cloud), generates cloud-based payment credentials. For SE, generates SE-targeted credentials.',
        cryptoUsed: ['HSM token generation (AES-256)', 'RSA-2048 HSM key wrapping'],
        protectionComponents: [
          {
            boundary: 'internal-operation',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the authored HSM token-generation operation.',
          },
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-2048 wraps the HSM key.',
          },
        ],
        pqcReplacement:
          'ML-KEM-768 key establishment + KDF + authenticated AES key wrap (conceptual)',
      },
      {
        id: 'mdes-4',
        order: 4,
        label: 'Credential Delivery',
        actor: 'MDES',
        description:
          'Encrypted credentials delivered to the wallet provider for installation on the device. Uses Mastercard\u2019s secure credential delivery protocol.',
        cryptoUsed: ['RSA-2048 key transport', 'AES-256-GCM payload encryption'],
        protectionComponents: [
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-2048 transports key material.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256-GCM encrypts the payload.',
          },
        ],
        pqcReplacement:
          'ML-KEM-768 key establishment + KDF + authenticated AES key wrap (conceptual)',
      },
      {
        id: 'mdes-5',
        order: 5,
        label: 'Device Provisioning',
        actor: 'Device',
        description:
          'Wallet app installs credentials in Secure Element or cloud-based TEE. Device attestation verifies platform integrity.',
        cryptoUsed: ['ECDSA device attestation', 'AES-256 secure channel (GlobalPlatform SCP03)'],
        protectionComponents: [
          {
            boundary: 'device-attestation',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'ECDSA device attestation authenticates the device.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the authored GlobalPlatform SCP03 secure channel.',
          },
        ],
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
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
        ],
      },
    ],
  },
  {
    id: 'amex-est',
    name: 'American Express Token Service (EST)',
    tsp: 'amex-est',
    description:
      'Amex\u2019s three-domain model tokenization service. Amex is unique as both the network and issuer for most cards, simplifying the token lifecycle. Illustrative sequence: the six steps below are this module\u2019s simplification, not American Express\u2019s published protocol.',
    steps: [
      {
        id: 'est-1',
        order: 1,
        label: 'Token Request',
        actor: 'Wallet Provider',
        description:
          'Wallet sends a token request with encrypted card data to Amex. As both network and issuer, Amex handles the full lifecycle internally.',
        cryptoUsed: ['TLS 1.2/1.3', 'RSA-OAEP payload encryption'],
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-OAEP protects the request payload.',
          },
        ],
        pqcReplacement:
          'Hybrid ML-KEM TLS + ML-KEM key establishment with a KDF and AEAD for the payload (conceptual)',
      },
      {
        id: 'est-2',
        order: 2,
        label: 'Internal ID&V',
        actor: 'Amex (issuer role)',
        description:
          'Amex performs internal identity verification. Since Amex is typically both network and issuer, there is no inter-party routing.',
        cryptoUsed: ['Internal HSM operations'],
        protectionComponents: [
          {
            boundary: 'internal-operation',
            assessment: 'unspecified',
            provenance: 'authored-sample',
            description:
              'An HSM label alone does not specify an algorithm; the internal operation is not assessed.',
          },
        ],
      },
      {
        id: 'est-3',
        order: 3,
        label: 'Token Generation & Key Material',
        actor: 'Amex TSP',
        description:
          'Token and associated cryptographic material generated in Amex HSMs. Token mapped to the card account in the internal vault.',
        cryptoUsed: ['HSM token generation (AES-256)', 'RSA-2048 key wrapping'],
        protectionComponents: [
          {
            boundary: 'internal-operation',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the authored HSM token-generation operation.',
          },
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-2048 wraps key material.',
          },
        ],
        pqcReplacement:
          'ML-KEM-768 key establishment + KDF + authenticated AES key wrap (conceptual)',
      },
      {
        id: 'est-4',
        order: 4,
        label: 'Credential Delivery',
        actor: 'Amex TSP',
        description:
          'Encrypted token and LUK delivered to wallet provider for device provisioning.',
        cryptoUsed: ['RSA-2048 key transport', 'AES-256-GCM encryption'],
        protectionComponents: [
          {
            boundary: 'key-delivery',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'RSA-2048 transports key material.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256-GCM encrypts the payload.',
          },
        ],
        pqcReplacement:
          'ML-KEM-768 key establishment + KDF + authenticated AES key wrap (conceptual)',
      },
      {
        id: 'est-5',
        order: 5,
        label: 'Device Provisioning',
        actor: 'Device SE',
        description: 'Credentials installed in the device Secure Element with device attestation.',
        cryptoUsed: ['ECDSA device attestation', 'AES-256 secure channel'],
        protectionComponents: [
          {
            boundary: 'device-attestation',
            assessment: 'classical-public-key',
            provenance: 'authored-sample',
            description: 'ECDSA device attestation authenticates the device.',
          },
          {
            boundary: 'payload-protection',
            assessment: 'symmetric',
            provenance: 'authored-sample',
            description: 'AES-256 protects the secure channel.',
          },
        ],
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
        protectionComponents: [
          {
            boundary: 'transport-key-establishment',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: classical (EC)DHE key establishment.',
          },
          {
            boundary: 'transport-authentication',
            assessment: 'classical-public-key',
            provenance: 'approved-shared-tls-assumption',
            description: 'Sample TLS: RSA/ECDSA certificate authentication.',
          },
        ],
      },
    ],
  },
]

export const TOKENIZATION_FLOWS: TokenizationFlow[] = TOKENIZATION_FLOW_INPUTS.map((flow) => ({
  ...flow,
  steps: flow.steps.map(withTokenizationAssessment),
}))

export const MOBILE_WALLETS: MobileWallet[] = [
  {
    id: 'apple-pay',
    name: 'Apple Pay',
    secureElement:
      'Secure Element (certified chip running the Java Card platform) holds the payment applets; the Secure Enclave handles user authorization',
    tokenProtocol:
      'Hardware Secure Element-based (the NFC controller routes between the Secure Element and the terminal)',
    biometricAuth: ['Face ID', 'Touch ID', 'Device Passcode'],
    cryptoCapabilities: [
      'Illustrative model: the algorithms below are this module\u2019s assumptions, not Apple\u2019s published breakdown',
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
      'Samsung S3SSE2A secure element (hardware PQC announced by Samsung)',
    ],
    pqcStatus:
      'Samsung S3SSE2A secure element: ANSSI certificate ANSSI-CC-2024/26-R01 (1 Oct 2025) evaluates the chip at EAL5 augmented with ADV_IMP.2, ADV_INT.3, ADV_TDS.5, ALC_CMC.5, ALC_DVS.2, ALC_TAT.3, ASE_TSS.2, ATE_COV.3, ATE_FUN.2 and AVA_VAN.5 against the Security IC protection profile BSI-CC-PP-0084-2014 (only four sub-parts reach EAL6+ ASE_TSS.2). Its published Security Target Lite (ST_LITE_Ver1.1, 28 July 2025) lists an optional ACT1 Secure ML-DSA library (v1.15), built on the chip\u2019s PQC coprocessor, among the functions included in the TOE. Samsung and Thales announced ML-KEM support and a CES 2026 Innovation Award for the chip (Thales press release, 6 Jan 2026); the certificates, the certification report and the security target do not mention ML-KEM. Samsung Pay integration not yet announced.',
  },
]
