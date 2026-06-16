// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { BarChart3, Grid3X3, GitCompare, Clock, PenLine } from 'lucide-react'
import { QuantumThreatsIntroduction } from './components/QuantumThreatsIntroduction'
import { QuantumThreatsExercises } from './components/QuantumThreatsExercises'
import { SecurityLevelDegradation } from './workshop/SecurityLevelDegradation'
import { AlgorithmVulnerabilityMatrix } from './workshop/AlgorithmVulnerabilityMatrix'
import { KeySizeAnalyzer } from './workshop/KeySizeAnalyzer'
import { HNDLTimeline } from './workshop/HNDLTimeline'
import { HNFLTimeline } from './workshop/HNFLTimeline'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'security-levels',
    title: 'Step 1: Security Level Degradation',
    description: 'See how quantum attacks reduce algorithm security.',
    icon: BarChart3,
  },
  {
    id: 'vulnerability-matrix',
    title: 'Step 2: Vulnerability Matrix',
    description: 'Full algorithm vs. quantum attack comparison.',
    icon: Grid3X3,
  },
  {
    id: 'key-size-analyzer',
    title: 'Step 3: Key Size Analyzer',
    description: 'Compare two algorithms side-by-side.',
    icon: GitCompare,
  },
  {
    id: 'hndl-timeline',
    title: 'Step 4: HNDL Timeline',
    description: 'Calculate your migration deadline.',
    icon: Clock,
  },
  {
    id: 'hnfl-timeline',
    title: 'Step 5: HNFL Risk Calculator',
    description: 'Calculate when signing credentials must be rotated to PQC.',
    icon: PenLine,
  },
]

export const QuantumThreatsModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Quantum Threat Mechanics"
    description="How quantum computers break RSA, ECC, and weaken AES — and why PQC algorithms survive."
    learn={(api) => <QuantumThreatsIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <QuantumThreatsExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as { algorithmA?: string; algorithmB?: string } | undefined
      switch (index) {
        case 0:
          return (
            <SecurityLevelDegradation
              key={`security-${configKey}`}
              initialAlgorithm={c?.algorithmA}
            />
          )
        case 1:
          return <AlgorithmVulnerabilityMatrix />
        case 2:
          return (
            <KeySizeAnalyzer
              key={`keysize-${configKey}`}
              initialAlgorithmA={c?.algorithmA}
              initialAlgorithmB={c?.algorithmB}
            />
          )
        case 3:
          return <HNDLTimeline />
        case 4:
          return <HNFLTimeline />
        default:
          return null
      }
    }}
  />
)
