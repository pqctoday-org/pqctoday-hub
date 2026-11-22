// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Lock, PenLine, Ruler } from 'lucide-react'
import { PQCAlgorithmsIntroduction } from './components/PQCAlgorithmsIntroduction'
import { MLKEMRoundTrip } from './workshop/MLKEMRoundTrip'
import { MLDSASignVerify } from './workshop/MLDSASignVerify'
import { SizeComparator } from './workshop/SizeComparator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'ml-kem-round-trip',
    title: 'Step 1: ML-KEM Round Trip',
    description:
      'Generate an ML-KEM key pair, encapsulate, decapsulate, then change one byte of the ciphertext and decapsulate again, with the sentences from the documents beside each result.',
    icon: Lock,
  },
  {
    id: 'ml-dsa-sign-verify',
    title: 'Step 2: ML-DSA Sign and Verify',
    description:
      'Generate an ML-DSA key pair, sign a message in the hedged or deterministic mode with or without a context string, and verify it against the same or a changed message or context.',
    icon: PenLine,
  },
  {
    id: 'size-comparator',
    title: 'Step 3: Size Comparator',
    description:
      'Compare key, signature and ciphertext sizes across the ML-KEM and ML-DSA parameter sets and two classical entries, next to the sentences that state them.',
    icon: Ruler,
  },
]

export const PQCAlgorithmsModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="The standardised post-quantum algorithms read from their documents: ML-KEM and ML-DSA in full, hash-based signatures in brief, what named bodies say about choosing, and a workshop that runs ML-KEM and ML-DSA in the browser."
    learn={(api) => <PQCAlgorithmsIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <MLKEMRoundTrip key={`kem-${configKey}`} />
        case 1:
          return <MLDSASignVerify key={`dsa-${configKey}`} />
        case 2:
          return <SizeComparator key={`size-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
