// SPDX-License-Identifier: AGPL-3.0-only
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'slh-dsa',
  version: '1.0.0',
  lastReviewed: '2026-10-27',
  lastEdited: '2026-11-02',

  standards: [
    getStandard('FIPS 205'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('BSI TR-02102-1'),
    getStandard('FIPS 204'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8391'),
    getStandard('RFC 8554'),
    // The "What the lab tests" panel quotes these three; declared so a reader can open them.
    getStandard('ACVP-SLH-DSA-JSON-Specification'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NSA CNSA 2.0 FAQ'),
  ],
  algorithms: [getAlgorithm('SLH-DSA-SHA2-128s'), getAlgorithm('SLH-DSA-SHAKE-256f')],
  deadlines: [],

  narratives: {
    stateless:
      'SLH-DSA eliminates state management complexity — no per-key signing counter, safe for distributed and serverless deployments. Its security analysis assumes at most 2^64 signatures per key pair (FIPS 205 §11), so the key is not unlimited.',
    signatureSize:
      'Signature sizes range from 7,856 B (SHA2-128s) to 49,856 B (SHAKE-256f) — significantly larger than classical ECDSA but with quantum-safe security.',
    tradeoff:
      '-s variants use fewer hypertree layers: smaller signatures but more hash rounds per layer. -f variants use more layers: faster signing but larger signatures.',
    context:
      'FIPS 205 §10.2: the signer can pass a context string (at most 255 bytes, empty by default) that is signed together with the message, so the verifier must supply the same context.',
    deterministic:
      'FIPS 205 §9.2 deterministic signing uses PK.seed for opt_rand and produces identical signatures with the same key, message, context and settings. This demonstrates repeatability, not random-generator quality or resistance to attacks.',
  },
}
