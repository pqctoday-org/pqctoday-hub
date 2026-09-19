// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'hsm-pqc',
  contentVersion: 4,
  lm_id: 'LM-015',
  title: 'HSM & PQC Operations',
  description:
    'Hardware Security Module operations for PQC: PKCS#11 v3.2, vendor comparison, firmware migration, and FIPS 140-3 validation.',
  duration: '60 min',
  whyThisMatters:
    'Your keys are only as safe as the hardware holding them — HSMs are where PQC migration meets the physical root of trust.',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 2,
  learnSections: [
    { id: 'pkcs11', label: 'PKCS#11 PQC Mechanisms' },
    { id: 'vendors', label: 'HSM Vendor Landscape' },
    { id: 'migration', label: 'Firmware Dual-Partition' },
  ],
  workshopSteps: [
    { id: 'pkcs11-simulator', label: 'PKCS#11 Simulator' },
    { id: 'vendor-comparison', label: 'Vendor Comparison' },
    { id: 'migration-planner', label: 'Migration Planner' },
    { id: 'fips-tracker', label: 'FIPS Tracker' },
    { id: 'capacity-calculator', label: 'Capacity Calculator' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'pkcs11-simulator',
    text: 'Step through the 8 PKCS#11 operations in order: each shows the API call and detail, and Execute Operation reveals the expected output — or live output from the in-browser HSM in Live WASM mode.',
  },
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['PKCS#11'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HsmPqcModule })),
}

export default manifest
