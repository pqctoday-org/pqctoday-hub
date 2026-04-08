// SPDX-License-Identifier: GPL-3.0-only
import React, { useState, useMemo, useEffect, Suspense, useCallback } from 'react'
import {
  ArrowLeft,
  Search,
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
  Workflow,
  Terminal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { EmptyState } from '@/components/ui/empty-state'
import { useAchievementStore } from '@/store/useAchievementStore'
import { lazyWithRetry } from '@/utils/lazyWithRetry'

// ---------------------------------------------------------------------------
// Tool registry — each entry describes a crypto-executing workshop component
// ---------------------------------------------------------------------------

interface WorkshopTool {
  id: string
  name: string
  description: string
  category: string
  algorithms: string[]
  icon: React.ElementType
  moduleLink: string
  keywords: string[]
}

const WORKSHOP_TOOLS: WorkshopTool[] = [
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
  },
  {
    id: 'kdf-derivation',
    name: 'SP 800-108 KDF',
    description: 'NIST SP 800-108 counter-mode key derivation with HMAC-SHA256',
    category: 'HSM / PKCS#11',
    algorithms: ['SP 800-108', 'HMAC-SHA256'],
    icon: KeyRound,
    moduleLink: '/learn/qkd',
    keywords: ['kdf', 'key derivation', 'sp 800-108', 'hmac', 'counter mode', 'kbkdf'],
  },

  // ── Entropy & Random ──────────────────────────────────────────────────────
  {
    id: 'rng-demo',
    name: 'Random Generation',
    description: 'Web Crypto + OpenSSL DRBG random generation with statistical analysis',
    category: 'Entropy & Random',
    algorithms: ['Web Crypto', 'OpenSSL DRBG'],
    icon: Dice5,
    moduleLink: '/learn/entropy',
    keywords: ['random', 'rng', 'drbg', 'web crypto', 'openssl', 'math.random', 'statistics'],
  },
  {
    id: 'entropy-test',
    name: 'Entropy Testing',
    description: 'NIST SP 800-90B entropy test suite: monobit, frequency, min-entropy',
    category: 'Entropy & Random',
    algorithms: ['SP 800-90B', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy',
    keywords: ['entropy', 'testing', 'sp 800-90b', 'monobit', 'frequency', 'min-entropy', 'nist'],
  },
  {
    id: 'qrng-demo',
    name: 'QRNG Demo',
    description: 'Quantum random number generation with TRNG statistical analysis',
    category: 'Entropy & Random',
    algorithms: ['TRNG', 'Web Crypto'],
    icon: Dice5,
    moduleLink: '/learn/entropy',
    keywords: ['qrng', 'quantum random', 'trng', 'true random', 'statistics'],
  },
  {
    id: 'source-combining',
    name: 'Source Combining',
    description:
      'SP 800-90C source combining: XOR, Hash, HMAC, Concat + HKDF/Hash_df/AES-CMAC conditioning via SoftHSMv3',
    category: 'Entropy & Random',
    algorithms: ['SHA-256', 'HMAC-SHA-256', 'HKDF', 'AES-CMAC', 'XOR', 'Hash_df'],
    icon: Dice5,
    moduleLink: '/learn/entropy',
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
  },
  {
    id: 'hybrid-certs',
    name: 'Hybrid Certificates',
    description: 'Generate PQC and composite X.509v3 certificates via OpenSSL',
    category: 'Certificates & Proofs',
    algorithms: ['SLH-DSA', 'ML-DSA-65', 'ECDSA-P256'],
    icon: ShieldCheck,
    moduleLink: '/learn/hybrid-crypto',
    keywords: ['certificate', 'x509', 'composite', 'hybrid', 'pqc', 'openssl', 'der'],
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
  },

  // ── Protocol Simulations ──────────────────────────────────────────────────
  {
    id: 'suci-flow',
    name: '5G SUCI Construction',
    description: 'ECDH + HKDF + AES subscriber concealment for 5G networks',
    category: 'Protocol Simulations',
    algorithms: ['ECDH', 'HKDF', 'AES-128/256'],
    icon: Radio,
    moduleLink: '/learn/5g',
    keywords: ['5g', 'suci', 'supi', 'subscriber', 'concealment', 'ecdh', 'hkdf', 'aes'],
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
    moduleLink: '/openssl',
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
  },
]

const CATEGORIES = [
  'OpenSSL Studio',
  'HSM / PKCS#11',
  'Entropy & Random',
  'Certificates & Proofs',
  'Protocol Simulations',
  'Blockchain & Digital Assets',
]

// ---------------------------------------------------------------------------
// Lazy-loaded components — each wrapped to handle named exports
// ---------------------------------------------------------------------------

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LazyComp = React.LazyExoticComponent<React.ComponentType<any>>

const TOOL_COMPONENTS: Record<string, LazyComp> = {
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
  'pki-workshop': lazyWithRetry(() =>
    import('@/components/PKILearning/modules/PKIWorkshop').then((m) => {
      function PKIWorkshopPlayground() {
        return <m.PKIWorkshop playgroundMode />
      }
      PKIWorkshopPlayground.displayName = 'PKIWorkshopPlayground'
      return { default: PKIWorkshopPlayground }
    })
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

// Components with required onBack prop — wrapped to inject the callback
function makeLazyWithOnBack(
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

const ONBACK_COMPONENTS: Record<string, LazyComp> = {
  'suci-flow': makeLazyWithOnBack(
    () =>
      import('@/components/PKILearning/modules/FiveG/SuciFlow') as Promise<
        Record<string, React.ComponentType<{ onBack: () => void }>>
      >,
    'SuciFlow'
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

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export const WorkshopToolsTab: React.FC = () => {
  const [selectedToolId, setSelectedToolId] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  useEffect(() => {
    if (selectedToolId) useAchievementStore.getState().recordPlaygroundToolUsage(selectedToolId)
  }, [selectedToolId])

  const handleBack = useCallback(() => setSelectedToolId(null), [])

  const filteredTools = useMemo(() => {
    if (!searchQuery.trim()) return WORKSHOP_TOOLS
    const q = searchQuery.toLowerCase()
    return WORKSHOP_TOOLS.filter(
      (t) =>
        t.name.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.algorithms.some((a) => a.toLowerCase().includes(q)) ||
        t.keywords.some((k) => k.includes(q)) ||
        t.category.toLowerCase().includes(q)
    )
  }, [searchQuery])

  const groupedTools = useMemo(() => {
    const groups: Record<string, WorkshopTool[]> = {}
    for (const cat of CATEGORIES) {
      const tools = filteredTools.filter((t) => t.category === cat)
      if (tools.length > 0) groups[cat] = tools
    }
    return groups
  }, [filteredTools])

  const selectedTool = selectedToolId ? WORKSHOP_TOOLS.find((t) => t.id === selectedToolId) : null

  // Render the selected tool
  if (selectedTool) {
    const isOnBack = selectedTool.id in ONBACK_COMPONENTS
    const Comp = isOnBack ? ONBACK_COMPONENTS[selectedTool.id] : TOOL_COMPONENTS[selectedTool.id]

    return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={handleBack}>
            <ArrowLeft className="w-4 h-4 mr-1" />
            All Tools
          </Button>
          <span className="text-sm text-muted-foreground">
            {selectedTool.category} / {selectedTool.name}
          </span>
        </div>
        <Suspense
          fallback={
            <div className="space-y-4 p-4">
              <Skeleton className="h-8 w-64" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-32 w-full" />
            </div>
          }
        >
          {Comp && (isOnBack ? <Comp onBack={handleBack} /> : <Comp />)}
        </Suspense>
      </div>
    )
  }

  // Render tool selector grid
  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <div className="relative flex-1 w-full sm:max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search tools, algorithms, or keywords..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <span className="text-sm text-muted-foreground">
          {filteredTools.length} tool{filteredTools.length !== 1 ? 's' : ''}
        </span>
      </div>

      {Object.keys(groupedTools).length === 0 && (
        <EmptyState
          icon={<Search className="w-6 h-6" />}
          title={`No tools match \u201c${searchQuery}\u201d`}
        />
      )}

      {CATEGORIES.map((category) => {
        const tools = groupedTools[category]
        if (!tools) return null
        return (
          <div key={category}>
            <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              {category}
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {tools.map((tool) => {
                const Icon = tool.icon
                return (
                  <Button
                    key={tool.id}
                    variant="ghost"
                    onClick={() => setSelectedToolId(tool.id)}
                    className="glass-panel p-4 h-auto text-left hover:border-primary/40 transition-colors cursor-pointer group items-start justify-start"
                  >
                    <div className="flex items-start gap-3 w-full">
                      <Icon className="w-5 h-5 text-primary mt-0.5 shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                          {tool.name}
                        </p>
                        <p className="text-sm text-muted-foreground mt-1 line-clamp-2 whitespace-normal font-normal">
                          {tool.description}
                        </p>
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.algorithms.map((algo) => (
                            <span
                              key={algo}
                              className="inline-block text-xs px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-normal"
                            >
                              {algo}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Button>
                )
              })}
            </div>
          </div>
        )
      })}
    </div>
  )
}
