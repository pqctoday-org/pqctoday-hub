// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Radio, Satellite, ShieldCheck, Plane, Scale, Rocket } from 'lucide-react'
import { AerospaceIntroduction } from './components/AerospaceIntroduction'
import { AerospaceExercises } from './components/AerospaceExercises'
import { AvionicsProtocolAnalyzer } from './workshop/AvionicsProtocolAnalyzer'
import { SatelliteLinkBudgetCalculator } from './workshop/SatelliteLinkBudgetCalculator'
import { CertificationImpactAnalyzer } from './workshop/CertificationImpactAnalyzer'
import { FleetInteroperabilityMatrix } from './workshop/FleetInteroperabilityMatrix'
import { ExportControlClassifier } from './workshop/ExportControlClassifier'
import { MissionCryptoLifecyclePlanner } from './workshop/MissionCryptoLifecyclePlanner'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'avionics-protocol-analyzer',
    title: 'Step 1: Avionics Protocol Analyzer',
    description:
      'Evaluate PQC signature and key exchange overhead against avionics communication protocol message limits — ACARS, CPDLC, ADS-B, ARINC 429/664, MIL-STD-1553, and Link 16.',
    icon: Radio,
  },
  {
    id: 'satellite-link-budget',
    title: 'Step 2: Satellite Link Budget Calculator',
    description:
      'Configure satellite mission profiles across LEO, MEO, GEO, and HEO orbits. Calculate PQC bandwidth overhead, handshake latency, and SEU-adjusted key refresh intervals.',
    icon: Satellite,
  },
  {
    id: 'certification-impact-analyzer',
    title: 'Step 3: Certification Impact Analyzer',
    description:
      'Estimate DO-178C recertification cost, timeline, and MC/DC test case explosion for adding PQC to avionics systems at each Design Assurance Level.',
    icon: ShieldCheck,
  },
  {
    id: 'fleet-interoperability-matrix',
    title: 'Step 4: Fleet Interoperability Matrix',
    description:
      'Build a mixed-generation fleet and visualize PQC data link interoperability — native, gateway-mediated, or legacy unprotected.',
    icon: Plane,
  },
  {
    id: 'export-control-classifier',
    title: 'Step 5: Export Control Classifier',
    description:
      'Classify PQC-equipped aerospace products under ITAR, EAR, and Wassenaar regimes for different export destinations.',
    icon: Scale,
  },
  {
    id: 'mission-crypto-lifecycle',
    title: 'Step 6: Mission Crypto Lifecycle Planner',
    description:
      'Build a multi-decade crypto lifecycle plan from design through decommission for aircraft, satellites, and UAVs.',
    icon: Rocket,
  },
]

export const AerospacePQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Rad-hardened avionics, satellite link budgets, DO-326A certification, ITAR/EAR export controls, and multi-decade fleet interoperability across ground, airborne, and space segments."
    learn={(api) => <AerospaceIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <AerospaceExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step, { ...config })}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <AvionicsProtocolAnalyzer key={`protocol-${configKey}`} />
        case 1:
          return <SatelliteLinkBudgetCalculator key={`satellite-${configKey}`} />
        case 2:
          return <CertificationImpactAnalyzer key={`certification-${configKey}`} />
        case 3:
          return <FleetInteroperabilityMatrix key={`fleet-${configKey}`} />
        case 4:
          return <ExportControlClassifier key={`export-${configKey}`} />
        case 5:
          return <MissionCryptoLifecyclePlanner key={`lifecycle-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
