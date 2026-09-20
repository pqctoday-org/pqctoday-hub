// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'skills-team-structure',
  contentVersion: 8,
  lm_id: 'LM-059',
  title: 'Skills & Team Structure',
  description:
    'Size and staff the PQC migration program: convert your cryptographic estate into an FTE estimate with the 1-FTE-per-500-instances heuristic, build a federated Crypto Champion roster, and track each champion’s readiness commitments.',
  whyThisMatters:
    "A PQC migration plan without a staffing plan is a document, not a program — the FTE math and Crypto Champion network turn 'we should migrate' into 'here's who does it, by when'.",
  duration: '30 min',
  difficulty: 'intermediate',
  frameworkPhase: 'foundations',
  track: 'Executive',
  trackOrder: 7,
  learnSections: [
    { id: 'team-sizing', label: 'Team Sizing Heuristic' },
    { id: 'crypto-champions', label: 'Crypto Champion Roster' },
  ],
  workshopSteps: [
    { id: 'team-sizing', label: 'Team Sizing Calculator' },
    { id: 'crypto-champions', label: 'Crypto Champion Roster' },
  ],
  startHere: {
    step: 'team-sizing',
    text: 'Enter your estate size in the Team Sizing Calculator: the 1-FTE-per-500-instances heuristic turns it into a programme FTE estimate, then step 2 assigns a crypto champion per platform team.',
  },
  // reduced 5-tab set (no Tools & Products) — this module is staffing/process
  // methodology (FTE sizing, Crypto Champion roster), not a product category;
  // the migrate catalog has no workforce/training category to ever populate it.
  tabs: [
    { value: 'learn', label: 'Learn' },
    { value: 'visual', label: 'Visual' },
    { value: 'workshop', label: 'Workshop' },
    { value: 'exercises', label: 'Exercises' },
    { value: 'references', label: 'References' },
  ],
  // Wave B (2026-09-18): derived from the algorithm and standard ids this
  // module's content.ts declares (the References tab's own data), restricted to
  // the STANDARD_TAXONOMY vocabulary so the researcher browse axis and the
  // related-modules engine see it. Re-derive from content.ts; do not hand-tune.
  taxonomy: {
    algorithms: ['ML-KEM', 'ML-DSA', 'SLH-DSA', 'Falcon'],
    standards: ['CycloneDX CBOM', 'NSA CNSA 2.0', 'NIST IR 8547'],
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SkillsTeamStructureModule })),
}

export default manifest
