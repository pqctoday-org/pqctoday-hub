// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'talking-about-pqc',
  whyThisMatters:
    'Customers, buyers and journalists can now check a quantum claim against public records. A sentence that overstates a deadline or a certificate costs more trust than it ever wins.',
  learnSections: [
    { id: 'one-minute', label: 'The One-Minute Version' },
    { id: 'real-dates', label: 'Dates That Are Real' },
    { id: 'certificates', label: 'What a Certificate Proves' },
    { id: 'words', label: 'Words to Check' },
    { id: 'customer-questions', label: 'Answering the Question' },
  ],
  workshopSteps: [
    { id: 'claim-checker', label: 'Claim Checker' },
    { id: 'question-practice', label: 'Customer Questions' },
  ],
  startHere: {
    step: 'claim-checker',
    text: 'Pick the most accurate version of each claim in the Claim Checker: six sentences you will hear in pitches and press releases, each with the reason one version holds up and the others do not.',
  },
  load: () => import('./index').then((m) => ({ default: m.TalkingAboutPQCModule })),
}

export default resolveManifest(manifest)
