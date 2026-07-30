// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'hsm-pqc',
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
  // learnSections CORRECTED 2026-07-30. They did not describe this module's
  // own learn tab: the manifest is what drives the table of contents, section
  // progress and deep links, so a manifest that disagrees with the page is
  // wrong in every one of those. Nothing referenced the old ids outside this
  // file, and the module never emitted section anchors, so no recorded
  // progress was keyed to them — the correction loses nothing.
  learnSections: [
    { id: 'hsm-architecture', label: 'HSM Architecture for PQC' },
    { id: 'pkcs11', label: 'PKCS#11 v3.2 PQC Mechanisms' },
    { id: 'on-prem', label: 'On-Prem HSM PQC Deep Dive' },
    { id: 'cloud-hsm', label: 'Cloud HSM PQC Deep Dive' },
    { id: 'side-channel', label: 'Side-Channel Attack Surfaces' },
    { id: 'firmware-migration', label: 'HSM Firmware Migration' },
    { id: 'stateful-state', label: 'Stateful Signature State in HSMs' },
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
