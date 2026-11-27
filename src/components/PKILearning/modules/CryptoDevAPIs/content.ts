// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the CryptoDevAPIs module.
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
  moduleId: 'crypto-dev-apis',
  version: '1.0.5',
  lastReviewed: '2026-08-18',
  lastEdited: '2026-11-26',

  standards: [
    // Primary current JDK security-update and Bouncy Castle release evidence,
    // added after the 17 November 2026 releases changed the latest-version facts.
    getStandard('Oracle-JDK-21-Consolidated-Release-Notes'),
    getStandard('Oracle-Java-SE-Latest-Releases'),
    getStandard('BouncyCastle-Java-1-87-Release'),
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    // RFC 9846 (July 2026) is the current TLS 1.3 specification — its header reads
    // "Obsoletes: 5077, 5246, 6961, 7627, 8422, 8446", and the library row for 8446
    // already carried 9846 as its supersession pointer. Repointed 2026-08-22.
    // In-module prose still cites RFC 8446 sections where it discusses the original,
    // which stays accurate: TLS 1.3 the protocol is unchanged; the specification moved.
    getStandard('RFC-9846-The-Transport-Layer-Security-TLS-Protocol-Version-1'),
    // DECLARED 2026-08-22 by writeback_module_declarations.py: documents this
    // module already names to a reader. Mechanical since the four-document
    // sampler cap was lifted the same day — declaring no longer costs coverage.
    getStandard('FIPS 186-5'),
    getStandard('FIPS 202'),
    getStandard('NIST SP 800-56A'),
    getStandard('PQClean'),
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
    // DECLARED 2026-08-23: this module names SP 800-208 as the stateful hash-based signature standard and cited nothing for it. Found by
    // audit_module_designation_aliases.py — the literal-id check could not match
    // the prose "SP 800-208" against a row filed as NIST SP 800-208.
    getStandard('NIST SP 800-208'),
    // DECLARED 2026-08-23: this module names "ISO/IEC 7816" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('ISO-IEC-7816-4-2020-Identification-cards-Integrated-circuit'),
    // DECLARED 2026-08-23: this module names "RFC 8032" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-8032'),
    // DECLARED 2026-08-23: this module names "RFC 9763" to a reader and cited
    // nothing for it. Capture verified clean (no Obsoleted-by / Withdrawn header)
    // before declaring — the check that caught RFC 4210, RFC 6712, SP 800-161r1
    // and a misnamed RFC 9700 row earlier the same day.
    getStandard('RFC-9763'),
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('Announcing-NET-10'), // m-crypto-dev-apis: November 2025
    // round 9 wave 4c (2026-09-20): cited for the figures the accuracy record found unmapped
    getStandard('Download-Bouncy-Castle-Java'), // m-crypto-dev-apis: wave 4c
    getStandard('BouncyCastle-Releases-Java-1-81-and-CSharp-2-6-1'),
  ],

  algorithms: [
    getAlgorithm('Ed25519'),
    getAlgorithm('FN-DSA-512'),
    getAlgorithm('HQC-128'),
    getAlgorithm('ML-DSA-44'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('ML-KEM-512'),
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('RSA-2048'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
    getAlgorithm('X25519'),
  ],

  deadlines: [
    {
      label: CNSA_2022_PREFERRED_LABEL,
      year: CNSA_2_0.softwarePreferred,
      source: 'CNSA 2.0',
    },
    { label: CNSA_PHASE_OUT_LABEL, year: CNSA_2_0.softwareExclusive, source: 'CNSA 2.0' },
  ],

  narratives: {
    overview:
      'Intermediate-level module (80 min, 8 workshop steps) covering post-quantum cryptography integration across the major cryptographic APIs and programming language ecosystems — JCA/JCE, OpenSSL EVP, PKCS#11 v3.2, Windows CNG, and language-specific PQC libraries. Teaches developers how to migrate production cryptographic code to PQC without vendor lock-in, using crypto agility patterns.',
    keyConcepts:
      'JCA/JCE (Java Cryptography Architecture / Extension): Provider-based architecture — Security.addProvider() inserts pluggable crypto backends. JDK 24+ includes ML-KEM (JEP 496, javax.crypto.KEM) and ML-DSA (JEP 497, Signature "ML-DSA") in the default providers; Oracle JDK 25 has them, and Oracle backported them to JDK 21.0.13 and 17.0.21 in October 2026. Oracle’s latest security updates on 17 November 2026 are JDK 25.0.5.1, 21.0.13.1, 17.0.21.1, 11.0.33.1 and 8u513; install the latest update in the chosen JDK line. Oracle JDK 11 and 8 are planned to receive PQC backports in the second half of 2027. On a JDK without the algorithms, or for SLH-DSA, register a current Bouncy Castle JCA provider (BC or BCFIPS); 1.79 is the historical ML-KEM/ML-DSA feature floor, not a recommendation to run that old release. Bouncy Castle Java 1.87 (11 November 2026) deprecates Classic McEliece and says it is no longer believed safe to use. Algorithm strings: "ML-KEM" / "ML-DSA" families with parameter sets such as "ML-KEM-768", "ML-DSA-65".',
    workshopSummary:
      'Eight interactive steps: (1) API Architecture Explorer — visualize the provider/plugin architecture of JCA/JCE, OpenSSL EVP, PKCS#11, Windows CNG, Bouncy Castle, and JCProv, and identify what still changes around the provider boundary. (2) Language Ecosystem Comparator — compare ML-KEM-768 and ML-DSA-65 code ergonomics, memory safety, and bindings across C++, Rust, Zig, Java, Python, Go, and .NET. (3) Provider Pattern Workshop — side-by-side KeyGen, Sign, Verify, Encrypt, and KEM Encapsulate examples highlighting provider registration. (4) Build vs Buy vs Open Source — evaluate sourcing tradeoffs using transparent Hub teaching weights and fictional planning scenarios. (5) PQC Library Explorer — inspect 8 open-source PQC libraries (liboqs, AWS-LC, Bouncy Castle, pqcrypto, PQClean, BoringSSL, wolfSSL, Botan) for algorithm coverage and FIPS status. (6) PQC Support Matrix — interactive API × Algorithm support table with version floors and code snippets. (7) Crypto Agility Patterns — five design patterns for algorithm-agile code. (8) Migration Decision Lab — stack-based decision wizard with before/after refactoring examples and cross-API interop patterns.',
  },
}
