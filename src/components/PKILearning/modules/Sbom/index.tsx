// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { FileJson, Hammer } from 'lucide-react'
import { SbomIntroduction } from './components/SbomIntroduction'
import { SbomExercises } from './components/SbomExercises'
import { SbomFormatExplorer } from './workshop/SbomFormatExplorer'
import { SbomGenerationPicker } from './workshop/SbomGenerationPicker'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'sbom-format-explorer',
    title: 'Step 1: SBOM Format Explorer',
    description: 'SPDX vs CycloneDX for a generic component, mapped onto the NTIA elements.',
    icon: FileJson,
  },
  {
    id: 'sbom-generation-picker',
    title: 'Step 2: Generation Tool Picker',
    description: 'Match a build artifact type to a generator and format.',
    icon: Hammer,
  },
]

export const SbomModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    title="Software Bill of Materials (SBOM)"
    description="Inventory every software component a product depends on — the discovery input every downstream discipline builds on."
    learn={(api) => <SbomIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <SbomExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <SbomFormatExplorer key={`format-${configKey}`} />
        case 1:
          return <SbomGenerationPicker key={`generate-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
