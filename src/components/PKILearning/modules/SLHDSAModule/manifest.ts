// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleManifest } from '@/components/PKILearning/manifest/types'
import { resolveManifest } from '@/components/PKILearning/manifest/resolve'

const manifest: ModuleManifest = {
  id: 'slh-dsa',
  whyThisMatters:
    "SLH-DSA trades signature size for security that rests only on hash-function properties (BSI TR-02102-1 section 5.3.4; FIPS 205 section 1.1), with no number-theoretic assumption to second-guess — which matters when the whole point of PQC is not trusting today's assumptions.",
  learnSections: [
    { id: 'overview', label: 'SLH-DSA Overview' },
    { id: 'internals', label: 'WOTS+, FORS & Hypertree' },
    { id: 'parameters', label: 'Parameters & Tradeoffs' },
    { id: 'advanced', label: 'Context & Deterministic' },
  ],
  workshopSteps: [
    { id: 'keygen', label: 'Key Generation & Parameter Explorer' },
    { id: 'sign-verify', label: 'Sign & Verify (Pure + HashSLH-DSA)' },
    { id: 'context-deterministic', label: 'Context Strings & Deterministic Mode' },
    { id: 'comparison', label: 'LMS vs XMSS vs SLH-DSA Comparison' },
  ],
  // Round 9, wave 2 (2026-09-19): "Start here" — one real workshop step, written from that step's component.
  startHere: {
    step: 'keygen',
    text: 'Turn on Live WASM mode, pick one of the 12 FIPS 205 parameter sets, then Generate Key Pair, Sign Message and Verify Signature: public key, signature and verdict come from a real in-browser HSM.',
  },
  embeddable: true,
  load: () => import('./index').then((m) => ({ default: m.SLHDSAModule })),
}

export default resolveManifest(manifest)
