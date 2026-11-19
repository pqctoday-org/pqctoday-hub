// SPDX-License-Identifier: AGPL-3.0-only
/**
 * Structured content for the PqcImplementationSecurity module (LM-081).
 * New module: do not set lastReviewed until an editorial review entry exists in revisions.jsonl.
 */
import type { ModuleContent } from '@/types/ModuleContentTypes'
import { CNSA_2_0, NIST_DEPRECATION } from '@/data/regulatoryTimelines'
import { getAlgorithm } from '@/data/algorithmProperties'
import { getStandard } from '@/data/standardsRegistry'

export const content: ModuleContent = {
  moduleId: 'pqc-implementation-security',
  version: '1.0.0',
  lastEdited: '2026-11-18',

  standards: [
    getStandard('FIPS 203'),
    getStandard('FIPS 204'),
    getStandard('FIPS 205'),
    getStandard('FIPS 202'),
    getStandard('FIPS-140-3-STANDARD'),
    getStandard('NIST-FIPS140-3-IG-PQC'),
    getStandard('NIST-SP-800-140F'),
    getStandard('ISO-IEC-19790-2025'),
    getStandard('CIR-EU-2024-482-EUCC-Cybersecurity-Certification-Scheme'),
    getStandard('NIST IR 8547'),
    getStandard('NIST SP 800-227'),
    getStandard('PROACT-2025-SCA-Lattice-PQC'),
  ],

  algorithms: [
    getAlgorithm('ML-KEM-768'),
    getAlgorithm('ML-DSA-65'),
    getAlgorithm('SLH-DSA-SHA2-128s'),
  ],

  deadlines: [
    {
      label: 'FIPS 140-2 moved to Historical status; new acquisitions require FIPS 140-3',
      year: 2026,
      source: 'NIST CMVP (Sept 2026)',
    },
    {
      label: 'CNSA 2.0 required in new NSS acquisitions',
      year: CNSA_2_0.networkingRequired,
      source: 'CNSA 2.0 FAQ v2.2 (Oct 2026)',
    },
    {
      label: 'NIST: deprecate quantum-vulnerable public-key cryptography (RSA, ECC)',
      year: NIST_DEPRECATION.deprecateClassical,
      source: 'NIST IR 8547 (final, Oct 2026)',
    },
    {
      label: 'NIST: disallow classical public-key cryptography',
      year: NIST_DEPRECATION.disallowClassical,
      source: 'NIST IR 8547 (final, Oct 2026)',
    },
  ],

  narratives: {
    overview:
      'PQC Implementation Security & Side-Channel Resistance equips developers, cryptographic researchers, and certification engineers to identify and mitigate physical and microarchitectural leakage in FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), and FIPS 205 (SLH-DSA) implementations. Passing ACVP functional known-answer tests only proves mathematical correctness — production security requires constant-time execution, compliant Fujisaki-Okamoto implicit rejection, appropriately budgeted masking and fault countermeasures, and rigorous TVLA, FIPS 140-3, and EUCC evaluation evidence.',
    constantTimePqc:
      'Post-quantum lattice schemes introduce distinct timing side channels compared to RSA and ECC. KyberSlash demonstrated that compiling a seemingly harmless division by q = 3329 during ML-KEM message compression/decompression into variable-latency hardware division instructions (DIV/SDIV) leaks secret key bits across decapsulation calls. In ML-DSA signing, branching early on rejection-sampling norm bounds or indexing lookup tables with secret polynomial coefficients leaks masking vector y and ultimately secret vectors s1/s2. Constant-time Barrett or Montgomery multiply-shift reductions, branchless bound masks, and disassembly-level compiler verification are mandatory.',
    foImplicitRejection:
      'FIPS 203 ML-KEM.Decaps relies on the Fujisaki-Okamoto (FO) transform to achieve IND-CCA2 security. After decrypting c to candidate message m′, decapsulation re-encrypts m′ to c′ and compares c against c′ in constant time. On mismatch, ML-KEM.Decaps must NOT return an error code or abort early; instead it uses a constant-time conditional move (cmov) to return a pseudorandom key K̄ = J(z || c) derived from the secret implicit-rejection seed z. Any timing delta, early-exit memcmp, or distinct API error turns decapsulation into a chosen-ciphertext oracle.',
    maskingAndFaults:
      'Embedded targets, HSMs, and smart cards exposed to physical power, electromagnetic (EM), or fault-injection (FI) adversaries require countermeasures beyond constant-time software. Linear operations such as the Number Theoretic Transform (NTT) mask cheaply with arithmetic shares, whereas non-linear steps — arithmetic-to-Boolean (A2B/B2A) conversions, centered binomial sampling, rejection checks, and the Keccak/SHAKE (FIPS 202) Chi layer — dominate cycle, RAM, and fresh-randomness budgets. Redundant verification (re-verifying ML-DSA/SLH-DSA signatures or checking decapsulation invariants) and random operation shuffling defend against clock/voltage glitches and laser faults.',
    tvlaAndCertification:
      'Test Vector Leakage Assessment (TVLA) applies Welch’s t-test between fixed and random input trace sets; exceeding |t| > 4.5 flags statistically significant side-channel leakage with high confidence, but TVLA is a screening test — a failure indicates leakage without by itself quantifying key-recovery complexity, and a pass on first-order univariate tests does not rule out higher-order, multivariate, or template attacks. For certification, FIPS 140-3 non-invasive attack mitigation references ISO/IEC 19790, ISO/IEC 17825, NIST SP 800-140F, and FIPS 140-3 IG PQC, while EUCC (Commission Implementing Regulation (EU) 2024/482) evaluates high-resistance targets under AVA_VAN.4 and AVA_VAN.5.',
    workshopSummary:
      'Four interactive steps: (1) Timing Leak Inspector comparing vulnerable vs. constant-time ML-KEM and ML-DSA code patterns with verification tooling; (2) FO Implicit Rejection Lab stepping through valid vs. tampered ML-KEM.Decaps traces and broken error-oracle behavior; (3) Masking & Fault Cost Explorer examining illustrative order-of-magnitude cycle, RAM, and randomness trade-offs across masking orders and fault defenses; (4) TVLA & Certification Evidence Scope checklist enforcing Yes/No/Unknown triage where unanswered items never imply low exposure.',
    relatedStandards:
      'FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 202 (SHA-3 / SHAKE), FIPS 140-3 (ISO/IEC 19790:2025, ISO/IEC 17825, NIST SP 800-140F, FIPS 140-3 IG PQC), EUCC CIR (EU) 2024/482 (AVA_VAN.4 / AVA_VAN.5), NIST SP 800-227 (KEM Recommendations), NIST IR 8547.',
  },
}
