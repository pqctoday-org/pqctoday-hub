// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { Server, BarChart3, Route, Shield, Gauge } from 'lucide-react'
import { HsmPqcIntroduction } from './components/HsmPqcIntroduction'
import { HsmPqcExercises } from './components/HsmPqcExercises'
import { Pkcs11Simulator } from './workshop/Pkcs11Simulator'
import { VendorComparison } from './workshop/VendorComparison'
import { HsmMigrationPlanner } from './workshop/HsmMigrationPlanner'
import { FipsValidationTracker } from './workshop/FipsValidationTracker'
import { HsmCapacityCalculator } from '@/components/Playground/hsm/HsmCapacityCalculator'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'pkcs11-simulator',
    title: 'Step 1: PKCS#11 Simulator',
    description: 'Step through 8 PKCS#11 PQC operations with on-prem vs cloud comparison.',
    icon: Server,
  },
  {
    id: 'vendor-comparison',
    title: 'Step 2: Vendor Comparison',
    description: 'Compare 9 HSM vendors by PQC maturity, algorithms, and FIPS validation.',
    icon: BarChart3,
  },
  {
    id: 'migration-planner',
    title: 'Step 3: Migration Planner',
    description: 'Plan HSM firmware migration from classical to PQC with dual-partition strategy.',
    icon: Route,
  },
  {
    id: 'fips-tracker',
    title: 'Step 4: FIPS Tracker',
    description: 'Track CMVP/CAVP PQC validation status across HSM vendors.',
    icon: Shield,
  },
  {
    id: 'capacity-calculator',
    title: 'Step 5: Capacity Calculator',
    description:
      'Size your HSM fleet for the top 10 enterprise use cases and see the quantum-crypto impact on classical vs next-gen HSMs.',
    icon: Gauge,
  },
]

export const HsmPqcModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="Deep dive into Hardware Security Modules: PKCS#11 v3.2 PQC mechanisms, vendor comparison, firmware migration, and FIPS 140-3 validation."
    learn={(api) => <HsmPqcIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <HsmPqcExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <Pkcs11Simulator key={`pkcs11-sim-${configKey}`} />
        case 1:
          return <VendorComparison key={`vendor-cmp-${configKey}`} />
        case 2:
          return <HsmMigrationPlanner key={`migration-${configKey}`} />
        case 3:
          return <FipsValidationTracker key={`fips-tracker-${configKey}`} />
        case 4:
          return <HsmCapacityCalculator key={`capacity-calc-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
