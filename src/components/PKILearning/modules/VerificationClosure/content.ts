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
  version: '1.1.0',
  lastReviewed: '2026-06-25',

  standards: [],

  algorithms: [
    getAlgorithm('RSA-2048'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
  ],

  deadlines: [
    {
      label: 'Classical PKC (112-bit) deprecated',
      year: 2030,
      source: 'NIST IR 8547 (draft)',
    },
    { label: 'Classical PKC disallowed', year: 2035, source: 'NIST IR 8547 (draft)' },
  ],

  narratives: {
    overview:
      'The end of a PQC migration is two distinct jobs that are routinely neglected: decommissioning the classical cryptography on a defensible schedule, and closing the program into business-as-usual. The independently-sourced spine is the deprecation timeline (NIST IR 8547, still a draft: deprecate 112-bit classical public-key after 2030, disallow all after 2035; NCSC-UK targets of 2028 discovery+plan / 2031 high-priority / 2035 complete), executed via an inventory→plan→execute lifecycle drawn from ETSI TR 103 619 and TR 104 016 (ETSI TC CYBER) and the separate AIVD/CWI/TNO PQC Migration Handbook (2nd ed., 2024).',
    verification:
      'A system is "migrated" when its behaviour shows it — the handshake negotiates ML-KEM/ML-DSA — not when a change ticket says so. This evidence-by-observed-behaviour standard and the estate-scale sampling approach are the framework author\'s practitioner guidance; the control basis (mapping migration capabilities to risk frameworks) is NIST CSWP 48 (draft) onto CSF 2.0 and SP 800-53.',
    closure:
      "Close deliberately: define closure criteria in advance, accept residual risk with a named owner and re-evaluation date, and hand the standing capabilities (CBOM, continuous discovery, vendor cadence, SOC content, KRIs, crypto-agility) to permanent owners with an archived evidence dossier. The generic governance hooks are ISO/IEC 27001 and the NIST Risk Management Framework (SP 800-37); ongoing procurement should follow CISA's product-category list for PQC-capable technologies (Jan 2026); the PQC-specific closure detail is practitioner guidance.",
  },
}
