// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'data-asset-sensitivity',
  whyThisMatters:
    "Not every dataset needs to move to PQC on the same timeline — data with a 20-year confidentiality requirement is already vulnerable to harvest-now-decrypt-later, data that expires next year isn't. Classifying by sensitivity turns 'migrate everything' into an actual prioritized plan.",
  learnSections: [
    { id: 'classification', label: 'Data Asset Classification' },
    { id: 'compliance', label: 'Compliance Mapping' },
    { id: 'methodology', label: 'Risk Methodology' },
    { id: 'stored-data-key-recovery', label: 'Stored Data & Key Recovery' },
    { id: 'cia-quantum-threat', label: 'CIA & the Quantum Threat' },
    { id: 'cyber-resiliency-goals', label: 'Cyber Resiliency Goals' },
  ],
  workshopSteps: [
    { id: 'asset-inventory', label: 'Asset Inventory' },
    { id: 'classification-challenge', label: 'Classification Challenge' },
    { id: 'conflict-resolver', label: 'Conflict Resolver' },
    { id: 'sensitivity-scoring', label: 'Sensitivity Scoring' },
    { id: 'priority-map', label: 'Priority Map' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'asset-inventory',
    text: "Fill in the Add Data Asset form — name, type, sensitivity tier, retention and confidentiality — and drag the CRQC arrival slider: each asset's HNDL Risk Year in the inventory table updates live.",
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DataAssetSensitivityModule })),
}

export default manifest
