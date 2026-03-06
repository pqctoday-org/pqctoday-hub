// SPDX-License-Identifier: GPL-3.0-only
/**
 * Constants and typed data for the Custody Architecture Explorer flow.
 * Vendor-neutral reference architecture for corporate crypto custody platforms.
 */

export type ThreatLevel = 'critical' | 'high' | 'medium' | 'low'
export type MigrationReadiness = 'not-ready' | 'in-progress' | 'ready'

export interface PQCThreatOverlay {
  threatLevel: ThreatLevel
  vulnerableAlgorithms: string[]
  quantumAttack: string
  pqcCountermeasures: string[]
  migrationReadiness: MigrationReadiness
  migrationNotes: string
}

export interface ArchitectureSubComponent {
  id: string
  name: string
  description: string
  cryptoPrimitives: string[]
  pqcThreat: PQCThreatOverlay
}

export interface ArchitectureLayer {
  id: string
  name: string
  shortName: string
  description: string
  depthLabel: string
  subComponents: ArchitectureSubComponent[]
}

export interface TransactionFlowStep {
  id: string
  step: number
  title: string
  description: string
  activeLayerId: string
  cryptoOperations: string[]
  pqcConsiderations: string
}

export const THREAT_LEVEL_CONFIG: Record<
  ThreatLevel,
  { label: string; colorClass: string; bgClass: string; borderClass: string }
> = {
  critical: {
    label: 'Critical',
    colorClass: 'text-status-error',
    bgClass: 'bg-destructive/10',
    borderClass: 'border-l-destructive',
  },
  high: {
    label: 'High',
    colorClass: 'text-status-warning',
    bgClass: 'bg-status-warning/10',
    borderClass: 'border-l-[hsl(var(--status-warning))]',
  },
  medium: {
    label: 'Medium',
    colorClass: 'text-primary',
    bgClass: 'bg-primary/10',
    borderClass: 'border-l-primary',
  },
  low: {
    label: 'Low',
    colorClass: 'text-status-success',
    bgClass: 'bg-status-success/10',
    borderClass: 'border-l-[hsl(var(--status-success))]',
  },
}

export const MIGRATION_READINESS_CONFIG: Record<
  MigrationReadiness,
  { label: string; colorClass: string }
> = {
  'not-ready': { label: 'Not Ready', colorClass: 'text-status-error' },
  'in-progress': { label: 'In Progress', colorClass: 'text-status-warning' },
  ready: { label: 'Ready', colorClass: 'text-status-success' },
}

