// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CBOM module.
 *
 * `standards` is intentionally empty until the CBOM/codification standards
 * (CycloneDX/ECMA-424, SP 1800-38, PKCS#11, KMIP, RFC 9881, …) are added to
 * the library CSV — `getStandard()` throws on an unknown id, so these are
 * back-filled in the data-layer pass once the library entries exist.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'cbom',
  version: '1.0.0',
  lastReviewed: '2026-06-23',

  // Back-filled in the data-layer pass once library entries exist.
  standards: [],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('RSA-2048'),
  ],

  deadlines: [
    {
      label: 'EU cryptographic inventories required',
      year: 2026,
      source: 'EU PQC Roadmap (23 Jun 2025)',
    },
    { label: 'Classical PKC deprecated (RSA/ECC)', year: 2030, source: 'NIST IR 8547' },
    { label: 'Classical PKC disallowed', year: 2035, source: 'NIST IR 8547' },
  ],

  narratives: {
    overview:
      'A Cryptography Bill of Materials (CBOM) is a machine-readable inventory of every cryptographic asset — algorithms, keys, certificates, protocols and their configurations — and how they relate to software components. It extends the SBOM and sits as Phase 2 of the migration lifecycle: discovery (Phase 1) feeds it, risk scoring (Phase 3) consumes it.',
    formats:
      'CycloneDX (OWASP; standardized as ECMA-424, current spec v1.7) is the practical CBOM format today because SPDX (Linux Foundation; ISO/IEC 5962) has no dedicated cryptography object model yet. The PKI Consortium CBOM-Profiles Working Group is building a neutral methodology that maps profiles onto both formats.',
    ghost:
      'Ghost crypto is every cryptographic usage that is not in any inventory: shadow-IT services, forgotten-but-live certificates, hardcoded algorithms, embedded/OT crypto and default library crypto. You cannot migrate what you cannot find, so discovery layers (source, binary, network, infrastructure, cloud) must be combined.',
  },
}
