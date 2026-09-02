// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the PKIEnrollmentProtocols module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pki-enrollment-protocols',
  version: '0.1.0',
  lastReviewed: '2026-08-22',
  lastEdited: '2026-09-02',

  standards: [
    getStandard('IETF-RFC-7030-EST'),
    getStandard('RFC 9810'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    // RFC 9480 dropped 2026-09-01: deprecated, superseded_by RFC 9810, which
    // this module already cites above (line 17) — a re-point would have
    // duplicated the citation.
    getStandard('RFC 9629'),
    getStandard('RFC 9811'),
    getStandard('RFC 9881'),
    getStandard('draft-ietf-lamps-pq-composite-sigs-19'),
    // DECLARED 2026-08-23: this module names "RFC 4211" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-4211-Internet-X-509-PKI-Certificate-Request-Message-Form'),
    // DECLARED 2026-08-23: this module names "RFC 9908" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9908'),
    // DECLARED 2026-08-23: this module names "RFC 9909" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9909'),
    // DECLARED 2026-08-23: this module names "RFC 9935" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9935'),
    // DECLARED 2026-08-23: this module names "RFC 9936" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9936'),
  ],

  algorithms: [
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [],

  narratives: {
    estTransport: 'HTTPS POST to /.well-known/est/*',
    cmpTransport: 'HTTP POST application/pkixcmp (RFC 9811, obsoletes RFC 6712)',
    primaryRfc: 'RFC 9810 (CMP Updates for KEM, 2025-07)',
  },
}
