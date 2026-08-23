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
    // Both added 2026-08-22. The module made two dated, checkable claims — the EU
    // end-2026 inventory milestone and the CBOM-Profiles WG launch — against documents
    // it never cited, so the accuracy spot-check could only return NOT-IN-EVIDENCE for
    // each. Both are supported once the evidence is declared here; the EU one was also
    // overstated and has been corrected. Four entries is the sampler's cap, so all four
    // are read.
    getStandard('EU-NIS-CG-Roadmap-v1.1'),
    getStandard('PKI-Consortium-Launches-the-CBOM-Profiles-Working-Group'),
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
      // NOT a requirement, and not on organisations — corrected 2026-08-22 against the
      // cached document. The NIS CG roadmap sets Milestone 1 at 31.12.2026 for MEMBER
      // STATES, whose First Steps include "Support mature cryptographic asset
      // management"; on inventories it says Member States "should promote and support"
      // their creation, and that using a standardised format "like CBOM ... is
      // recommended". The date was wrong too: the document is dated 11.06.2025.
      label: 'EU milestone: Member States complete First Steps (incl. cryptographic inventories)',
      year: 2026,
      source: 'EU NIS CG Coordinated Implementation Roadmap v1.1 (11 Jun 2025)',
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
      'CycloneDX (OWASP; standardized as ECMA-424, current spec v1.7) is the practical CBOM format today because SPDX (Linux Foundation; ISO/IEC 5962) has no dedicated cryptography object model yet. The PKI Consortium CBOM-Profiles Working Group, launched 8 June 2026, is building a neutral, open methodology for defining CBOM profiles that map onto SPDX, CycloneDX and other BOM standards rather than competing with them.',
    ghost:
      'Ghost crypto is every cryptographic usage that is not in any inventory: shadow-IT services, forgotten-but-live certificates, hardcoded algorithms, embedded/OT crypto and default library crypto. You cannot migrate what you cannot find, so discovery layers (source, binary, network, infrastructure, cloud) must be combined.',
  },
}
