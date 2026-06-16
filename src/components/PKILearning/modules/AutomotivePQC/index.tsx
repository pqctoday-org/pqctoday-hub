// SPDX-License-Identifier: GPL-3.0-only
import type { FC } from 'react'
import { LayoutGrid, Activity, ShieldCheck, Truck, Key, Calendar } from 'lucide-react'
import { AutomotivePQCIntroduction } from './components/AutomotivePQCIntroduction'
import { AutomotivePQCExercises } from './components/AutomotivePQCExercises'
import { VehicleArchitectureMapper } from './workshop/VehicleArchitectureMapper'
import { SensorDataIntegritySimulator } from './workshop/SensorDataIntegritySimulator'
import { SafetyCryptoAnalyzer } from './workshop/SafetyCryptoAnalyzer'
import { OTAOrchestrationPlanner } from './workshop/OTAOrchestrationPlanner'
import { CarKeyProtocolExplorer } from './workshop/CarKeyProtocolExplorer'
import { LifecycleMigrationRoadmap } from './workshop/LifecycleMigrationRoadmap'
import { ModuleShell, type WorkshopPart } from '@/components/PKILearning/common/ModuleShell'
import manifest from './manifest'

const PARTS: WorkshopPart[] = [
  {
    id: 'vehicle-architecture-mapper',
    title: 'Step 1: Vehicle Architecture Mapper',
    description:
      'Explore domain-based and zonal E/E architectures, ECU zones, bus protocols, and per-zone PQC crypto requirements.',
    icon: LayoutGrid,
  },
  {
    id: 'sensor-data-integrity',
    title: 'Step 2: Sensor Data Integrity Simulator',
    description:
      'Compare signing throughput for LiDAR, radar, camera, and V2X sensors under real automotive data rates and latency budgets.',
    icon: Activity,
  },
  {
    id: 'safety-crypto-analyzer',
    title: 'Step 3: Safety-Crypto Analyzer',
    description:
      'Map ISO 26262 ASIL levels to crypto verification timing and evaluate PQC algorithm feasibility per safety function.',
    icon: ShieldCheck,
  },
  {
    id: 'ota-orchestration-planner',
    title: 'Step 4: OTA Orchestration Planner',
    description:
      'Plan multi-ECU firmware campaigns with dependency ordering, fleet sizing, and PQC signature bandwidth impact.',
    icon: Truck,
  },
  {
    id: 'car-key-protocol-explorer',
    title: 'Step 5: Car Key Protocol Explorer',
    description:
      'Step through CCC Digital Key 3.0 flows over NFC, BLE, and UWB with classical vs PQC size comparison.',
    icon: Key,
  },
  {
    id: 'lifecycle-migration-roadmap',
    title: 'Step 6: Lifecycle Migration Roadmap',
    description:
      'Generate a vehicle-lifecycle PQC migration timeline with regulatory milestones, HSM tiers, and CRQC exposure windows.',
    icon: Calendar,
  },
]

export const AutomotivePQCModule: FC = () => (
  <ModuleShell
    manifest={manifest}
    description="V2X PKI migration, sensor data integrity, ISO 26262 safety-crypto intersection, HSM lifecycle management, OTA orchestration, digital car keys, and 15-20 year vehicle crypto-agility."
    learn={(api) => <AutomotivePQCIntroduction onNavigateToWorkshop={api.goToWorkshop} />}
    exercises={(api) => (
      <AutomotivePQCExercises
        onNavigateToWorkshop={api.goToWorkshop}
        onSetWorkshopConfig={(config) => api.openWorkshopStep(config.step)}
      />
    )}
    workshopParts={PARTS}
    renderWorkshopStep={(index, configKey) => {
      switch (index) {
        case 0:
          return <VehicleArchitectureMapper key={`vam-${configKey}`} />
        case 1:
          return <SensorDataIntegritySimulator key={`sdi-${configKey}`} />
        case 2:
          return <SafetyCryptoAnalyzer key={`sca-${configKey}`} />
        case 3:
          return <OTAOrchestrationPlanner key={`ota-${configKey}`} />
        case 4:
          return <CarKeyProtocolExplorer key={`ckp-${configKey}`} />
        case 5:
          return <LifecycleMigrationRoadmap key={`lmr-${configKey}`} />
        default:
          return null
      }
    }}
  />
)
