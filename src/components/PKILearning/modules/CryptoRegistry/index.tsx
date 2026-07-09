// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Search, Waypoints } from 'lucide-react'
import { CryptoRegistryIntroduction } from './components/CryptoRegistryIntroduction'
import { CryptoRegistryExercises } from './components/CryptoRegistryExercises'
import { AlgorithmNormalizer } from './workshop/AlgorithmNormalizer'
import { CurveLookup } from './workshop/CurveLookup'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'algorithm-normalizer',
    title: 'Step 1: Algorithm Name Normalizer',
    description: 'Resolve an HSM, JWT, or scanner identifier to its canonical family.',
    icon: Search,
  },
  {
    id: 'curve-lookup',
    title: 'Step 2: Curve Identifier Lookup',
    description: 'Resolve a curve name, alias, or OID to its canonical registry entry.',
    icon: Waypoints,
  },
]

export const CryptoRegistryModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="CycloneDX Cryptography Registry"
    description="One canonical name per cryptographic mechanism — resolve the same algorithm or curve across HSM, certificate, protocol and library notations."
    learn={(api) => <CryptoRegistryIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <CryptoRegistryExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <AlgorithmNormalizer key={`normalizer-${configKey}`} />
        case 1:
          return <CurveLookup key={`curve-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
