// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-implementation-security',
  whyThisMatters:
    'Mathematically sound lattice and hash-based algorithms still lose secret keys in production when variable-time division, rejection-sampling branches, explicit FO decapsulation errors, or unmasked Keccak/NTT paths leak timing, power, or EM side channels.',
  learnSections: [
    { id: 'constant-time-pqc', label: 'Constant-Time PQC Pitfalls' },
    { id: 'fo-implicit-rejection', label: 'FO Transform & Implicit Rejection' },
    { id: 'masking-and-faults', label: 'Masking & Fault Defenses' },
    { id: 'tvla-and-certification', label: 'TVLA, FIPS 140-3 & EUCC' },
  ],
  workshopSteps: [
    { id: 'timing-leak-lab', label: 'Timing Leak Inspector' },
    { id: 'fo-rejection-audit', label: 'FO Implicit Rejection Lab' },
    { id: 'masking-budget', label: 'Masking & Fault Cost Explorer' },
    { id: 'tvla-evidence-scope', label: 'TVLA & Certification Evidence Scope' },
  ],
  startHere: {
    step: 'timing-leak-lab',
    text: 'Inspect vulnerable vs. constant-time ML-KEM and ML-DSA code patterns in the Timing Leak Inspector to see how division timing, rejection-sampling branches, and early-exit memcmp expose secret keys.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PqcImplementationSecurityModule })),
}

export default resolveManifest(manifest)
