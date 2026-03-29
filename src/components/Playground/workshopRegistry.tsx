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
  Layers,
  Radio,
  Bitcoin,
  Workflow,
  Terminal,
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
    moduleLink: '/learn/stateful-signatures',
    keywords: ['slh-dsa', 'sphincs', 'fips 205', 'stateless', 'hash-based', 'sign', 'verify'],
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
    id: 'binary-signing',
    name: 'Code Signing',
    description: 'ML-DSA binary signing with SHA-256 digest and KAT validation',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA-44/65/87', 'SHA-256'],
    icon: FileSignature,
    moduleLink: '/learn/code-signing',
    keywords: ['code signing', 'binary', 'ml-dsa', 'sha-256', 'kat', 'acvp', 'artifact'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'researcher', 'ops'],
  },
  {
    id: 'pkcs11-sim',
    name: 'PKCS#11 Walkthrough',
    description: 'Step-by-step PKCS#11 operations: keygen, encap, sign, wrap, mechanisms',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-KEM', 'ML-DSA', 'AES', 'EC'],
    icon: ShieldCheck,
    moduleLink: '/learn/hsm-pqc',
    keywords: ['pkcs11', 'pkcs#11', 'hsm', 'token', 'session', 'mechanism', 'slot', 'walkthrough'],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
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
    description: 'NIST SP 800-108 counter-mode key derivation with HMAC-SHA256',
    category: 'HSM / PKCS#11',
    algorithms: ['SP 800-108', 'HMAC-SHA256'],
    icon: KeyRound,
    moduleLink: '/learn/kms-pqc',
    keywords: ['kdf', 'key derivation', 'sp 800-108', 'hmac', 'counter mode', 'kbkdf'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },
  {
    id: 'provider-pattern',
    name: 'Crypto Provider Patterns',
    description: 'Compare PKCS#11, JCA/JCE, OpenSSL, CNG crypto provider patterns',
    category: 'HSM / PKCS#11',
    algorithms: ['ML-DSA-65', 'PKCS#11'],
    icon: Layers,
    moduleLink: '/learn/crypto-dev-apis',
    keywords: ['provider', 'jca', 'jce', 'openssl', 'cng', 'bouncy castle', 'api', 'mechanism'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
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

  // ── Certificates & Proofs ─────────────────────────────────────────────────
  {
    id: 'hybrid-certs',
    name: 'Hybrid Certificates',
    description: 'Generate PQC and composite X.509v3 certificates via OpenSSL',
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
    name: 'Merkle Proof Verifier',
    description: 'SHA-256 Merkle tree construction, inclusion proofs, and tamper detection',
    category: 'Certificates & Proofs',
    algorithms: ['SHA-256', 'Merkle Tree'],
    icon: Hash,
    moduleLink: '/learn/merkle-tree-certs',
    keywords: ['merkle', 'tree', 'proof', 'inclusion', 'sha-256', 'tamper', 'transparency log'],
    difficulty: 'beginner',
    recommendedPersonas: ['developer', 'researcher', 'curious'],
  },
  {
    id: 'hybrid-signing',
    name: 'Hybrid Signature Demo',
    description:
      'Sign the same message with ECDSA-P256 and ML-DSA-65 in parallel — compare signature sizes and verify both. Demonstrates the PQC migration co-existence pattern.',
    category: 'Certificates & Proofs',
    algorithms: ['ML-DSA-65', 'ECDSA-P256', 'SHA-256'],
    icon: FileSignature,
    moduleLink: '/learn/hybrid-crypto',
    keywords: [
      'hybrid',
      'dual signature',
      'ml-dsa',
      'ecdsa',
      'migration',
      'co-existence',
      'comparison',
      'pqc',
      'classical',
    ],
    difficulty: 'intermediate',
    recommendedPersonas: ['developer', 'architect', 'researcher', 'ops'],
  },

  // ── Protocol Simulations ──────────────────────────────────────────────────
  {
    id: 'qkd-postproc',
    name: 'QKD Post-Processing',
    description:
      'Classical simulation of BB84 quantum key distribution with SHA-256 privacy amplification',
    category: 'Protocol Simulations',
    algorithms: ['BB84', 'SHA-256', 'HKDF'],
    icon: Radio,
    moduleLink: '/learn/qkd',
    keywords: ['qkd', 'bb84', 'quantum key distribution', 'privacy amplification', 'sifting'],
    difficulty: 'intermediate',
    recommendedPersonas: ['researcher', 'curious', 'architect'],
  },
  {
    id: 'suci-flow',
    name: '5G SUCI Construction',
    description: 'ECDH + HKDF + AES subscriber concealment for 5G networks',
    category: 'Protocol Simulations',
    algorithms: ['ECDH', 'HKDF', 'AES-128/256'],
    icon: Radio,
    moduleLink: '/learn/network-security-pqc',
    keywords: ['5g', 'suci', 'supi', 'subscriber', 'concealment', 'ecdh', 'hkdf', 'aes'],
    difficulty: 'advanced',
    recommendedPersonas: ['developer', 'architect', 'researcher'],
  },

  // ── Blockchain / Digital Assets ───────────────────────────────────────────
  {
    id: 'pqc-comparison',
    name: 'PQC vs Classical',
    description: 'Live secp256k1 ECDSA vs ML-DSA-65 signing comparison',
    category: 'Blockchain & Digital Assets',
    algorithms: ['secp256k1', 'ML-DSA-65'],
    icon: Bitcoin,
    moduleLink: '/learn/digital-assets',
    keywords: ['pqc', 'classical', 'comparison', 'secp256k1', 'ml-dsa', 'ecdsa', 'blockchain'],
    difficulty: 'beginner',
    recommendedPersonas: ['developer', 'researcher', 'curious'],
  },
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
    icon: Bitcoin,
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
]

export const CATEGORIES = [
  'OpenSSL Studio',
  'HSM / PKCS#11',
  'Entropy & Random',
  'Certificates & Proofs',
  'Blockchain & Digital Assets',
  'Protocol Simulations',
]

// ---------------------------------------------------------------------------
// Lazy-loaded components — each wrapped to handle named exports
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

export const TOOL_COMPONENTS: Record<string, LazyComp> = {
  'slh-dsa': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/StatefulSignatures/workshop/SLHDSALiveDemo').then(
      (m) => ({ default: m.SLHDSALiveDemo })
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
  'binary-signing': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/CodeSigning/workshop/BinarySigning').then((m) => ({
      default: m.BinarySigning,
    }))
  ),
  'pkcs11-sim': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HsmPqc/workshop/Pkcs11Simulator').then((m) => ({
      default: m.Pkcs11Simulator,
    }))
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
  'provider-pattern': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/CryptoDevAPIs/workshop/ProviderPatternWorkshop').then(
      (m) => ({ default: m.ProviderPatternWorkshop })
    )
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
  'hybrid-certs': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/HybridCrypto/workshop/HybridCertFormats').then(
      (m) => ({ default: m.HybridCertFormats })
    )
  ),
  'merkle-proof': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/MerkleTreeCerts/workshop/ProofVerifier').then((m) => ({
      default: m.ProofVerifier,
    }))
  ),
  'hybrid-signing': lazyWithRetry(() =>
    import('@/components/Playground/workshop/HybridSigningDemo').then((m) => ({
      default: m.HybridSigningDemo,
    }))
  ),
  'qkd-postproc': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/QKD/workshop/PostProcessingDemo').then((m) => ({
      default: m.PostProcessingDemo,
    }))
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
  'suci-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/FiveG/SuciFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'SuciFlow'
  ),
  'pqc-comparison': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/DigitalAssets/flows/PQCLiveComparisonFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'PQCLiveComparisonFlow'
  ),
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
}
