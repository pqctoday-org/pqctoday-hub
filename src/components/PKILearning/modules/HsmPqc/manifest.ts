// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'hsm-pqc',
  lm_id: 'LM-015',
  title: 'HSM & PQC Operations',
  description:
    'Hardware Security Module operations for PQC: PKCS#11 v3.2, vendor comparison, firmware migration, and FIPS 140-3 validation.',
  duration: '60 min',
  difficulty: 'advanced',
  frameworkPhase: 'p6',
  track: 'Hardware Infrastructure',
  trackOrder: 2,
  learnSections: [
    { id: 'pkcs11', label: 'PKCS#11 v3.2 PQC Mechanisms' },
    { id: 'vendors', label: 'HSM Vendor Landscape' },
    { id: 'migration', label: 'Firmware Migration & Dual-Partition Strategy' },
  ],
  workshopSteps: [
    { id: 'pkcs11-simulator', label: 'PKCS#11 Simulator' },
    { id: 'vendor-comparison', label: 'Vendor Comparison' },
    { id: 'migration-planner', label: 'Migration Planner' },
    { id: 'fips-tracker', label: 'FIPS Tracker' },
    { id: 'capacity-calculator', label: 'Capacity Calculator' },
  ],
  taxonomy: { algorithms: ['ML-KEM', 'ML-DSA'], standards: ['PKCS#11'] },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.HsmPqcModule })),
}

export default manifest
