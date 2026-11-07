// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the Stateful Signatures module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import {
  CNSA_2022_PREFERRED_LABEL,
  CNSA_PHASE_OUT_LABEL,
} from '@/components/PKILearning/modules/PQCRiskManagement/data/cnsaLabels'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'stateful-signatures',
  version: '1.0.0',
  lastReviewed: '2026-10-27',
  lastEdited: '2026-11-02',

  standards: [
    getStandard('FIPS 205'), // SLH-DSA (Step 4 live demo)
    getStandard('RFC 8554'), // LMS/HSS
    getStandard('RFC 8391'), // XMSS/XMSS^MT
    getStandard('NIST SP 800-208'), // Stateful HBS Recommendation,
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 204'),
    getStandard('NSA CNSA 2.0'),
    getStandard('RFC 9858'),
    getStandard('RFC-10033-Hash-Based-Signatures-State-and-Backup-Management'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module labels a hashing mechanism it describes as conforming to FIPS 180-4
    // (the Secure Hash Standard) and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 180-4" against a row filed as FIPS-180-4.
    getStandard('FIPS-180-4'),
    // DECLARED 2026-08-23: this module names RFC 3161 as the timestamping protocol behind a mechanism it describes. RFC 5816
    // updates but does not obsolete it, so the protocol spec is the citation and cited nothing for it.
    getStandard('RFC-3161-Internet-X-509-Public-Key-Infrastructure-Time-Stamp'),
    // The "What the lab tests" panel quotes these two; declared so a reader can open them.
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NSA CNSA 2.0 FAQ'),
  ],

  algorithms: [
    getAlgorithm('LMS-SHA256 (H20/W8)'),
    getAlgorithm('XMSS-SHA2_20'),
    getAlgorithm('SLH-DSA-SHA2-128s'), // For comparison
  ],

  deadlines: [
    {
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    {
      label: CNSA_PHASE_OUT_LABEL,
      year: CNSA_2_0.softwareExclusive,
      source: 'CNSA 2.0',
    },
    {
      label: 'CNSA 2.0 algorithms mandated for all NSS unless otherwise noted',
      year: CNSA_2_0.fullEnforcement,
      source: 'CNSA 2.0',
    },
  ],

  narratives: {
    otsWarning:
      'A Winternitz OTS key can sign exactly one message. Reusing a one-time key breaks its one-time guarantee: every extra signature reveals more of the hash chains, so an attacker can begin forging signatures, and the set of messages they can forge grows with each reuse. Two signatures do not by themselves hand over the whole private key or let an attacker sign any message of their choice, but nothing bounds the damage once reuse is possible, so treat any reuse as a compromise and retire the key.',
    merkleExplain:
      'The Merkle tree root is the overall public key. Each leaf contains a one-time signature key pair.',
    stateManagement:
      'State must be persistent, atomic, and never cloned. Hardware Security Modules (HSMs) with non-volatile monotonic counters are the standard approach.',
    lmsVsXmss:
      'SP 800-208 states that the hardness assumptions underlying LMS and XMSS unforgeability may be viewed as substantially similar, deserving essentially equal confidence.',
    w4Size: '2.5 KB',
    w8Size: '1.7 KB',
  },
}
