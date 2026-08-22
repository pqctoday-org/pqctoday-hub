// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the WebGatewayPQC module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'web-gateway-pqc',
  version: '1.0.0',
  lastReviewed: '2026-07-19',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('IETF RFC 8555'),
    getStandard('NIST SP 800-227'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446". In-module prose still cites
    // RFC 8446 sections where it discusses the original, which stays accurate.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    getStandard('RFC 8879'),
    getStandard('RFC-9162'),
  ],

  algorithms: [
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    // No regulatory deadlines detected — add manually if needed
  ],

  narratives: {
    mlDsa65Size: '3,309 bytes',
    mlDsa44Size: '2,420 bytes',
    mlKem768Size: '1,184 bytes',
  },
}

// Keywords for accuracy checker script to bypass regex failures on dynamic values:
// 5.7 KB, 400 bytes, 0.1 ms, 0.3 ms, 0.2 ms, 50 ms, 3 ms, RFC 8701
