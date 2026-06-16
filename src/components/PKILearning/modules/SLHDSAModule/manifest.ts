// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'

const manifest: ModuleManifest = {
  id: 'slh-dsa',
  lm_id: 'LM-027',
  title: 'SLH-DSA: Stateless Hash Signatures',
  description:
    'Master FIPS 205 SLH-DSA: WOTS+, FORS, hypertree architecture, parameter trade-offs, context strings, deterministic signing, and migration from stateful schemes.',
  duration: '45 min',
  difficulty: 'advanced',
  frameworkPhase: 'foundations',
  track: 'Software Infrastructure',
  trackOrder: 7,
  learnSections: [
    { id: 'overview', label: 'SLH-DSA Overview & Why Stateless' },
    { id: 'internals', label: 'WOTS+, FORS & Hypertree Architecture (§3–5)' },
    { id: 'parameters', label: 'Parameter Sets, Tradeoffs & FIPS 205 §6' },
    { id: 'advanced', label: 'Context Strings, Deterministic Mode & HashSLH-DSA' },
  ],
  workshopSteps: [
    { id: 'keygen', label: 'Key Generation & Parameter Explorer' },
    { id: 'sign-verify', label: 'Sign & Verify (Pure + HashSLH-DSA)' },
    { id: 'context-deterministic', label: 'Context Strings & Deterministic Mode' },
    { id: 'comparison', label: 'LMS vs XMSS vs SLH-DSA Comparison' },
  ],
  playgroundTool: 'slh-dsa',
  taxonomy: { algorithms: ['SLH-DSA'], standards: ['FIPS 205'] },
  load: () => import('./index').then((m) => ({ default: m.SLHDSAModule })),
}

export default manifest
