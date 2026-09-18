// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'dev-quantum-impact',
  contentVersion: 3,
  lm_id: 'LM-048',
  title: 'Developer Quantum Impact',
  description:
    'How quantum breaks your code: library transitions, larger keys/signatures, TLS/JWT/signing impacts, and a hands-on migration readiness plan.',
  whyThisMatters:
    "Your code doesn't call 'RSA' — it calls a library, and libraries are what quietly change under you when the underlying algorithm gets swapped. Knowing what breaks (key sizes, signature sizes, TLS handshakes) is the difference between a migration and an outage.",
  duration: '20 min',
  difficulty: 'beginner',
  frameworkPhase: 'foundations',
  track: 'Role Guides',
  trackOrder: 1,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Skill Self-Assessment' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM', 'SLH-DSA'],
    standards: ['RFC 9580', 'RFC 9846', 'NIST SP 800-227'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.DevQuantumImpactModule })),
}

export default manifest
