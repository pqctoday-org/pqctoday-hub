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
  lastReviewed: '2026-05-16',

  standards: [
    getStandard('RFC 7030'),
    getStandard('RFC 4210'),
    getStandard('RFC 9810'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
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
    cmpTransport: 'HTTP POST application/pkixcmp (RFC 6712)',
    primaryRfc: 'RFC 9810 (CMP Updates for KEM, 2025-07)',
  },
}