export const ARCHITECTURE_LAYERS: ArchitectureLayer[] = [
  {
    id: 'client-interfaces',
    name: 'Client Interfaces',
    shortName: 'Clients',
    description:
      'User-facing entry points: web dashboards, mobile apps, API integrations, and admin consoles. Every client session requires authenticated, encrypted channels.',
    depthLabel: 'Perimeter',
    subComponents: [
      {
        id: 'web-portal',
        name: 'Web Portal',
        description:
          'Browser-based dashboard for balance monitoring, withdrawal requests, and reporting. Authenticated via SSO or mutual TLS client certificates.',
        cryptoPrimitives: [
          'TLS 1.3 (ECDHE + AES-256-GCM)',
          'ECDSA client certificates',
          'HKDF session keys',
        ],
        pqcThreat: {
          threatLevel: 'critical',
          vulnerableAlgorithms: ['ECDHE (X25519/P-256)', 'ECDSA client certs'],
          quantumAttack:
            "Shor's algorithm breaks ECDHE key exchange and ECDSA certificate authentication. Harvest-now-decrypt-later (HNDL) risk for recorded TLS sessions.",
          pqcCountermeasures: [
            'ML-KEM-768 hybrid key exchange (RFC 9370)',
            'ML-DSA-65 certificate chains',
            'Hybrid TLS 1.3 (X25519MLKEM768)',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Major browsers support ML-KEM hybrid TLS. Server-side cert migration depends on CA ecosystem adoption.',
        },
      },
      {
        id: 'mobile-app',
        name: 'Mobile App',
        description:
          'Native iOS/Android application with biometric authentication, certificate pinning, and secure enclave key storage for session tokens.',
        cryptoPrimitives: [
          'Certificate pinning (ECDSA pins)',
          'Secure Enclave / StrongBox key storage',
          'Biometric-gated ECDH key derivation',
        ],
        pqcThreat: {
          threatLevel: 'high',
          vulnerableAlgorithms: ['ECDSA pinned certificates', 'ECDH session key derivation'],
          quantumAttack:
            "Shor's algorithm can forge pinned certificates and derive session keys if the underlying EC keys are compromised.",
          pqcCountermeasures: [
            'ML-KEM hybrid certificate pinning',
            'PQC key storage in next-gen secure enclaves',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'Depends on Apple/Google adding PQC support to Secure Enclave and StrongBox hardware.',
        },
      },
      {
        id: 'api-endpoints',
        name: 'API Endpoints',
        description:
          'REST/gRPC endpoints for programmatic access by trading desks, treasury systems, and third-party integrations. Authenticated via OAuth2 tokens or API key HMAC.',
        cryptoPrimitives: [
          'OAuth2 / JWT (RS256 or ES256)',
          'HMAC-SHA256 API key signing',
          'TLS 1.3 channel encryption',
        ],
        pqcThreat: {
          threatLevel: 'high',
          vulnerableAlgorithms: ['RSA-2048 JWT (RS256)', 'ECDSA JWT (ES256)'],
          quantumAttack:
            "Shor's algorithm can forge JWT signatures, allowing unauthorized API access. HMAC-SHA256 remains quantum-resistant at 256-bit security.",
          pqcCountermeasures: [
            'ML-DSA-65 JWT signing (IETF draft-ietf-jose-dilithium)',
            'SLH-DSA-SHA2-128s for long-lived API tokens',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'JOSE PQC drafts exist but are not yet finalized. HMAC-based auth is already quantum-safe.',
        },
      },
      {
        id: 'admin-console',
        name: 'Admin Console',
        description:
          'Privileged management interface for configuring policies, managing signers, and auditing operations. Requires multi-factor authentication and role-based access.',
        cryptoPrimitives: [
          'WebAuthn / FIDO2 (ECDSA attestation)',
          'TOTP (HMAC-SHA1, quantum-safe)',
          'Signed role tokens (ECDSA)',
        ],
        pqcThreat: {
          threatLevel: 'medium',
          vulnerableAlgorithms: ['WebAuthn ECDSA attestation', 'ECDSA role tokens'],
          quantumAttack:
            'WebAuthn attestation keys use ECDSA — vulnerable to forgery. TOTP (HMAC-based) is inherently quantum-resistant.',
          pqcCountermeasures: [
            'PQC-backed WebAuthn attestation (pending FIDO Alliance work)',
            'ML-DSA signed role tokens',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'FIDO Alliance has not yet standardized PQC attestation. TOTP provides a quantum-safe MFA fallback.',
        },
      },
    ],
  },
  {
    id: 'orchestration',
    name: 'Orchestration Layer',
    shortName: 'Orchestration',
    description:
      'Core business logic: transaction processing, policy enforcement, multi-approver workflows, and immutable audit trails. The brain of the custody platform.',
    depthLabel: 'Core Logic',
    subComponents: [
      {
        id: 'transaction-engine',
        name: 'Transaction Engine',
        description:
          'Validates withdrawal requests, manages nonce sequencing, estimates network fees, and constructs unsigned transaction payloads for signing.',
        cryptoPrimitives: [
          'SHA-256 / Keccak-256 transaction hashing',
          'Nonce management (deterministic counters)',
          'RLP / PSBT encoding',
        ],
        pqcThreat: {
          threatLevel: 'low',
          vulnerableAlgorithms: [],
          quantumAttack:
            'Transaction hashing uses SHA-256/Keccak-256 which provide quantum resistance at 128-bit security via Grover (reduced from 256-bit).',
          pqcCountermeasures: ['SHA-3 transition for long-term collision resistance'],
          migrationReadiness: 'ready',
          migrationNotes:
            'Hash-based operations are already quantum-resistant. No urgent migration needed.',
        },
      },
      {
        id: 'policy-engine',
        name: 'Policy Engine',
        description:
          'Enforces spending limits, velocity checks, whitelist validation, and M-of-N approval thresholds. Evaluates rules before any signing operation is authorized.',
        cryptoPrimitives: [
          'M-of-N ECDSA multisig verification',
          'Merkle proof whitelist checks',
          'Signed policy rule sets',
        ],
        pqcThreat: {
          threatLevel: 'high',
          vulnerableAlgorithms: ['M-of-N ECDSA multisig', 'ECDSA-signed policy rules'],
          quantumAttack:
            "Shor's algorithm can forge any individual signer's ECDSA signature, bypassing M-of-N thresholds entirely.",
          pqcCountermeasures: [
            'ML-DSA threshold signatures (active research)',
            'Lattice-based multisig schemes',
            'Hybrid classical+PQC dual-signature policies',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'PQC threshold signature schemes are in active academic research. No production-ready standard exists.',
        },
      },
      {
        id: 'approval-workflows',
        name: 'Approval Workflows',
        description:
          'Routes transactions through human approver chains with time-delayed execution, geographic distribution requirements, and callback verification.',
        cryptoPrimitives: [
          'ECDSA-signed approval tokens',
          'Time-lock commitments (hash-based)',
          'Callback HMAC verification',
        ],
        pqcThreat: {
          threatLevel: 'medium',
          vulnerableAlgorithms: ['ECDSA approval tokens'],
          quantumAttack:
            'Approval tokens signed with ECDSA can be forged. Time-locks and HMAC callbacks are hash-based and quantum-resistant.',
          pqcCountermeasures: [
            'ML-DSA-44 signed approval tokens',
            'Hash-based commitments (already quantum-safe)',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Internal token signing can be migrated independently of blockchain protocols. Straightforward substitution.',
        },
      },
      {
        id: 'audit-logging',
        name: 'Audit Logging',
        description:
          'Append-only tamper-evident log of all operations. Each entry is HMAC-chained to its predecessor, creating a verifiable audit trail for compliance.',
        cryptoPrimitives: [
          'HMAC-SHA256 log chaining',
          'SHA-256 entry hashing',
          'Append-only Merkle accumulator',
        ],
        pqcThreat: {
          threatLevel: 'low',
          vulnerableAlgorithms: [],
          quantumAttack:
            "HMAC-SHA256 and SHA-256 provide 128-bit quantum security via Grover's algorithm. Sufficient for audit integrity.",
          pqcCountermeasures: ['Optional upgrade to HMAC-SHA3-256 for long-term assurance'],
          migrationReadiness: 'ready',
          migrationNotes: 'Already quantum-resistant. No migration required.',
        },
      },
    ],
  },
  {
    id: 'wallet-tiers',
    name: 'Wallet Tiers',
    shortName: 'Wallets',
    description:
      'Three-tier storage model balancing security against operational speed. Assets flow from cold to warm to hot based on liquidity needs and risk tolerance.',
    depthLabel: 'Asset Storage',
    subComponents: [
      {
        id: 'hot-wallet',
        name: 'Hot Wallet',
        description:
          'Online, fully automated signing for high-frequency/low-value transactions. Keys reside in software or cloud HSM with sub-second signing latency. Typically holds <5% of total assets.',
        cryptoPrimitives: [
          'ECDSA / EdDSA auto-signing',
          'Software key store or cloud HSM',
          'Rate-limited signing API',
        ],
        pqcThreat: {
          threatLevel: 'critical',
          vulnerableAlgorithms: ['ECDSA (secp256k1)', 'EdDSA (Ed25519)'],
          quantumAttack:
            "Hot wallet keys sign frequently and public keys are exposed on-chain. Shor's algorithm can derive private keys from any exposed public key. Highest operational exposure.",
          pqcCountermeasures: [
            'First migration target: hybrid ECDSA + ML-DSA signing',
            'Frequent key rotation (minimize exposure window)',
            'Migrate to PQC-native chains as they launch',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Hot wallets are the easiest to migrate (software-based, frequent rotation). Priority target for PQC hybrid signing.',
        },
      },
      {
        id: 'warm-wallet',
        name: 'Warm Wallet',
        description:
          'Semi-online with approval gates. Keys in cloud HSM (AWS CloudHSM, Azure Dedicated HSM). Human approval required for withdrawals above threshold. Holds 10-30% of assets.',
        cryptoPrimitives: [
          'Cloud HSM-backed ECDSA signing',
          'Approval-gated key access (quorum policy)',
          'TLS mutual auth to HSM cluster',
        ],
        pqcThreat: {
          threatLevel: 'high',
          vulnerableAlgorithms: ['ECDSA signing keys in HSM', 'TLS to HSM cluster'],
          quantumAttack:
            "HSM-stored ECDSA keys are protected from extraction but the signing algorithm itself is vulnerable. Shor's can forge signatures without extracting the key.",
          pqcCountermeasures: [
            'HSM firmware upgrade to ML-DSA / ML-KEM',
            'Hybrid signing (dual ECDSA + ML-DSA outputs)',
            'Cloud HSM PQC readiness varies by vendor',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Cloud HSM vendors (AWS, Azure, Google) are adding PQC algorithm support. Timeline: 2025-2027.',
        },
      },
      {
        id: 'cold-wallet',
        name: 'Cold Wallet',
        description:
          'Fully airgapped, offline HSMs in secure facilities. Manual key ceremony for initialization. Shamir secret sharing for disaster recovery. Holds 60-85% of total assets.',
        cryptoPrimitives: [
          'Offline HSM key generation (FIPS 140-3 Level 3+)',
          'Shamir Secret Sharing (K-of-N shards)',
          'QR code / USB airgap transfer',
          'Dual-control key ceremony procedures',
        ],
        pqcThreat: {
          threatLevel: 'critical',
          vulnerableAlgorithms: ['ECDSA root signing keys', 'EC-based Shamir shares'],
          quantumAttack:
            'Cold wallet keys are the highest-value targets and have the longest lifetimes (years). HNDL risk: if public keys are ever exposed, a future quantum computer can derive the private key at leisure.',
          pqcCountermeasures: [
            'Dual-algorithm key ceremonies (generate both ECDSA + ML-DSA)',
            'PQC-aware Shamir splitting (lattice-based threshold schemes)',
            'Pre-emptive migration before Q-day (re-key to PQC addresses)',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'Cold wallet migration requires new key ceremonies, updated disaster recovery, and blockchain-level PQC address support.',
        },
      },
    ],
  },
  {
    id: 'crypto-infrastructure',
    name: 'Cryptographic Infrastructure',
    shortName: 'Crypto Infra',
    description:
      'The security foundation: hardware security modules, multi-party computation, confidential computing enclaves, and formal key ceremony procedures.',
    depthLabel: 'Security Core',
    subComponents: [
      {
        id: 'hsm',
        name: 'Hardware Security Modules',
        description:
          'Tamper-resistant hardware that generates, stores, and uses cryptographic keys without ever exposing them. PKCS#11 v3.2 interface. FIPS 140-3 Level 3 certified.',
        cryptoPrimitives: [
          'PKCS#11 v3.2 API',
          'ECDSA / RSA key generation & signing',
          'AES-256 key wrapping',
          'True random number generation (TRNG)',
        ],
        pqcThreat: {
          threatLevel: 'critical',
          vulnerableAlgorithms: ['ECDSA signing keys', 'RSA wrapping keys', 'ECDH key agreement'],
          quantumAttack:
            "HSMs protect key material from extraction but cannot protect against algorithm-level attacks. Shor's algorithm makes the signing/wrapping operations themselves insecure.",
          pqcCountermeasures: [
            'ML-DSA-65 / ML-DSA-87 signing (PKCS#11 v3.2 CKM_ML_DSA)',
            'ML-KEM-768 / ML-KEM-1024 key encapsulation',
            'HSM firmware PQC upgrade path',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Major HSM vendors (Thales, Entrust, Utimaco) are adding PQC firmware. PKCS#11 v3.2 standardizes PQC mechanism IDs.',
        },
      },
      {
        id: 'mpc',
        name: 'Multi-Party Computation',
        description:
          'Distributes key generation and signing across multiple independent parties. No single party ever holds the complete private key. Eliminates single point of compromise.',
        cryptoPrimitives: [
          'Distributed Key Generation (DKG)',
          'Threshold ECDSA (GG20, CGGMP)',
          'Threshold EdDSA (FROST)',
          'Secret resharing protocols',
        ],
        pqcThreat: {
          threatLevel: 'high',
          vulnerableAlgorithms: [
            'Threshold ECDSA (GG20/CGGMP)',
            'FROST (Ed25519-based)',
            'EC-based DKG protocols',
          ],
          quantumAttack:
            "MPC protocols are built on top of classical EC cryptography. Shor's algorithm breaks the underlying ECDSA/EdDSA, making the threshold distribution irrelevant — the final combined signature is still EC-based.",
          pqcCountermeasures: [
            'Lattice-based threshold signatures (academic stage)',
            'Hash-based threshold schemes (limited flexibility)',
            'Hybrid MPC: classical threshold + PQC individual backup keys',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'PQC-native MPC is the hardest open problem in custody cryptography. No production-ready protocol exists. Active research area.',
        },
      },
      {
        id: 'confidential-computing',
        name: 'Confidential Computing Enclaves',
        description:
          'Trusted Execution Environments (TEEs) like Intel SGX and AWS Nitro Enclaves. Process sensitive operations in hardware-isolated memory. Remote attestation proves code integrity.',
        cryptoPrimitives: [
          'Intel SGX / AWS Nitro Enclaves',
          'Remote attestation (ECDSA-based)',
          'Sealed storage (AES-256-GCM)',
          'Memory encryption (hardware AES)',
        ],
        pqcThreat: {
          threatLevel: 'medium',
          vulnerableAlgorithms: ['ECDSA remote attestation', 'EC-based sealing key derivation'],
          quantumAttack:
            'Enclave attestation uses ECDSA — a quantum adversary could forge attestation reports. Memory encryption (AES) remains quantum-safe.',
          pqcCountermeasures: [
            'PQC attestation (Intel/AMD roadmap items)',
            'ML-DSA-based attestation report signing',
            'AES-256 sealed storage (already quantum-safe)',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'Depends on silicon vendors (Intel, AMD, ARM) updating TEE attestation to PQC. Expected timeline: 2026-2028.',
        },
      },
      {
        id: 'key-ceremony',
        name: 'Key Ceremony Procedures',
        description:
          'Formal multi-person procedure for generating root cryptographic keys. Requires dual-control (two+ people), physical security (Faraday cage), and complete audit trail.',
        cryptoPrimitives: [
          'M-of-N Shamir Secret Sharing',
          'HSM root key generation (ECDSA / RSA)',
          'Air-gapped key backup (encrypted USB/QR)',
          'Dual-control activation (split PINs)',
        ],
        pqcThreat: {
          threatLevel: 'critical',
          vulnerableAlgorithms: ['ECDSA root keys', 'RSA root wrapping keys'],
          quantumAttack:
            'Key ceremonies generate the most valuable, longest-lived keys in the entire platform. These keys have maximum HNDL exposure — if a public key is ever recorded, it can be attacked decades later.',
          pqcCountermeasures: [
            'Dual-algorithm ceremonies: generate both classical + PQC key pairs',
            'PQC-native root key generation (ML-DSA-87 for signing, ML-KEM-1024 for wrapping)',
            'Updated disaster recovery with PQC Shamir shards',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Organizations can start dual-algorithm ceremonies now. Full PQC-only ceremonies await blockchain and HSM vendor readiness.',
        },
      },
    ],
  },
  {
    id: 'network-broadcast',
    name: 'Network & Broadcast',
    shortName: 'Network',
    description:
      'The final mile: connecting to blockchain networks, submitting signed transactions, monitoring confirmations, and defending against front-running.',
    depthLabel: 'External',
    subComponents: [
      {
        id: 'node-selection',
        name: 'Node Selection & RPC',
        description:
          'Manages connections to blockchain nodes (self-hosted or provider-managed). Authenticates RPC endpoints, load-balances across redundant nodes, and validates responses.',
        cryptoPrimitives: [
          'TLS 1.3 to RPC endpoints',
          'JWT-authenticated RPC calls',
          'Node identity verification (X.509)',
        ],
        pqcThreat: {
          threatLevel: 'medium',
          vulnerableAlgorithms: ['TLS ECDHE key exchange', 'X.509 node certificates'],
          quantumAttack:
            'RPC connections use TLS with EC key exchange. A quantum adversary could intercept and decrypt node communication.',
          pqcCountermeasures: [
            'ML-KEM hybrid TLS to self-hosted nodes',
            'PQC X.509 certificates for node identity',
          ],
          migrationReadiness: 'in-progress',
          migrationNotes:
            'Node infrastructure TLS can be migrated independently of blockchain protocol-level changes.',
        },
      },
      {
        id: 'mempool-monitoring',
        name: 'Mempool Monitoring',
        description:
          'Watches the transaction mempool for front-running attempts, fee sniping, and transaction malleability. No direct cryptographic operations — operates on public data.',
        cryptoPrimitives: ['No direct crypto (public data)', 'Encrypted alerting channels (TLS)'],
        pqcThreat: {
          threatLevel: 'low',
          vulnerableAlgorithms: [],
          quantumAttack:
            'Mempool monitoring operates on public blockchain data. No quantum-sensitive cryptographic operations.',
          pqcCountermeasures: [],
          migrationReadiness: 'ready',
          migrationNotes: 'No quantum risk. Monitoring infrastructure is already safe.',
        },
      },
      {
        id: 'broadcast-confirmation',
        name: 'Broadcast & Confirmation',
        description:
          'Submits signed transactions to the blockchain network and monitors for inclusion in a block. Verifies transaction receipts and handles resubmission on failure.',
        cryptoPrimitives: [
          'Signature serialization (DER / compact)',
          'Transaction hash verification (SHA-256 / Keccak)',
          'Receipt Merkle proof verification',
        ],
        pqcThreat: {
          threatLevel: 'medium',
          vulnerableAlgorithms: ['ECDSA/EdDSA signatures in broadcast transactions'],
          quantumAttack:
            'The broadcast transaction contains the public key and signature. Between broadcast and block inclusion, a quantum adversary could theoretically extract the private key and submit a competing transaction.',
          pqcCountermeasures: [
            'Commit-reveal schemes (hash commitment before signature reveal)',
            'Chain-level PQC signature support (BIP-360, EIP-7702)',
            'Minimize mempool exposure time',
          ],
          migrationReadiness: 'not-ready',
          migrationNotes:
            'Depends entirely on blockchain protocol-level PQC adoption. See PQC Defense flow for chain-specific timelines.',
        },
      },
    ],
  },
]

export const TRANSACTION_FLOW_STEPS: TransactionFlowStep[] = [
  {
    id: 'client-request',
    step: 1,
    title: 'Client Request',
    description:
      'A treasury operator submits a withdrawal request through the web portal or API. The request includes destination address, amount, asset type, and urgency level.',
    activeLayerId: 'client-interfaces',
    cryptoOperations: [
      'TLS 1.3 session encryption',
      'JWT bearer token validation',
      'Request HMAC signing',
    ],
    pqcConsiderations:
      'The TLS session and JWT token use EC-based cryptography vulnerable to quantum attacks. Hybrid TLS and PQC JWT migration protect this entry point.',
  },
  {
    id: 'authentication',
    step: 2,
    title: 'Authentication & Authorization',
    description:
      'The platform verifies the operator identity via multi-factor authentication (WebAuthn + TOTP), checks role permissions, and validates the session token signature.',
    activeLayerId: 'client-interfaces',
    cryptoOperations: [
      'WebAuthn ECDSA attestation verification',
      'TOTP HMAC-SHA1 validation',
      'Role token ECDSA signature check',
    ],
    pqcConsiderations:
      'WebAuthn and role tokens use ECDSA — quantum-vulnerable. TOTP (HMAC-based) provides a quantum-safe authentication factor. Dual-factor strategy: keep TOTP as quantum-safe fallback.',
  },
  {
    id: 'policy-evaluation',
    step: 3,
    title: 'Policy Evaluation',
    description:
      'The policy engine checks the withdrawal against configured rules: spending limits, velocity thresholds, destination whitelist, and time-of-day restrictions.',
    activeLayerId: 'orchestration',
    cryptoOperations: [
      'Merkle proof whitelist verification',
      'HMAC-SHA256 policy rule integrity check',
      'Signed audit log entry',
    ],
    pqcConsiderations:
      'Policy verification is primarily hash-based (Merkle proofs, HMAC) — already quantum-resistant. Signed policy rules should migrate to ML-DSA.',
  },
  {
    id: 'approval-routing',
    step: 4,
    title: 'Approval Routing',
    description:
      'For high-value transactions, the workflow engine routes the request to designated approvers. Each approver signs their approval with their personal key. A quorum (e.g., 3-of-5) must be reached.',
    activeLayerId: 'orchestration',
    cryptoOperations: [
      'Per-approver ECDSA signature',
      'Quorum threshold verification',
      'Time-lock commitment (hash-based)',
    ],
    pqcConsiderations:
      'Multi-approver ECDSA signatures are individually vulnerable. A quantum adversary could forge any approver signature. Migrating to ML-DSA approval signatures is a high-priority internal change.',
  },
  {
    id: 'wallet-signing',
    step: 5,
    title: 'Wallet Selection & Signing',
    description:
      'The orchestration layer selects the appropriate wallet tier (hot/warm/cold) based on transaction value and urgency. The signing request is routed to the corresponding HSM or MPC cluster.',
    activeLayerId: 'wallet-tiers',
    cryptoOperations: [
      'HSM PKCS#11 C_SignInit + C_Sign (ECDSA/EdDSA)',
      'Or: MPC threshold signing ceremony (GG20/FROST)',
      'Key access authenticated via HSM PIN or MPC session',
    ],
    pqcConsiderations:
      'This is the most critical PQC migration point. The actual blockchain signing key is used here. HSM firmware must support PQC algorithms. MPC protocols need PQC-native redesign.',
  },
  {
    id: 'transaction-construction',
    step: 6,
    title: 'Transaction Construction',
    description:
      'The signed transaction is assembled into the chain-specific format (Bitcoin PSBT, Ethereum RLP, Solana Transaction) with the signature attached. Transaction hash is computed for tracking.',
    activeLayerId: 'network-broadcast',
    cryptoOperations: [
      'Transaction serialization (RLP/PSBT)',
      'SHA-256 / Keccak-256 transaction hashing',
      'Signature encoding (DER / compact recovery)',
    ],
    pqcConsiderations:
      'Transaction hashing (SHA-256, Keccak) is quantum-safe. Signature encoding will need to accommodate larger PQC signatures (ML-DSA-65: 3,309 bytes vs ECDSA: 72 bytes).',
  },
  {
    id: 'broadcast-audit',
    step: 7,
    title: 'Broadcast & Audit',
    description:
      'The transaction is submitted to the blockchain network via authenticated RPC. The platform monitors for block inclusion, records the confirmation, and appends an HMAC-chained audit log entry.',
    activeLayerId: 'network-broadcast',
    cryptoOperations: [
      'TLS-encrypted RPC submission',
      'Block confirmation monitoring',
      'HMAC-SHA256 audit log chaining',
    ],
    pqcConsiderations:
      'RPC TLS should use hybrid key exchange. Audit logging (HMAC-SHA256) is already quantum-safe. Block confirmation depends on the chain mining/consensus mechanism.',
  },
]
