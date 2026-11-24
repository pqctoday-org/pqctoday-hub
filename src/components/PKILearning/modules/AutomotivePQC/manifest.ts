// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'automotive-pqc',
  whyThisMatters:
    'A car sold today is expected to stay on the road, and stay securely updatable, for 15-20 years — its V2X and OTA crypto has to already assume a post-quantum adversary.',
  learnSections: [
    { id: 'vehicle-crypto-landscape', label: 'Automotive Crypto' },
    { id: 'autonomous-data', label: 'Autonomous Data Integrity' },
    { id: 'safety-critical', label: 'ISO 26262 ASIL Safety' },
    { id: 'hsm-lifecycle', label: 'HSM Lifecycle' },
    { id: 'lifecycle-agility', label: 'Vehicle Lifecycle Agility' },
    { id: 'privacy-connected', label: 'Connected Car Privacy' },
    { id: 'vehicle-payments', label: 'In-Vehicle Payments' },
    { id: 'digital-car-key', label: 'Digital Car Key' },
    { id: 'supply-chain', label: 'TISAX, VDA & AUTOSAR' },
    { id: 'system-life-cycles', label: 'System Life Cycles' },
  ],
  workshopSteps: [
    { id: 'vehicle-architecture-mapper', label: 'Vehicle Architecture Mapper' },
    { id: 'sensor-data-integrity', label: 'Sensor Data Integrity' },
    { id: 'safety-crypto-analyzer', label: 'Safety-Crypto Analyzer' },
    { id: 'ota-orchestration-planner', label: 'OTA Orchestration Planner' },
    { id: 'car-key-protocol-explorer', label: 'Car Key Protocol Explorer' },
    { id: 'lifecycle-migration-roadmap', label: 'Lifecycle Migration Roadmap' },
  ],
  startHere: {
    step: 'ota-orchestration-planner',
    text: 'Plan a multi-ECU firmware campaign in the OTA Orchestration Planner: dependency ordering, fleet size and the bandwidth cost of PQC signatures on every update.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AutomotivePQCModule })),
}

export default resolveManifest(manifest)
