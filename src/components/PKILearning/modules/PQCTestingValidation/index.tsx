// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import {
  Radio,
  ScanSearch,
  BarChart2,
  GitBranch,
  Cpu,
  ClipboardList,
  FileCheck,
} from 'lucide-react'
import { PQCTestingIntroduction } from './components/PQCTestingIntroduction'
import { PQCTestingExercises } from './components/PQCTestingExercises'
import { PassiveDiscoveryLab } from './workshop/PassiveDiscoveryLab'
import { ActivePQCScanner } from './workshop/ActivePQCScanner'
import { PerformanceBenchmarkDesigner } from './workshop/PerformanceBenchmarkDesigner'
import { InteropTestMatrix } from './workshop/InteropTestMatrix'
import { TVLALeakageAnalyzer } from './workshop/TVLALeakageAnalyzer'
import { TestStrategyBuilder } from './workshop/TestStrategyBuilder'
import { ACVPValidator } from './workshop/ACVPValidator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'passive-discovery-lab',
    title: 'Step 1: Passive Discovery',
    description:
      'Simulate a network tap/SPAN appliance. Classify TLS, SSH, and IKEv2 handshakes by quantum safety status across four network segments.',
    icon: Radio,
  },
  {
    id: 'active-pqc-scanner',
    title: 'Step 2: Active Scanner',
    description:
      'Run an active PQC readiness scan against simulated endpoints. Detect PQC support, hybrid key exchange, and quantum-vulnerable configurations.',
    icon: ScanSearch,
  },
  {
    id: 'performance-benchmark-designer',
    title: 'Step 3: Benchmark Designer',
    description:
      'Design a PQC performance test plan. Compare classical, hybrid, and pure-PQC latency and throughput across LAN, WAN, and satellite profiles.',
    icon: BarChart2,
  },
  {
    id: 'interop-test-matrix',
    title: 'Step 4: Interop Matrix',
    description:
      'Build a PQC interoperability test matrix. Validate which client/server algorithm combinations are compatible, partial, or blocked by RFC 9794.',
    icon: GitBranch,
  },
  {
    id: 'tvla-leakage-analyzer',
    title: 'Step 5: TVLA Analyzer',
    description:
      'Visualize Test Vector Leakage Assessment for ML-KEM and ML-DSA. Identify side-channel leakage points in NTT, polynomial multiplication, and compression stages.',
    icon: Cpu,
  },
  {
    id: 'test-strategy-builder',
    title: 'Step 6: Strategy Builder',
    description:
      'Compose a complete PQC validation program based on your migration phase, environment type, and compliance deadline.',
    icon: ClipboardList,
  },
  {
    id: 'acvp-validator',
    title: 'Step 7: NIST ACVP Validation',
    description:
      'Run NIST Known Answer Tests (KATs) against the SoftHSMv3 WASM engine to simulate FIPS 140-3 algorithmic validation.',
    icon: FileCheck,
  },
]

export const PQCTestingValidationModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Design and execute testing strategies for post-quantum cryptography deployments. Covers passive crypto discovery, active scanning, performance benchmarking, interoperability testing, TVLA side-channel assessment, and building a comprehensive PQC test program."
    learn={(api) => <PQCTestingIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <PQCTestingExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <PassiveDiscoveryLab key={`passive-${configKey}`} />
        case 1:
          return <ActivePQCScanner key={`active-${configKey}`} />
        case 2:
          return <PerformanceBenchmarkDesigner key={`bench-${configKey}`} />
        case 3:
          return <InteropTestMatrix key={`interop-${configKey}`} />
        case 4:
          return <TVLALeakageAnalyzer key={`tvla-${configKey}`} />
        case 5:
          return <TestStrategyBuilder key={`strategy-${configKey}`} />
        case 6:
          return <ACVPValidator key={`acvp-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
