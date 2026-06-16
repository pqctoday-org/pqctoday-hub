// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'automotive-pqc',
  lm_id: 'LM-043',
  title: 'Automotive PQC',
  description:
    'Post-quantum cryptography for connected and autonomous vehicles: V2X PKI, sensor data integrity, ISO 26262 safety-crypto intersection, HSM lifecycle management, OTA orchestration, digital car keys, in-vehicle payments, and 15-20 year lifecycle crypto-agility.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 3,
  learnSections: [
    { id: 'vehicle-crypto-landscape', label: 'The Automotive Crypto Landscape' },
    { id: 'autonomous-data', label: 'Autonomous Driving Data Integrity' },
    { id: 'safety-critical', label: 'Safety-Critical Systems & ISO 26262 ASIL' },
    { id: 'hsm-lifecycle', label: 'HSM Lifecycle: Factory to End-of-Life' },
    { id: 'lifecycle-agility', label: 'Long Vehicle Lifecycle & Crypto-Agility' },
    { id: 'privacy-connected', label: 'Connected Car Privacy & GDPR' },
    { id: 'vehicle-payments', label: 'In-Vehicle Payments & EV Charging' },
    { id: 'digital-car-key', label: 'Digital Car Key (CCC / NFC / BLE / UWB)' },
    { id: 'supply-chain', label: 'Supply Chain: TISAX, VDA & AUTOSAR' },
  ],
  workshopSteps: [
    { id: 'vehicle-architecture-mapper', label: 'Vehicle Architecture Mapper' },
    { id: 'sensor-data-integrity', label: 'Sensor Data Integrity' },
    { id: 'safety-crypto-analyzer', label: 'Safety-Crypto Analyzer' },
    { id: 'ota-orchestration-planner', label: 'OTA Orchestration Planner' },
    { id: 'car-key-protocol-explorer', label: 'Car Key Protocol Explorer' },
    { id: 'lifecycle-migration-roadmap', label: 'Lifecycle Migration Roadmap' },
  ],
  load: () => import('./index').then((m) => ({ default: m.AutomotivePQCModule })),
}

export default manifest
