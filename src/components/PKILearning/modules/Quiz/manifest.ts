// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'quiz',
  title: 'PQC Quiz',
  description:
    'Test your knowledge across all PQC topics — algorithms, standards, compliance, migration, and more.',
  duration: '10 min',
  frameworkPhase: 'foundations',
  custom: true,
  stepCountOverride: 1,
  load: () => import('./index').then((m) => ({ default: m.QuizModule })),
}

export default manifest
