// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'pqc-candidates',
  whyThisMatters:
    "ML-KEM, ML-DSA, and SLH-DSA are the algorithms you'll actually deploy; choosing the wrong one means migrating twice.",
  learnSections: [
    { id: 'rolling-process', label: 'Rolling Standardisation' },
    { id: 'validation', label: 'Candidate Validation' },
    { id: 'families', label: 'Four Math Families' },
    { id: 'worldwide', label: 'Worldwide Processes' },
    { id: 'whats-next', label: "What's Coming Next" },
  ],
  workshopSteps: [
    { id: 'lifecycle', label: 'Standardisation Lifecycle' },
    { id: 'family-math', label: 'Family Math Explainer' },
    { id: 'comparator', label: 'Candidate Comparator' },
    { id: 'cryptanalysis', label: 'Cryptanalysis Timeline' },
    { id: 'future-rounds', label: 'Future Rounds Forecaster' },
    { id: 'worldwide-map', label: 'Worldwide Standardisation Map' },
  ],
  startHere: {
    step: 'comparator',
    text: 'Sort and filter the third-round signature candidates by use case in the Candidate Comparator: compare public-key, signature, and combined sizes across MPCitH, multivariate, and isogeny families (with withdrawn HAWK excluded from recommendations).',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.PQCCandidatesModule })),
}

export default resolveManifest(manifest)
