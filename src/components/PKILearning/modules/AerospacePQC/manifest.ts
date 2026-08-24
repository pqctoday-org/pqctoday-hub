// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'aerospace-pqc',
  contentVersion: 3,
  lm_id: 'LM-040',
  title: 'Aerospace PQC',
  description:
    'PQC challenges unique to aerospace: rad-hardened avionics, satellite link budgets, DO-326A airborne cybersecurity, ITAR/EAR export controls, and multi-decade fleet crypto interoperability.',
  whyThisMatters:
    "A satellite or airframe fielded today will still be flying in the 2050s — its crypto has to survive a threat model that doesn't exist yet, under rad-hardening and export-control constraints no other industry faces.",
  duration: '80 min',
  difficulty: 'advanced',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 0,
  learnSections: [
    { id: 'quantum-threat', label: 'Aerospace Quantum Threat' },
    { id: 'protocol-limits', label: 'PQC vs Aviation Protocols' },
    { id: 'radiation-integrity', label: 'Radiation Key Integrity' },
    { id: 'certification-cost', label: 'PQC Certification Cost' },
    { id: 'export-constraints', label: 'Export Constraints' },
    { id: 'crypto-lifecycle', label: 'Crypto Lifecycle' },
    { id: 'key-provisioning', label: 'Key Provisioning' },
  ],
  workshopSteps: [
    { id: 'avionics-protocol-analyzer', label: 'Avionics Protocol Analyzer' },
    { id: 'satellite-link-budget', label: 'Satellite Link Budget' },
    { id: 'certification-impact-analyzer', label: 'Certification Impact' },
    { id: 'fleet-interoperability-matrix', label: 'Fleet Interoperability' },
    { id: 'export-control-classifier', label: 'Export Control Classifier' },
    { id: 'mission-crypto-lifecycle', label: 'Mission Lifecycle Planner' },
  ],
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AerospacePQCModule })),
}

export default manifest
