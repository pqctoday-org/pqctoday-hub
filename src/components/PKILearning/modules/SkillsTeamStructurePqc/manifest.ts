// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'skills-team-structure',
  whyThisMatters:
    "A PQC migration plan without a staffing plan is a document, not a program — the FTE math and Crypto Champion network turn 'we should migrate' into 'here's who does it, by when'.",
  learnSections: [
    { id: 'challenge', label: 'Skills & Core Roles' },
    { id: 'sizing', label: 'Team Sizing & Build' },
    { id: 'training', label: 'Training & Champions' },
    { id: 'resources', label: 'Resources & Workshop' },
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
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SkillsTeamStructureModule })),
}

export default resolveManifest(manifest)
