// SPDX-License-Identifier: GPL-3.0-only
/**
 * Structured content for the CryptoAgility module.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0 } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'crypto-agility',
  version: '1.0.0',
  lastReviewed: '2026-08-10',
  lastEdited: '2026-08-23',

  standards: [
    getStandard('NIST SP 800-208'),
    getStandard('NIST SP 800-227'),
    getStandard('RFC 9629'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 202'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('NIST IR 8547'),
    getStandard('NSA CNSA 2.0'),
    getStandard('RFC 9370'),
    // DECLARED 2026-08-23: this module tells a reader that keys live in a FIPS 140-3
    // validated module and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match the
    // prose "FIPS 140-3" against a row filed as FIPS-140-3-STANDARD.
    getStandard('FIPS-140-3-STANDARD'),
    // DECLARED 2026-08-23: this module names "RFC 9846" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
  ],

  algorithms: [
    getAlgorithm('ECDH P-384'),
    getAlgorithm('ECDSA P-256'),
    getAlgorithm('Ed25519'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-DSA-87'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('RSA-4096'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: 'CNSA 2.0 software signing preferred',
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: 'CNSA 2.0 software exclusive', year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      "The Crypto Agility module teaches how to design systems that can rapidly swap cryptographic algorithms, protocols, and implementations without significant code or infrastructure changes. Crypto agility is NIST's top recommendation for PQC transition preparedness.",
    keyConcepts:
      'Crypto agility is the ability to rapidly switch cryptographic algorithms, protocols, and implementations without significant application code changes. Three dimensions of agility: Algorithm agility — swap algorithms (RSA to ML-KEM) via configuration, not code rewrites. Protocol agility — support multiple protocol versions simultaneously (TLS 1.2/1.3, hybrid key exchange). Implementation agility — switch between crypto providers (OpenSSL, BoringSSL, AWS-LC) without application changes.',
    workshopSummary:
      'The workshop has 3 interactive steps: Abstraction Layer Demo — interactive demonstration of how algorithm-agnostic APIs enable instant backend swaps; select different crypto providers and see how the same API calls produce results from different algorithm implementations. CBOM Scanner — scan a sample enterprise architecture to discover and catalog all quantum-vulnerable cryptographic algorithms in use; produces a CycloneDX-format CBOM with risk assessments.',
    relatedStandards:
      'NIST IR 8547 (Transition to Post-Quantum Cryptography Standards). NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0). CISA Post-Quantum Cryptography Initiative. CycloneDX CBOM Specification. NIST SP 800-227',
  },
}
