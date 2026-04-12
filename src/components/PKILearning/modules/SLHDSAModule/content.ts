// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleContent } from '@/types/ModuleContentTypes'

export const content: ModuleContent = {
  moduleId: 'slh-dsa',
  version: '1.0.0',
  lastReviewed: '2026-04-07',

  standards: [],
  algorithms: [],
  deadlines: [],

  narratives: {
    stateless:
      'SLH-DSA eliminates state management complexity — no per-key signing counter, no risk of key exhaustion, safe for distributed and serverless deployments.',
    signatureSize:
      'Signature sizes range from 7,856 B (SHA2-128s) to 49,856 B (SHAKE-256f) — significantly larger than classical ECDSA but with quantum-safe security.',
    tradeoff:
      '-s variants use fewer hypertree layers: smaller signatures but more hash rounds per layer. -f variants use more layers: faster signing but larger signatures.',
    context:
      'FIPS 205 §9.2 context strings provide domain separation — they bind a signature to a specific protocol or application context, preventing cross-context forgery.',
    deterministic:
      'FIPS 205 §10 deterministic mode (opt_rand = none) produces identical signatures for the same (SK, M, context) triple, enabling auditable and reproducible signing.',
  },
}
