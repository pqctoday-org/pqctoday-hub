// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'exec-quantum-impact',
  contentVersion: 13,
  lm_id: 'LM-047',
  title: 'Executive Quantum Impact',
  description:
    'Why quantum matters to leadership: board oversight, regulatory milestones (CNSA 2.0, EO 14412, EU PQC roadmap), and building a board-level PQC action plan.',
  whyThisMatters:
    'Quantum risk is a governance question before it becomes an implementation programme: executives need to identify long-lived exposure, determine which scoped milestones apply, assign ownership and ask for measurable evidence.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p0',
  track: 'Role Guides',
  trackOrder: 0,
  learnSections: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'Knowledge & Skills' },
    { id: 'how-to-act', label: 'How to Act' },
  ],
  workshopSteps: [
    { id: 'why-it-matters', label: 'Why It Matters' },
    { id: 'what-to-learn', label: 'What to Learn' },
    { id: 'how-to-act', label: 'How to Act' },
    { id: 'self-assessment', label: 'Organisational Evidence Scope' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'self-assessment',
    text: 'Answer Yes, No, or Unknown in the Organisational Evidence Scope: nine questions identify applicable decision drivers and evidence requests without turning unanswered items into a low-risk score.',
  },
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    standards: ['EO 14306', 'NSM-10', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.ExecQuantumImpactModule })),
}

export default manifest
