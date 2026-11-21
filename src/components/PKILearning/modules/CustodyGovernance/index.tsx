// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Scale } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'
import { CustodyGovernanceIntroduction } from './components/CustodyGovernanceIntroduction'
import {
  CustodyGovernanceExercises,
  type CustodyGovernanceWorkshopConfig,
} from './components/CustodyGovernanceExercises'
import { RegulationControlMapperWorkshop } from './workshop/RegulationControlMapperWorkshop'

const PARTS: WorkshopPart[] = [
  {
    id: 'regulation-control-mapper',
    title: 'W11: Regulation & Assurance Control Mapper',
    description:
      'Compare custody design presets side by side across jurisdictions with applicability gates, a separate US federal context band, and market-practice insurer and auditor columns.',
    icon: Scale,
  },
]

export const CustodyGovernanceModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="How a digital-asset custody design is evaluated, regulated, insured, and audited — six evaluation questions with Rule G1 checks, jurisdiction-scoped regulatory control maps, and assurance boundaries."
    learn={(api) => (
      <CustodyGovernanceIntroduction onNavigateToWorkshop={(step) => api.goToWorkshop(step)} />
    )}
    exercises={(api) => (
      <CustodyGovernanceExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey, config) => {
      const cfg = config as CustodyGovernanceWorkshopConfig | undefined
      switch (index) {
        case 0:
          return (
            <RegulationControlMapperWorkshop
              key={`w11-${configKey}`}
              initialPreset={cfg?.preset}
              initialJurisdictions={cfg?.jurisdictions}
            />
          )
        default:
          return null
      }
    }}
  />
)
