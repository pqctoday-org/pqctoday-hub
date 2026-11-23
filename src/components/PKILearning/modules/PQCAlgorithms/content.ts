// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the PQCAlgorithms module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'
import { claimText } from './data/sourceClaims'

export const content: ModuleContent = {
  moduleId: 'pqc-algorithms',
  version: '1.0.0',
  // lastReviewed is left unset: it is written together with the module's review record.
  lastEdited: '2026-11-23',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST SP 800-208'),
    getStandard('RFC 8391'),
    getStandard('NIST SP 800-227'),
    getStandard('NIST-SP-800-56C-R2'),
    getStandard('NIST IR 8413'),
    getStandard('NIST IR 8547'),
    getStandard('NIST-Selects-HQC-as-Fifth-Algorithm-for-Post-Quantum-Encrypt'),
    getStandard('NSA CNSA 2.0 FAQ'),
    getStandard('BSI TR-02102-1'),
    getStandard('ANSSI PQC Follow-up Paper'),
    getStandard('UK-NCSC-PQC-Whitepaper-2024'),
    getStandard('RFC-10024'),
    getStandard('draft-ietf-tls-mlkem-11'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-KEM-1024'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('ECDSA P-256'),
  ],

  deadlines: [
    // None. The lesson states no date of its own; dates appear only inside the sentences it quotes.
  ],

  narratives: {
    overview:
      'Intermediate module on the standardised post-quantum algorithms. It reads FIPS 203, FIPS 204 and FIPS 205, NIST SP 800-208, NIST SP 800-227, NIST IR 8413 and NIST IR 8547, the NSA CNSA 2.0 FAQ, BSI TR-02102-1, the ANSSI follow-up paper, the UK NCSC white paper, RFC 10024 and draft-ietf-tls-mlkem-11, one sentence at a time with the document, edition and place each sentence comes from.',
    keyConcepts: [
      claimText('ALG-A01'),
      claimText('ALG-A03'),
      claimText('ALG-B01'),
      claimText('ALG-C01'),
    ].join(' '),
    workshopSummary:
      'ML-KEM Round Trip: generate a key pair, encapsulate, decapsulate, then change one byte of the ciphertext and decapsulate again. ML-DSA Sign and Verify: generate a key pair, sign in the hedged or deterministic mode with or without a context string, and verify against the same or a changed message or context. Size Comparator: compare key, signature and ciphertext sizes from the algorithm registry next to the sentences that state them.',
    relatedStandards:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), NIST SP 800-208 (LMS and XMSS), NIST SP 800-227, NIST IR 8547, the NSA CNSA 2.0 FAQ, BSI TR-02102-1, the ANSSI follow-up paper, the UK NCSC white paper, RFC 10024 and draft-ietf-tls-mlkem-11.',
  },
}
