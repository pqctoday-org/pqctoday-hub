// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'quiz',
  whyThisMatters:
    "The fastest way to find out what you don't actually understand about PQC is to be tested on it across every topic at once, not module by module.",
  custom: true,
  stepCountOverride: 1,
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QuizModule })),
}

export default resolveManifest(manifest)
