// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'verification-closure',
  contentVersion: 3,
  lm_id: 'LM-061',
  title: 'Decommissioning & Program Closure',
  description:
    'Retire classical cryptography on a defensible schedule, prove the migration actually happened from observed behaviour, and hand the program to business-as-usual.',
  whyThisMatters:
    "A migration isn't done when the ticket closes — it's done when the system's observed behavior proves it, and closing the program without that evidence just defers the risk instead of retiring it.",
  duration: '40 min',
  difficulty: 'intermediate',
  frameworkPhase: 'verify-close',
  track: 'Executive',
  // 9, not 10, since WS8 moved soc-implementation-pqc out of this track:
  // conformance.test.ts asserts trackOrder === the module's index in the
  // trackOrder-sorted MODULE_TRACKS array, so the Executive track must stay
  // contiguous from 0.
  trackOrder: 9,
  learnSections: [
    { id: 'decommission', label: 'Retire Classical Crypto' },
    { id: 'verify-evidence', label: 'Prove the Migration' },
    { id: 'verify-coverage', label: 'Coverage at estate scale' },
    { id: 'closure-handover', label: 'Closure Handover' },
  ],
  workshopSteps: [
    { id: 'decommission-checklist', label: 'Decommission Checklist' },
    { id: 'coverage-planner', label: 'Verification Coverage Planner' },
    { id: 'closure-handover-register', label: 'Closure & Handover Register' },
  ],
  embeddable: true,
  practiceInSim: true,
  taxonomy: {
    standards: ['NIST IR 8547', 'NIST SP 800-131A', 'ISO/IEC 27001'],
  },
  load: () => import('./index').then((m) => ({ default: m.VerificationClosureModule })),
}

export default manifest
