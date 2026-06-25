// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Decommissioning & Program Closure module.
 * `standards` is back-filled once the relevant entries are tagged in the
 * library CSV (getStandard throws on unknown ids).
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'verification-closure',
  version: '1.0.0',
  lastReviewed: '2026-06-23',

  standards: [],

  algorithms: [
    getAlgorithm('RSA-2048'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
  ],

  deadlines: [
    {
      label: 'Classical PKC deprecated (RSA/ECC/DH/ECDH/ECDSA/EdDSA)',
      year: 2030,
      source: 'NIST IR 8547',
    },
    { label: 'Classical PKC disallowed', year: 2035, source: 'NIST IR 8547' },
  ],

  narratives: {
    overview:
      'The end of a PQC migration is two distinct jobs that are routinely neglected: decommissioning the classical cryptography on a defensible schedule, and closing the program into business-as-usual. The independently-sourced spine is the deprecation timeline (NIST IR 8547: deprecate classical public-key by 2030, disallow by 2035; NCSC-UK 2028/2031/2035; ETSI), executed via the inventory→plan→execute lifecycle (ETSI TR 103 619 / TR 104 016, the Dutch PQC Migration Handbook).',
    verification:
      'A system is "migrated" when its behaviour shows it — the handshake negotiates ML-KEM/ML-DSA — not when a change ticket says so. This evidence-by-observed-behaviour standard and the estate-scale sampling approach are the framework author\'s practitioner guidance; the control basis (mapping migration capabilities to risk frameworks) is NIST CSWP 48 (draft) onto CSF 2.0 and SP 800-53.',
    closure:
      'Close deliberately: define closure criteria in advance, accept residual risk with a named owner and re-evaluation date, and hand the standing capabilities (CBOM, continuous discovery, vendor cadence, SOC content, KRIs, crypto-agility) to permanent owners with an archived evidence dossier. The generic governance hooks are ISO/IEC 27001 and the NIST Risk Management Framework (SP 800-37); the PQC-specific closure detail is practitioner guidance.',
  },
}
