// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'verification-closure',
  whyThisMatters:
    "A migration isn't done when the ticket closes — it's done when the system's observed behavior proves it, and closing the program without that evidence just defers the risk instead of retiring it.",
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
  startHere: {
    step: 'decommission-checklist',
    text: 'Explore one fictional asset in the Decommission Checklist: deprecate, mark removed, review the worksheet status and log. Then identify the independent observations needed to establish actual retirement with production tools.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.VerificationClosureModule })),
}

export default resolveManifest(manifest)
