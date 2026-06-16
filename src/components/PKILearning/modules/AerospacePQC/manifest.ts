// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'aerospace-pqc',
  lm_id: 'LM-040',
  title: 'Aerospace PQC',
  description:
    'PQC challenges unique to aerospace: rad-hardened avionics, satellite link budgets, DO-326A airborne cybersecurity, ITAR/EAR export controls, and multi-decade fleet crypto interoperability.',
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 0,
  learnSections: [
    { id: 'quantum-threat', label: 'The Quantum Threat to Aerospace' },
    { id: 'protocol-limits', label: 'PQC Algorithm Sizes vs Aviation Protocol Limits' },
    { id: 'radiation-integrity', label: 'Radiation & Cryptographic Key Material Integrity' },
    { id: 'certification-cost', label: 'Certification Cost of PQC Crypto Library Integration' },
    { id: 'export-constraints', label: 'PQC Algorithm Selection Under Export Constraints' },
    { id: 'crypto-lifecycle', label: 'Crypto Lifecycle Across Multi-Decade Equipment Life' },
    { id: 'key-provisioning', label: 'Key Provisioning for Unreachable Platforms' },
  ],
  workshopSteps: [
    { id: 'avionics-protocol-analyzer', label: 'Avionics Protocol Analyzer' },
    { id: 'satellite-link-budget', label: 'Satellite Link Budget' },
    { id: 'certification-impact-analyzer', label: 'Certification Impact' },
    { id: 'fleet-interoperability-matrix', label: 'Fleet Interoperability' },
    { id: 'export-control-classifier', label: 'Export Control Classifier' },
    { id: 'mission-crypto-lifecycle', label: 'Mission Lifecycle Planner' },
  ],
  load: () => import('./index').then((m) => ({ default: m.AerospacePQCModule })),
}

export default manifest
