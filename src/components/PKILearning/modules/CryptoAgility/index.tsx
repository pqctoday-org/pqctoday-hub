// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Layers, FileSearch, Route, ClipboardList } from 'lucide-react'
import { CryptoAgilityIntroduction } from './components/CryptoAgilityIntroduction'
import { CryptoAgilityExercises } from './components/CryptoAgilityExercises'
import { AbstractionLayerDemo } from './workshop/AbstractionLayerDemo'
import { CBOMScanner } from './workshop/CBOMScanner'
import { MigrationPlanningExercise } from './workshop/MigrationPlanningExercise'
import { AgilityReadinessAssessment } from './workshop/AgilityReadinessAssessment'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'abstraction-layer',
    title: 'Step 1: Abstraction Layer',
    description: 'See how algorithm-agnostic APIs enable instant backend swaps.',
    icon: Layers,
  },
  {
    id: 'cbom-scanner',
    title: 'Step 2: CBOM Scanner',
    description: 'Scan a sample enterprise to find quantum-vulnerable algorithms.',
    icon: FileSearch,
  },
  {
    id: 'migration-planning',
    title: 'Step 3: Migration Planning',
    description: 'Walk through the 7-phase PQC migration framework.',
    icon: Route,
  },
  {
    id: 'agility-assessment',
    title: 'Step 4: Agility Assessment',
    description: 'Score your organization across four crypto agility dimensions.',
    icon: ClipboardList,
  },
]

export const CryptoAgilityModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Crypto Agility & Architecture Patterns"
    description="Design systems that can rapidly swap cryptographic algorithms — the key to PQC migration readiness."
    learn={(api) => <CryptoAgilityIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <CryptoAgilityExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const c = config as { backend?: string } | undefined
      switch (index) {
        case 0:
          return (
            <AbstractionLayerDemo key={`abstraction-${configKey}`} initialBackend={c?.backend} />
          )
        case 1:
          return <CBOMScanner key={`cbom-${configKey}`} />
        case 2:
          return <MigrationPlanningExercise key={`migration-${configKey}`} />
        case 3:
          return <AgilityReadinessAssessment key={`assessment-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
