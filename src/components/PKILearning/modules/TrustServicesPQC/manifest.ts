// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'trust-services-pqc',
  contentVersion: 2,
  lm_id: 'LM-063',
  title: 'Trust Services & Long-Term Signatures',
  description:
    'Signatures that must still verify in thirty years: qualified vs advanced signatures, timestamping and proof of existence, long-term validation and re-timestamping, trust service provider conformity, and the ETSI suites that just gained post-quantum modes.',
  whyThisMatters:
    'A qualified signature made today may need to be evaluated in 2050 — outliving the certificate, the revocation data, and very probably the algorithm underneath it. That is a migration problem no amount of new-signature planning solves, because the work is proportional to the archive you already have.',
  duration: '60 min',
  difficulty: 'intermediate',
  frameworkPhase: 'p5',
  track: 'Industries',
  trackOrder: 8,
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

export default manifest
