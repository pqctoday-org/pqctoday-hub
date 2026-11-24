// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'trust-services-pqc',
  whyThisMatters:
    'A qualified signature made today may need to be evaluated in 2050 — outliving the certificate, the revocation data, and very probably the algorithm underneath it. That is a migration problem no amount of new-signature planning solves, because the work is proportional to the archive you already have.',
  learnSections: [
    { id: 'qualified-signatures', label: 'Qualified vs Advanced Signatures' },
    { id: 'timestamping', label: 'Timestamping & Proof of Existence' },
    { id: 'long-term-validation', label: 'Long-Term Validation & Archival' },
    { id: 'suites-evolving', label: 'Cryptographic Suites, Evolving' },
    { id: 'trust-providers', label: 'Trust Service Providers & Conformity' },
  ],
  workshopSteps: [
    { id: 'longevity-calculator', label: 'Signature Longevity Calculator' },
    { id: 'supersession-explorer', label: 'Standards Supersession Explorer' },
    { id: 'hybrid-suite-picker', label: 'Hybrid Suite Picker' },
  ],
  startHere: {
    step: 'longevity-calculator',
    text: 'Set how long a signature must stay evaluable in the Signature Longevity Calculator: it shows which degradation stages fall inside that window and when the archive must be re-timestamped.',
  },
  // reduced 5-tab set (no Exercises) — no exercises component is wired for
  // this module; the default STANDARD_TABS set was rendering an empty tab.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'references', label: 'References' },
    { value: 'tools', label: 'Tools & Products' },
  ],
  embeddable: false,
  load: () => import('./index').then((m) => ({ default: m.TrustServicesPQCModule })),
}

export default resolveManifest(manifest)
