// SPDX-License-Identifier: GPL-3.0-only
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getStandard } from '@/data/standardsRegistry'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'crypto-registry',
  version: '1.0.0',
  lastReviewed: '2026-08-23',

  standards: [
    getStandard('CycloneDX-Cryptography-Registry'),
    getStandard('OWASP-CycloneDX-CBOM-Guide'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('ANSI X9.62'),
    getStandard('RFC 9881'),
  ],

  algorithms: [getAlgorithm('ML-KEM-768'), getAlgorithm('ML-DSA-65'), getAlgorithm('ECDSA P-256')],

  deadlines: [
    {
      label: 'EU cryptographic inventories required',
      year: 2026,
      source: 'EU PQC Roadmap (23 Jun 2025)',
    },
  ],

  narratives: {
    overview:
      'The CycloneDX Cryptography Registry (introduced in CycloneDX v1.7) is a standalone, versioned catalog of 96 cryptographic algorithm families and 246 elliptic curves. It exists to solve one problem: the same mechanism has a different name in every tool that touches it — an HSM, a certificate, a protocol, a library, a CBOM — and without one shared vocabulary those names never line up.',
    scope:
      'Algorithm families are grouped by primitive (signature, KEM/PKE, key-agreement, block/stream cipher, AEAD, MAC, hash, XOF, KDF, key-wrap, DRBG). Elliptic curves are grouped into 15 standardization categories (NIST, SECG, Brainpool, ANSSI, BLS, GOST, X9.62/X9.63 and more), each entry carrying its OID, form (Weierstrass/Edwards/Montgomery) and cross-referenced aliases.',
    pqc: 'ML-KEM, ML-DSA, SLH-DSA, XMSS and LMS are registered as first-class families alongside their classical counterparts — the registry does not treat PQC as an afterthought bolted onto a legacy list, which is exactly what a PQC-readiness review needs: one place to check whether a discovered mechanism is quantum-safe.',
    independence:
      'The registry ships as its own versioned JSON + JSON Schema, decoupled from the CycloneDX specification release cycle and explicitly usable by tooling that has nothing to do with CBOM or CycloneDX — an SPDX-based scanner, a homegrown inventory format, or a compliance dashboard can all adopt the same names.',
  },
}
