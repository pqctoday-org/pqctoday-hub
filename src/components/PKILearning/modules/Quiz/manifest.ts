// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'quiz',
  title: 'PQC Quiz',
  description:
    'Test your knowledge across all PQC topics — algorithms, standards, compliance, migration, and more.',
  whyThisMatters:
    "The fastest way to find out what you don't actually understand about PQC is to be tested on it across every topic at once, not module by module.",
  duration: '10 min',
  frameworkPhase: 'foundations',
  custom: true,
  stepCountOverride: 1,
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.QuizModule })),
}

export default manifest
