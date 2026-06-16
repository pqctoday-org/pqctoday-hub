// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Layers, ArrowRightLeft, KeyRound, Search, ClipboardCheck } from 'lucide-react'
import { DatabaseEncryptionIntroduction } from './components/DatabaseEncryptionIntroduction'
import { DatabaseEncryptionExercises } from './components/DatabaseEncryptionExercises'
import { EncryptionLayerMapper } from './workshop/EncryptionLayerMapper'
import { TDEMigrationPlanner } from './workshop/TDEMigrationPlanner'
import { BYOKKeyDesigner } from './workshop/BYOKKeyDesigner'
import { QueryableEncryptionLab } from './workshop/QueryableEncryptionLab'
import { DatabaseMigrationReadiness } from './workshop/DatabaseMigrationReadiness'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'encryption-layer-mapper',
    title: 'Step 1: Encryption Layer Mapper',
    description: 'Map database encryption layers and identify PQC upgrade paths for each tier.',
    icon: Layers,
  },
  {
    id: 'tde-migration-planner',
    title: 'Step 2: TDE Migration Planner',
    description: 'Step through TDE migration from AES-256 to ML-KEM-wrapped key hierarchy.',
    icon: ArrowRightLeft,
  },
  {
    id: 'byok-key-designer',
    title: 'Step 3: BYOK Architecture Designer',
    description: 'Design BYOK/HYOK key ownership architecture with PQC external KMS.',
    icon: KeyRound,
  },
  {
    id: 'queryable-encryption-lab',
    title: 'Step 4: Queryable Encryption Lab',
    description: 'Explore queryable encryption schemes and their PQC compatibility matrix.',
    icon: Search,
  },
  {
    id: 'database-readiness',
    title: 'Step 5: Migration Readiness Assessment',
    description: 'Assess your database fleet PQC readiness with guided checklist.',
    icon: ClipboardCheck,
  },
]

export const DatabaseEncryptionPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Migrate database encryption to quantum-safe algorithms: TDE re-keying, BYOK/HYOK key ownership, queryable encryption compatibility, and fleet readiness assessment."
    learn={(api) => <DatabaseEncryptionIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <DatabaseEncryptionExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <EncryptionLayerMapper key={`layer-${configKey}`} />
        case 1:
          return <TDEMigrationPlanner key={`tde-${configKey}`} />
        case 2:
          return <BYOKKeyDesigner key={`byok-${configKey}`} />
        case 3:
          return <QueryableEncryptionLab key={`qe-${configKey}`} />
        case 4:
          return <DatabaseMigrationReadiness key={`readiness-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
