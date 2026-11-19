// SPDX-License-Identifier: AGPL-3.0-only
import type { FC } from 'react'
import { Radio, Cpu, Clock, ClipboardCheck } from 'lucide-react'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import { EnergyUtilitiesIntroduction } from './components/EnergyUtilitiesIntroduction'
import { EnergyUtilitiesExercises } from './components/EnergyUtilitiesExercises'
import { GridProtocolMapper } from './workshop/GridProtocolMapper'
import { SubstationMtuBudget } from './workshop/SubstationMtuBudget'
import { SmartMeterLifecyclePlanner } from './workshop/SmartMeterLifecyclePlanner'
import { GridEvidenceScope } from './workshop/GridEvidenceScope'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'grid-protocol-mapper',
    title: 'Step 1: Grid Protocol Mapper',
    description:
      'Map utility zones across substations, SCADA control centers, AMI meshes, and DER edge gateways, separating operational services from protected assets.',
    icon: Radio,
  },
  {
    id: 'substation-mtu-budget',
    title: 'Step 2: Substation MTU & Latency Lab',
    description:
      'Compare ECDSA P-256, RSA-2048, ML-KEM-768, ML-DSA-44/65, and HMAC-SHA-256 across IEC 62351, DNP3-SA, RF-mesh, and ICCP link budgets.',
    icon: Cpu,
  },
  {
    id: 'smart-meter-lifecycle',
    title: 'Step 3: Field Asset Lifecycle Planner',
    description:
      'Model 15–25 year IED, RTU, smart-meter, and DER lifecycles against Mosca windows to separate interim gateway mitigations from hardware refreshes.',
    icon: Clock,
  },
  {
    id: 'grid-evidence-scope',
    title: 'Step 4: Grid Evidence Checklist',
    description:
      'Scope utility OT/IT and OEM supply-chain PQC evidence using Yes/No/Unknown triage where unanswered items never mean low exposure.',
    icon: ClipboardCheck,
  },
]

export const EnergyUtilitiesPqcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Plan and verify post-quantum migration across power generation, transmission substations, SCADA control centers, AMI smart-meter meshes, and DER edge gateways under real-time latency, MTU, and 15–25 year field-lifecycle constraints."
    learn={(api) => <EnergyUtilitiesIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <EnergyUtilitiesExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <GridProtocolMapper key={`grid-mapper-${configKey}`} />
        case 1:
          return <SubstationMtuBudget key={`mtu-budget-${configKey}`} />
        case 2:
          return <SmartMeterLifecyclePlanner key={`lifecycle-${configKey}`} />
        case 3:
          return <GridEvidenceScope key={`evidence-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
