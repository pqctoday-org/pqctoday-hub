// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the Decommissioning & Program Closure module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'verification-closure',
  lastReviewed: '2026-08-23',
  version: '1.1.0',
  lastEdited: '2026-08-23',

  // CORRECTED 2026-08-23. This read that NCSC-UK's 2028/2031/2035 targets and ISO/IEC
  // 27001 "have no ACTIVE library row to cite". Both halves were wrong by the time it was
  // acted on: UK-NCSC-Migration-Timelines-2025 has been active all along and its cached PDF
  // carries the targets verbatim ("By 2028 ... Carry out a full discovery exercise", "By 2031
  // Carry out your early, highest-priority PQC migration activities", "By 2035 Complete
  // migration to PQC of all your systems"), and ISO-IEC-27001-2022 was reactivated the same
  // day — it had been hidden under a no-record-without-proof policy that a standard ISO sells
  // can never satisfy. A note explaining why something is uncitable goes stale silently; the
  // spot-check flagged the NCSC claim as resting on no sampled evidence, which is what
  // surfaced it. The AIVD/CWI/TNO Handbook genuinely has no row and stays prose-only.
  standards: [
    getStandard('NIST IR 8547'),
    getStandard('ETSI TR 103 619'),
    getStandard('ETSI-TR-104-016'),
    getStandard('NIST CSWP 48'),
    getStandard('NIST SP 800-37'),
    getStandard('CISA-PQC-CATEGORY-LIST-2026'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('NIST SP 800-53'),
    // DECLARED 2026-08-23: this module names SP 800-131A for algorithm transition guidance and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-131A" against a row filed as NIST-SP-800-131A-Rev3.
    getStandard('NIST-SP-800-131A-Rev3'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 27001" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-27001-2022'),
    // DECLARED 2026-08-23: the module states NCSC-UK's 2028/2031/2035 phased targets to a
    // reader. Verified against this row's own cached PDF before declaring.
    getStandard('UK-NCSC-Migration-Timelines-2025'),
  ],

  algorithms: [
    getAlgorithm('RSA-2048'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
  ],

  deadlines: [
    {
      label: 'Classical PKC (112-bit) deprecated',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547 (draft)',
    },
    {
      label: 'Classical PKC disallowed',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547 (draft)',
    },
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
