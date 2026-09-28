// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the AcvpLabWorkflow module (acvp-lab-workflow).
 *
 * Standards below are the Hub Library rows this module cites. The CAVP /
 * ACVTS program pages, the usnistgov/ACVP algorithm sub-specifications, and
 * the usnistgov/ACVP-Server repository were added to the Library 2026-09-25
 * (ACVP gap-closure plan P6) and are cited here directly, in addition to
 * their in-module citation from data/sources.ts (kept as the source of the
 * exact per-algorithm commit pins). LIBRARY_ADDITIONS_NEEDED in sources.ts
 * is now empty as a result.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'acvp-lab-workflow',
  version: '0.1.0',
  // No lastReviewed: this is a DRAFT awaiting review by a validation-lab
  // practitioner (plan WS-I). record_module_review.py sets it when that review
  // is recorded — never by hand.
  lastEdited: '2026-09-25',

  standards: [
    getStandard('NIST-ACVP'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('CMVP-MGMT-MANUAL'),
    getStandard('NIST-SP-800-140C'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('PKCS11-V32-OS-OASIS'),
    getStandard('PKCS-11-Cryptographic-Token-Interface-Profiles-Version-3-2-O'),
    getStandard('NIST-Cryptographic-Algorithm-Validation-Program-CAVP'),
    getStandard('Accessing-the-ACVTS-Demo-and-Prod-Environments'),
    getStandard('usnistgov-ACVP-Automated-Cryptographic-Validation-Protocol-S'),
    getStandard('usnistgov-ACVP-Server-Public-Reference-Sample-Vector-Sets'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    // No regulatory deadlines are taught in this module.
  ],

  narratives: {
    reviewStatus: 'Draft — awaiting review by a validation-lab practitioner',
    acvpSpecRevision: 'draft-ietf-acvp-spec-01 (14 Aug 2026)',
    acvpSubSpecCommit: 'usnistgov/ACVP @ 892fd14 (ML-DSA, SLH-DSA, SHA); @ bccef36 (ML-KEM)',
    publicSampleCommit: 'usnistgov/ACVP-Server @ 975de31',
    evidenceClassCount: '8',
    claimLadderRungs: '9',
  },
}
