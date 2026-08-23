// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'automotive-pqc',
  contentVersion: 2,
  lm_id: 'LM-043',
  title: 'Automotive PQC',
  description:
    'Post-quantum cryptography for connected and autonomous vehicles: V2X PKI, sensor data integrity, ISO 26262 safety-crypto intersection, HSM lifecycle management, OTA orchestration, digital car keys, in-vehicle payments, and 15-20 year lifecycle crypto-agility.',
  whyThisMatters:
    'A car sold today is expected to stay on the road, and stay securely updatable, for 15-20 years — its V2X and OTA crypto has to already assume a post-quantum adversary.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 3,
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
  ],
  workshopSteps: [
    { id: 'vehicle-architecture-mapper', label: 'Vehicle Architecture Mapper' },
    { id: 'sensor-data-integrity', label: 'Sensor Data Integrity' },
    { id: 'safety-crypto-analyzer', label: 'Safety-Crypto Analyzer' },
    { id: 'ota-orchestration-planner', label: 'OTA Orchestration Planner' },
    { id: 'car-key-protocol-explorer', label: 'Car Key Protocol Explorer' },
    { id: 'lifecycle-migration-roadmap', label: 'Lifecycle Migration Roadmap' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AutomotivePQCModule })),
}

export default manifest
