// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Key, Lock, Shield, Layers, Search, Fingerprint, LockKeyhole } from 'lucide-react'
import { HybridCryptoIntroduction } from './components/HybridCryptoIntroduction'
import { HybridCryptoExercises } from './components/HybridCryptoExercises'
import { HybridKeyGeneration } from './workshop/HybridKeyGeneration'
import { HybridEncryptionDemo } from './workshop/HybridEncryptionDemo'
import { HybridCASetup } from './workshop/HybridCASetup'
import { HybridCertFormats } from './workshop/HybridCertFormats'
import { HybridCertInspector } from './workshop/HybridCertInspector'
import { HybridSignatures } from './workshop/HybridSignatures'
import { HpkeWorkshop } from './workshop/HpkeWorkshop'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'key-generation',
    title: 'Step 1: Key Generation',
    description: 'Compare classical, PQC, and hybrid key generation.',
    icon: Key,
  },
  {
    id: 'encrypt-sign',
    title: 'Step 2: Hybrid KEM',
    description:
      'X25519 ECDH plus ML-KEM-768 encapsulation, combined into one session key; compare combiners.',
    icon: Lock,
  },
  {
    id: 'hpke',
    title: 'Step 3: HPKE',
    description: 'RFC 9180 Hybrid Public Key Encryption, composed from PKCS#11 v3.2 primitives.',
    icon: LockKeyhole,
  },
  {
    id: 'hybrid-signatures',
    title: 'Step 4: Hybrid Signatures',
    description:
      'Concatenation, nesting, and Silithium — from no non-separability to the SNS that Silithium targets.',
    icon: Fingerprint,
  },
  {
    id: 'ca-setup',
    title: 'Step 5: CA Setup',
    description: 'Generate classical and PQC root CAs for the certificate sandbox.',
    icon: Shield,
  },
  {
    id: 'hybrid-formats',
    title: 'Step 6: Hybrid Formats',
    description: 'Generate and compare hybrid X.509 certificate approaches.',
    icon: Layers,
  },
  {
    id: 'inspect-compare',
    title: 'Step 7: Inspect & Compare',
    description: 'Deep-dive into certificate structures with IETF reference artifacts.',
    icon: Search,
  },
]

export const HybridCryptoModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Hybrid & Composite Cryptography"
    description="Combine classical and PQC algorithms for defense in depth during the quantum transition."
    learn={(api) => <HybridCryptoIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <HybridCryptoExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as { category?: 'kem' | 'signature' } | undefined
      switch (index) {
        case 0:
          return <HybridKeyGeneration key={`keygen-${configKey}`} initialCategory={c?.category} />
        case 1:
          return <HybridEncryptionDemo key={`enc-${configKey}`} />
        case 2:
          return <HpkeWorkshop key={`hpke-${configKey}`} />
        case 3:
          return <HybridSignatures key={`hybrid-sigs-${configKey}`} />
        case 4:
          return <HybridCASetup key={`ca-${configKey}`} />
        case 5:
          return <HybridCertFormats key={`formats-${configKey}`} />
        case 6:
          return <HybridCertInspector key={`inspect-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
