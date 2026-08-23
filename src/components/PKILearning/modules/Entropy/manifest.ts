// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'entropy-randomness',
  contentVersion: 3,
  lm_id: 'LM-003',
  title: 'Entropy & Randomness',
  description:
    'Master entropy sources, DRBG mechanisms, and quantum randomness — NIST SP 800-90 standards, entropy testing, TRNG vs QRNG, and combining sources for defense-in-depth.',
  whyThisMatters:
    "Every key this curriculum generates depends on entropy — a weak DRBG or predictable seed makes even a perfect PQC algorithm choice worthless, since the attack moves from 'break the math' to 'guess the seed'.",
  duration: '40 min',
  difficulty: 'advanced',
  frameworkPhase: 'foundations',
  track: 'Foundations',
  trackOrder: 0,
  learnSections: [
    { id: 'entropy', label: 'Entropy Sources' },
    { id: 'drbg', label: 'SP 800-90 DRBG' },
    { id: 'testing', label: 'Entropy Testing (90B)' },
    { id: 'qrng', label: 'TRNG vs QRNG Comparison' },
    { id: 'combining', label: 'Combining Sources' },
  ],
  workshopSteps: [
    { id: 'random-generation', label: 'Random Byte Generation' },
    { id: 'entropy-testing', label: 'Entropy Testing' },
    { id: 'esv-walkthrough', label: 'ESV Validation Walkthrough' },
    { id: 'qrng-comparison', label: 'QRNG Exploration' },
    { id: 'source-combining', label: 'Combining Sources' },
  ],
  playgroundTool: 'entropy-test',
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.EntropyModule })),
}

export default manifest
