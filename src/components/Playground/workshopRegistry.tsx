// SPDX-License-Identifier: GPL-3.0-only
import React from 'react'
import {
  ShieldCheck,
  Lock,
  Fingerprint,
  Cpu,
  KeyRound,
  Hash,
  Dice5,
  FileSignature,
  Radio,
  Bitcoin,
  Zap,
  Workflow,
  Terminal,
  Shield,
} from 'lucide-react'
import { lazyWithRetry } from '@/utils/lazyWithRetry'
import type { PersonaId } from '@/data/learningPersonas'

// ---------------------------------------------------------------------------
// Tool registry — each entry describes a crypto-executing workshop component
// ---------------------------------------------------------------------------

export type ToolDifficulty = 'beginner' | 'intermediate' | 'advanced'

export interface WorkshopTool {
  id: string
  name: string
  description: string
  category: string
  algorithms: string[]
  icon: React.ElementType
  moduleLink: string
  keywords: string[]
  difficulty: ToolDifficulty
  /** Personas for whom this tool is a primary (★★) fit */
  recommendedPersonas: PersonaId[]
  /** Tool is under active development — show WIP badge on card */
  wip?: boolean
}

export const WORKSHOP_TOOLS: WorkshopTool[] = [
  // ── HSM / PKCS#11 Operations ──────────────────────────────────────────────
  {
    id: 'slh-dsa',
    name: 'SLH-DSA Sign & Verify',
    description: 'All 12 FIPS 205 parameter sets with pre-hash support',
    category: 'HSM / PKCS#11',
    algorithms: ['SLH-DSA', 'SHA2', 'SHAKE'],
    icon: FileSignature,
    moduleLink: '/learn/slh-dsa',
    keywords: ['slh-dsa', 'sphincs', 'fips 205', 'stateless', 'hash-based', 'sign', 'verify'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },
  {
    id: 'lms-hss',
    name: 'Stateful Hash Signatures',
    description: 'LMS and XMSS stateful signature trees using SoftHSMv3',
    category: 'HSM / PKCS#11',
    algorithms: ['LMS', 'HSS', 'XMSS'],
    icon: FileSignature,
    moduleLink: '/learn/stateful-signatures',
    keywords: ['lms', 'hss', 'xmss', 'stateful', 'hash-based', 'fips 208'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },
  {
    id: 'hybrid-encrypt',
    name: 'Hybrid KEM + ECDH',
    description: 'ML-KEM + X25519 ECDH + HKDF hybrid encryption pipeline',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM-768', 'X25519', 'HKDF'],
    icon: Lock,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['hybrid', 'kem', 'ecdh', 'hkdf', 'ml-kem', 'x25519', 'encryption', 'key agreement'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },
  {
    id: 'envelope-encrypt',
    name: 'Envelope Encryption',
    description: 'ML-KEM + AES key wrap in a KMS envelope encryption pattern',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM-768', 'AES-256', 'Key Wrap'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: ['envelope', 'kms', 'key wrap', 'ml-kem', 'aes', 'dek', 'kek'],
    difficulty: 'intermediate',
    recommendedPersonas: ['architect', 'researcher', 'ops'],
  },
  {
    id: 'token-migration',
    name: 'Multi-Algorithm Signing',
    description: 'Compare ML-DSA, ECDSA, and RSA signing in a token migration workflow',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA', 'ECDSA', 'RSA'],
    icon: Fingerprint,
    moduleLink: '/learn/iam-pqc',
    keywords: ['token', 'migration', 'iam', 'ml-dsa', 'ecdsa', 'rsa', 'multi-algorithm', 'jwt'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },
  {
    id: 'tee-channel',
    name: 'TEE-HSM Secure Channel',
    description: 'Build a TEE-to-HSM trusted channel with ML-DSA + ML-KEM + AES wrap',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA', 'ML-KEM-768', 'AES Key Wrap'],
    icon: Cpu,
    moduleLink: '/learn/confidential-computing',
    keywords: ['tee', 'trusted execution', 'confidential', 'channel', 'attestation', 'hsm'],
    difficulty: 'advanced',
    recommendedPersonas: ['architect', 'researcher'],
  },
  {
    id: 'firmware-signing',
    name: 'Firmware Signing',
    description: 'ML-DSA-87 UEFI secure boot firmware signing and verification',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA-87', 'SHA-256'],
    icon: Cpu,
    moduleLink: '/learn/secure-boot-pqc',
    keywords: ['firmware', 'uefi', 'secure boot', 'ml-dsa', 'signing', 'verification'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },
  {
    id: 'kdf-derivation',
    name: 'SP 800-108 KDF',
    description:
      'NIST SP 800-108 counter-mode key derivation — applicable to KEM secrets, PSK, QKD, and password-derived keys',
    category: 'HSM / PKCS#11',
    algorithms: ['SP 800-108', 'HMAC-SHA256', 'PBKDF2', 'HKDF'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: [
      'kdf',
      'key derivation',
      'sp 800-108',
      'hmac',
      'counter mode',
      'kbkdf',
      'pbkdf2',
      'hkdf',
      'psk',
      'kem',
    ],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },
  {
    id: 'vpn-sim',
    name: 'PQC VPN Simulator',
    description:
      'Full IKEv2 handshake in WASM with PKCS#11 crypto routed through softhsmv3. Inspect live C_* calls, ECDH key exchange, and PSK authentication between initiator and responder.',
    category: 'HSM / PKCS#11',
    algorithms: ['IKEv2', 'ECDH', 'AES-256-CBC', 'HMAC-SHA2-256', 'PKCS#11'],
    icon: Shield,
    moduleLink: '/learn/network-security-pqc',
    keywords: [
      'vpn',
      'ipsec',
      'ikev2',
      'pkcs11',
      'hsm',
      'softhsm',
      'ecdh',
      'wasm',
      'charon',
      'strongswan',
      'pqc',
      'hybrid',
      'rpc',
    ],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'ops', 'researcher'],
  },

  // ── Entropy & Random ──────────────────────────────────────────────────────
  {
    id: 'rng-demo',
    name: 'Random Generation',
    description: 'Web Crypto + OpenSSL DRBG random generation with statistical analysis',
    category: 'Entropy & Random',
    algorithms: ['Web Crypto', 'OpenSSL DRBG'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: ['random', 'rng', 'drbg', 'web crypto', 'openssl', 'math.random', 'statistics'],
    difficulty: 'beginner',
    recommendedPersonas: ['researcher', 'developer', 'architect', 'ops'],
  },
  {
    id: 'entropy-test',
    name: 'Entropy Testing',
    description: 'NIST SP 800-90B entropy test suite: monobit, frequency, min-entropy',
    category: 'Entropy & Random',
    algorithms: ['SP 800-90B', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: ['entropy', 'testing', 'sp 800-90b', 'monobit', 'frequency', 'min-entropy', 'nist'],
    difficulty: 'intermediate',
    recommendedPersonas: ['researcher', 'architect', 'developer'],
  },
  {
    id: 'qrng-demo',
    name: 'QRNG Demo',
    description:
      'Simulates quantum random number generation patterns using CSPRNG statistical analysis. Note: runs in-browser via Web Crypto — not a physical QRNG device.',
    category: 'Entropy & Random',
    algorithms: ['TRNG', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: ['qrng', 'quantum random', 'trng', 'true random', 'statistics'],
    difficulty: 'beginner',
    recommendedPersonas: ['researcher', 'curious'],
  },
  {
    id: 'source-combining',
    name: 'Source Combining',
    description:
      'SP 800-90C source combining: XOR, Hash, HMAC, Concat + HKDF/Hash_df/AES-CMAC conditioning via SoftHSMv3',
    category: 'Entropy & Random',
    algorithms: ['SHA-256', 'HMAC-SHA-256', 'HKDF', 'AES-CMAC', 'XOR', 'Hash_df'],
    icon: Dice5,
    moduleLink: '/learn/entropy-randomness',
    keywords: [
      'source combining',
      'xor',
      'hmac',
      'hkdf',
      'hash_df',
      'aes-cmac',
      'conditioning',
      'entropy pool',
      'sp 800-90c',
      'rbg',
    ],
    difficulty: 'advanced',
    recommendedPersonas: ['researcher', 'architect', 'developer'],
  },
  {
    id: 'drbg-demo',
    name: 'SP 800-90A DRBG',
    description:
      'Interactive visualization of HMAC_DRBG internal state (Instantiate, Generate, Reseed) complying with NIST SP 800-90A.',
    category: 'Entropy & Random',
    algorithms: ['HMAC_DRBG', 'SHA-256'],
    icon: Workflow,
    moduleLink: '/learn/entropy-randomness',
    keywords: [
      'drbg',
      'sp 800-90a',
      'hmac_drbg',
      'instantiate',
      'generate',
      'reseed',
      'entropy',
      'random',
    ],
    difficulty: 'advanced',
    recommendedPersonas: ['architect', 'developer', 'researcher'],
  },

  // ── Certificates & Proofs ─────────────────────────────────────────────────
  {
    id: 'pki-workshop',
    name: 'PKI Workshop',
    description:
      'Build a full certificate chain hands-on: CSR → Root CA → cert issuance → parsing → CRL',
    category: 'Certificates & Proofs',
    algorithms: ['RSA', 'EC', 'ML-DSA', 'X.509', 'CRL'],
    icon: ShieldCheck,
    moduleLink: '/learn/pki-workshop',
    keywords: [
      'pki',
      'x509',
      'certificate',
      'csr',
      'root ca',
      'signing',
      'crl',
      'revocation',
      'chain',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops', 'curious'],
  },
  {
    id: 'hybrid-certs',
    name: 'Hybrid Certificates',
    description:
      'Generate and compare six X.509 hybrid certificate formats via SoftHSM PKCS#11 + real DER encoding',
    category: 'Certificates & Proofs',
    algorithms: ['SLH-DSA', 'ML-DSA-65', 'ECDSA-P256'],
    icon: ShieldCheck,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['certificate', 'x509', 'composite', 'hybrid', 'pqc', 'openssl', 'der'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },
  {
    id: 'merkle-proof',
    name: 'Merkle Tree Workshop',
    description:
      'Build trees, generate inclusion proofs, verify with tamper detection, compare PQC cert sizes, and simulate Certificate Transparency logs',
    category: 'Certificates & Proofs',
    algorithms: ['SHA-256', 'Merkle Tree', 'CT Log'],
    icon: Hash,
    moduleLink: '/learn/merkle-tree-certs',
    keywords: [
      'merkle',
      'tree',
      'proof',
      'inclusion',
      'sha-256',
      'tamper',
      'transparency log',
      'ct',
      'sct',
      'consistency',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'researcher', 'curious'],
  },

  // ── Protocol Simulations ──────────────────────────────────────────────────
  {
    id: 'suci-flow',
    name: '5G SUCI Construction',
    description: 'ECDH + ANSI X9.63-KDF + AES subscriber concealment for 5G networks',
    category: 'Protocol Simulations',
    algorithms: ['ECDH', 'ANSI X9.63-KDF', 'AES-128/256'],
    icon: Radio,
    moduleLink: '/learn/network-security-pqc',
    keywords: ['5g', 'suci', 'supi', 'subscriber', 'concealment', 'ecdh', 'hkdf', 'aes'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },

  // ── Digital Identity ──────────────────────────────────────────────────────
  {
    id: 'digital-id',
    name: 'EUDI Wallet Architecture',
    description:
      'Complete digital identity lifecycle: Wallet, PID Issuance, Attestation, RP Verification, and QES Provider.',
    category: 'Digital Identity',
    algorithms: ['OpenID4VCI', 'P-256', 'mDoc', 'QES'],
    icon: Shield,
    moduleLink: '/learn/digital-id',
    keywords: [
      'eudi',
      'digital id',
      'wallet',
      'pid',
      'mdoc',
      'openid4vci',
      'qes',
      'qtsp',
      'attestation',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },

  // ── Blockchain / Digital Assets ───────────────────────────────────────────
  {
    id: 'bitcoin-flow',
    name: 'Bitcoin Transaction',
    description: 'secp256k1 ECDSA keypair, SHA256 + RIPEMD160, transaction signing',
    category: 'Blockchain & Digital Assets',
    algorithms: ['secp256k1', 'SHA-256', 'RIPEMD160'],
    icon: Bitcoin,
    moduleLink: '/learn/digital-assets',
    keywords: ['bitcoin', 'secp256k1', 'ecdsa', 'transaction', 'utxo', 'sha256', 'ripemd160'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'researcher'],
  },
  {
    id: 'solana-flow',
    name: 'Solana Transaction',
    description: 'Ed25519 keypair generation and transaction signing',
    category: 'Blockchain & Digital Assets',
    algorithms: ['Ed25519'],
    icon: Zap,
    moduleLink: '/learn/digital-assets',
    keywords: ['solana', 'ed25519', 'eddsa', 'transaction', 'base58'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'researcher'],
  },
  {
    id: 'hd-wallet',
    name: 'HD Wallet Derivation',
    description: 'BIP39 mnemonic + BIP32/SLIP-0010 multi-coin HD key derivation',
    category: 'Blockchain & Digital Assets',
    algorithms: ['BIP39', 'BIP32', 'PBKDF2', 'HMAC-SHA512'],
    icon: Workflow,
    moduleLink: '/learn/digital-assets',
    keywords: ['hd wallet', 'bip39', 'bip32', 'mnemonic', 'derivation', 'pbkdf2', 'slip-0010'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'researcher'],
  },

  // ── OpenSSL Studio ────────────────────────────────────────────────────────
  {
    id: 'openssl-studio',
    name: 'OpenSSL Studio',
    description:
      'Full OpenSSL v3.6.1 environment: keygen, certificates, CSR, KEM, signing, KDF, encryption — all via WASM',
    category: 'OpenSSL Studio',
    algorithms: ['RSA', 'EC', 'Ed25519', 'ML-KEM', 'ML-DSA', 'SLH-DSA', 'AES', 'HKDF', 'X.509'],
    icon: Terminal,
    moduleLink: '/playground/openssl-studio',
    keywords: [
      'openssl',
      'studio',
      'wasm',
      'genpkey',
      'req',
      'x509',
      'dgst',
      'enc',
      'kem',
      'kdf',
      'pkcs12',
      'lms',
      'certificate',
      'csr',
      'signing',
      'encryption',
      'hashing',
      'key generation',
      'random',
      'pqc',
      'terminal',
      'command line',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },
  {
    id: 'tls-simulator',
    name: 'TLS 1.3 Simulator',
    description:
      'Client–server TLS 1.3 handshake simulator: configure cipher suites, key exchange groups, mTLS, PQC and hybrid certificates',
    category: 'OpenSSL Studio',
    algorithms: ['TLS 1.3', 'ML-KEM', 'X25519MLKEM768', 'ML-DSA', 'ECDSA', 'RSA'],
    icon: Shield,
    moduleLink: '/learn/tls-basics',
    keywords: [
      'tls',
      'tls 1.3',
      'handshake',
      'client',
      'server',
      'cipher',
      'ml-kem',
      'x25519',
      'hybrid',
      'mtls',
      'certificate',
      'pqc',
      'openssl',
      'simulation',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },
]

export const CATEGORIES = [
  'OpenSSL Studio',
  'HSM / PKCS#11',
  'Entropy & Random',
  'Certificates & Proofs',
  'Digital Identity',
  'Blockchain & Digital Assets',
  'Protocol Simulations',
]

// ---------------------------------------------------------------------------
// Lazy-loaded components — each wrapped to handle named exports
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

const LazySuciFlow = lazyWithRetry(() =>
  import('@/components/Playground/SuciFlowRoute').then((m) => ({ default: m.SuciFlowRoute }))
)

export const TOOL_COMPONENTS: Record<string, LazyComp> = {
  'suci-flow': LazySuciFlow,
  'slh-dsa': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/StatefulSignatures/workshop/SLHDSALiveDemo').then(
      (m) => ({ default: m.SLHDSALiveDemo })
    )
  ),
  'lms-hss': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/StatefulSignatures/workshop/StatefulSignaturesDemo').then(
      (m) => ({ default: m.StatefulSignaturesDemo })
    )
  ),
  'hybrid-encrypt': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridEncryptionDemo').then(
      (m) => ({ default: m.HybridEncryptionDemo })
    )
  ),
  'envelope-encrypt': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/KmsPqc/workshop/EnvelopeEncryptionDemo').then((m) => ({
      default: m.EnvelopeEncryptionDemo,
    }))
  ),
  'token-migration': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/IAMPQC/workshop/TokenMigrationLab').then((m) => ({
      default: m.TokenMigrationLab,
    }))
  ),
  'tee-channel': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/ConfidentialComputing/workshop/TEEHSMTrustedChannel').then(
      (m) => ({ default: m.TEEHSMTrustedChannel })
    )
  ),
  'firmware-signing': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/SecureBootPQC/workshop/FirmwareSigningMigrator').then(
      (m) => ({ default: m.FirmwareSigningMigrator })
    )
  ),
  'kdf-derivation': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/QKD/workshop/HSMKeyDerivationDemo').then((m) => ({
      default: m.HSMKeyDerivationDemo,
    }))
  ),
  'vpn-sim': lazyWithRetry(() =>
    import('@/components/Playground/hsm/VpnSimulationPanel').then((m) => ({
      default: m.VpnSimulationPanel,
    }))
  ),
  'rng-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/RandomGenerationDemo').then((m) => ({
      default: m.RandomGenerationDemo,
    }))
  ),
  'entropy-test': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/EntropyTestingDemo').then((m) => ({
      default: m.EntropyTestingDemo,
    }))
  ),
  'qrng-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/QRNGDemo').then((m) => ({
      default: m.QRNGDemo,
    }))
  ),
  'source-combining': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/SourceCombiningDemo').then((m) => ({
      default: m.SourceCombiningDemo,
    }))
  ),
  'drbg-demo': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/Entropy/workshop/DrbgArchitectureDemo').then((m) => ({
      default: m.DrbgArchitectureDemo,
    }))
  ),
  'hybrid-certs': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridCertFormats').then(
      (m) => ({ default: m.HybridCertFormats })
    )
  ),
  'merkle-proof': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MerkleTreeCerts/workshop/MerkleWorkshopSteps').then(
      (m) => ({ default: m.MerkleWorkshopSteps })
    )
  ),
  'pki-workshop': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PKIWorkshop').then((m) => {
      function PKIWorkshopPlayground() {
        return <m.PKIWorkshop playgroundMode />
      }
      PKIWorkshopPlayground.displayName = 'PKIWorkshopPlayground'
      return { default: PKIWorkshopPlayground }
    })
  ),
  'openssl-studio': lazyWithRetry(() =>
    import('@/components/OpenSSLStudio/OpenSSLStudioView').then((m) => {
      function EmbeddedOpenSSL() {
        return <m.OpenSSLStudioView embedded />
      }
      EmbeddedOpenSSL.displayName = 'EmbeddedOpenSSL'
      return { default: EmbeddedOpenSSL }
    })
  ),
  'tls-simulator': lazyWithRetry(() =>
    import('@/components/OpenSSLStudio/TLSSimulatorTab').then((m) => ({
      default: m.TLSSimulatorTab,
    }))
  ),
}

export function makeLazyWithOnBack(
  importFn: () => Promise<Record<string, React.ComponentType<{ onBack: () => void }>>>,
  exportName: string
): LazyComp {
  return lazyWithRetry(() =>
    importFn().then((m) => {
      const Comp = m[exportName] as React.ComponentType<{ onBack: () => void }>
      function WorkshopWrapper(props: { onBack: () => void }) {
        return <Comp {...props} />
      }
      WorkshopWrapper.displayName = `Workshop_${exportName}`
      return { default: WorkshopWrapper }
    })
  ) as LazyComp
}

export const ONBACK_COMPONENTS: Record<string, LazyComp> = {
  'bitcoin-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/BitcoinFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'BitcoinFlow'
  ),
  'solana-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/SolanaFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'SolanaFlow'
  ),
  'hd-wallet': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/HDWalletFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'HDWalletFlow'
  ),
  'digital-id': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalID/index') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'DigitalIDModule'
  ),
}
