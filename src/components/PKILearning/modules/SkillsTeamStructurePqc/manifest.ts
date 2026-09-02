// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'skills-team-structure',
  contentVersion: 4,
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SkillsTeamStructureModule })),
}

export default manifest
