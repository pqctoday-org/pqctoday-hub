// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'pqc-risk-management',
  contentVersion: 3,
  lm_id: 'LM-034',
  title: 'PQC Risk Management',
  description:
    'Quantify quantum risk, build risk registers, model CRQC timeline scenarios, and generate risk heatmaps from real threat data.',
  whyThisMatters:
    'A CRQC timeline estimate is inherently uncertain — risk registers and heatmaps built from real threat data let an organization set migration priority without waiting for a certainty that will never come.',
  duration: '30 min',
  difficulty: 'beginner',
  frameworkPhase: 'p3',
  track: 'Executive',
  trackOrder: 0,
  learnSections: [
    { id: 'crqc', label: 'CRQC Timeline Modeling' },
    { id: 'register', label: 'Risk Register' },
    { id: 'heatmap', label: 'Risk Heatmap' },
  ],
  workshopSteps: [
    { id: 'crqc-scenario-planner', label: 'CRQC Scenario Planner' },
    { id: 'risk-register-builder', label: 'Risk Register Builder' },
    { id: 'risk-heatmap', label: 'Risk Heatmap' },
    { id: 'compliance-gap-analysis', label: 'Compliance Gap Analysis' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-DSA', 'ML-KEM'],
    standards: ['NIST SP 800-131A', 'RFC 9370', 'NIST CSWP 39', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCRiskManagementModule })),
}

export default manifest
