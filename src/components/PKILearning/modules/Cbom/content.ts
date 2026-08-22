// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CBOM module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getStandard } from '@/data/standardsRegistry'
import { getAlgorithm } from '@/data/algorithmProperties'

export const content: ModuleContent = {
  moduleId: 'cbom',
  version: '1.0.0',
  lastReviewed: '2026-08-22',

  standards: [
    getStandard('OWASP-CycloneDX-CBOM-Guide'),
    getStandard('CycloneDX-Cryptography-Registry'),
  ],

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
    {
      label: 'Classical PKC deprecated (RSA/ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547',
    },
    {
      label: 'Classical PKC disallowed',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547',
    },
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
