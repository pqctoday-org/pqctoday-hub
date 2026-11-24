// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'aerospace-pqc',
  whyThisMatters:
    "A satellite or airframe fielded today will still be flying in the 2050s — its crypto has to survive a threat model that doesn't exist yet, under rad-hardening and export-control constraints no other industry faces.",
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
  startHere: {
    step: 'satellite-link-budget',
    text: 'Configure a mission profile in the Satellite Link Budget Calculator — LEO to HEO — and read the PQC bandwidth overhead, handshake latency and SEU-adjusted key refresh interval.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.AerospacePQCModule })),
}

export default manifest
