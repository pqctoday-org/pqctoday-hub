// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Cpu, FileCode, Network, Link2, Factory, Zap } from 'lucide-react'
import { IoTOTIntroduction } from './components/IoTOTIntroduction'
import { IoTOTExercises } from './components/IoTOTExercises'
import { ConstrainedAlgorithmExplorer } from './workshop/ConstrainedAlgorithmExplorer'
import { FirmwareSigningSimulator } from './workshop/FirmwareSigningSimulator'
import { DTLSHandshakeVisualizer } from './workshop/DTLSHandshakeVisualizer'
import { CertChainBloatAnalyzer } from './workshop/CertChainBloatAnalyzer'
import { SCADAMigrationPlanner } from './workshop/SCADAMigrationPlanner'
import { HardwareConstraintsSimulator } from './workshop/HardwareConstraintsSimulator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'constrained-algorithm',
    title: 'Step 1: Algorithm Explorer',
    description: 'Compare PQC algorithm resource requirements against device class constraints.',
    icon: Cpu,
  },
  {
    id: 'firmware-signing',
    title: 'Step 2: Firmware Signing',
    description: 'Sign and verify a firmware image using LMS, XMSS, or ML-DSA.',
    icon: FileCode,
  },
  {
    id: 'dtls-handshake',
    title: 'Step 3: DTLS Handshake',
    description: 'Simulate a CoAP/DTLS 1.3 handshake with PQC and measure overhead.',
    icon: Network,
  },
  {
    id: 'cert-chain-bloat',
    title: 'Step 4: Chain Bloat',
    description: 'Analyze PQC certificate chain sizes and their impact on constrained TLS.',
    icon: Link2,
  },
  {
    id: 'scada-assessment',
    title: 'Step 5: SCADA Planner',
    description:
      'Assess a SCADA/ICS environment and plan PQC migration across Purdue model layers.',
    icon: Factory,
  },
  {
    id: 'hardware-constraints',
    title: 'Step 6: Hardware Constraints',
    description: 'Simulate Secure Boot RAM load latency and Automotive V2X Broadcast Storms.',
    icon: Zap,
  },
]

export const IoTOTModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="PQC for constrained devices — algorithm selection, firmware signing, protocol impacts, and SCADA migration."
    learn={(api) => <IoTOTIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <IoTOTExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <ConstrainedAlgorithmExplorer key={`constrained-${configKey}`} />
        case 1:
          return <FirmwareSigningSimulator key={`firmware-${configKey}`} />
        case 2:
          return <DTLSHandshakeVisualizer key={`dtls-${configKey}`} />
        case 3:
          return <CertChainBloatAnalyzer key={`cert-chain-${configKey}`} />
        case 4:
          return <SCADAMigrationPlanner key={`scada-${configKey}`} />
        case 5:
          return <HardwareConstraintsSimulator key={`hardware-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
