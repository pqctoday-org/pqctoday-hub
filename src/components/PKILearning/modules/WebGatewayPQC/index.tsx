// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Network, Split, Calculator, RefreshCw, ClipboardCheck } from 'lucide-react'
import { WebGatewayIntroduction } from './components/WebGatewayIntroduction'
import { WebGatewayExercises } from './components/WebGatewayExercises'
import { TopologyBuilder } from './workshop/TopologyBuilder'
import { TLSTerminationPatterns } from './workshop/TLSTerminationPatterns'
import { HandshakeBudgetCalculator } from './workshop/HandshakeBudgetCalculator'
import { CertRotationPlanner } from './workshop/CertRotationPlanner'
import { VendorReadinessMatrix } from './workshop/VendorReadinessMatrix'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'topology-builder',
    title: 'Step 1: Topology Builder',
    description: 'Build a web gateway architecture and identify PQC upgrade points.',
    icon: Network,
  },
  {
    id: 'tls-termination',
    title: 'Step 2: TLS Termination',
    description: 'Compare terminate, passthrough, re-encrypt, and split TLS under PQC.',
    icon: Split,
  },
  {
    id: 'handshake-budget',
    title: 'Step 3: Handshake Budget',
    description: 'Calculate PQC handshake sizes and gateway bandwidth requirements.',
    icon: Calculator,
  },
  {
    id: 'cert-rotation',
    title: 'Step 4: Cert Rotation',
    description: 'Plan certificate migration across edge nodes with phased rollout.',
    icon: RefreshCw,
  },
  {
    id: 'vendor-readiness',
    title: 'Step 5: Vendor Readiness',
    description: 'Assess your gateway products against PQC readiness criteria.',
    icon: ClipboardCheck,
  },
]

export const WebGatewayPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PQC deployment at the infrastructure edge — TLS termination patterns, certificate lifecycle at scale, and vendor migration paths."
    learn={(api) => <WebGatewayIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => <WebGatewayExercises onNavigateToWorkshop={api.goToWorkshop} />}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <TopologyBuilder key={`topology-${configKey}`} />
        case 1:
          return <TLSTerminationPatterns key={`termination-${configKey}`} />
        case 2:
          return <HandshakeBudgetCalculator key={`budget-${configKey}`} />
        case 3:
          return <CertRotationPlanner key={`cert-rotation-${configKey}`} />
        case 4:
          return <VendorReadinessMatrix key={`vendor-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
