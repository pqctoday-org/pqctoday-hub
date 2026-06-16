// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Shield, Lock, Bell, BarChart3, Network } from 'lucide-react'
import { NetworkSecurityIntroduction } from './components/NetworkSecurityIntroduction'
import { NetworkSecurityExercises } from './components/NetworkSecurityExercises'
import { NGFWCipherAnalyzer } from './workshop/NGFWCipherAnalyzer'
import { TLSInspectionLab } from './workshop/TLSInspectionLab'
import { IDSSignatureUpdater } from './workshop/IDSSignatureUpdater'
import { VendorMigrationMatrix } from './workshop/VendorMigrationMatrix'
import { ZTNAPQCDesigner } from './workshop/ZTNAPQCDesigner'
import { NetworkTelemetryAnalyzer } from './workshop/NetworkTelemetryAnalyzer'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'ngfw-cipher-analyzer',
    title: 'Step 1: NGFW Cipher Policy',
    description:
      'Analyze NGFW cipher suites and simulate the impact of enabling PQC — cert size, handshake latency, and hardware offload.',
    icon: Shield,
  },
  {
    id: 'tls-inspection-lab',
    title: 'Step 2: TLS Inspection Lab',
    description:
      'Simulate TLS intercept proxy behavior with PQC cert chains. Compare pass-through vs full inspection modes.',
    icon: Lock,
  },
  {
    id: 'ids-signature-updater',
    title: 'Step 3: IDS Signature Updater',
    description:
      'Configure IDS/IPS rule categories for PQC traffic detection. Balance detection coverage vs false positive rate.',
    icon: Bell,
  },
  {
    id: 'vendor-migration-matrix',
    title: 'Step 4: Vendor Matrix',
    description:
      'Compare Cisco, Palo Alto, Fortinet, Juniper, Check Point, and more on PQC migration readiness.',
    icon: BarChart3,
  },
  {
    id: 'ztna-pqc-designer',
    title: 'Step 5: ZTNA PQC Design',
    description:
      'Design a quantum-safe Zero Trust Network Access architecture across 5 ZTNA components.',
    icon: Network,
  },
  {
    id: 'network-telemetry-analyzer',
    title: 'Step 6: Network Telemetry',
    description:
      'Analyze PQC payload sizes against TCP initcwnd constraints and simulate fragmentation latency.',
    icon: BarChart3,
  },
]

export const NetworkSecurityPQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Prepare NGFWs, IDS/IPS, and network security appliances for post-quantum cryptography. Covers TLS inspection impacts, DPI with larger PQC certs, vendor migration roadmaps, and PQC-aware zero trust network architecture."
    learn={(api) => <NetworkSecurityIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <NetworkSecurityExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <NGFWCipherAnalyzer key={`ngfw-${configKey}`} />
        case 1:
          return <TLSInspectionLab key={`tls-${configKey}`} />
        case 2:
          return <IDSSignatureUpdater key={`ids-${configKey}`} />
        case 3:
          return <VendorMigrationMatrix key={`vendor-${configKey}`} />
        case 4:
          return <ZTNAPQCDesigner key={`ztna-${configKey}`} />
        case 5:
          return <NetworkTelemetryAnalyzer key={`telemetry-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
