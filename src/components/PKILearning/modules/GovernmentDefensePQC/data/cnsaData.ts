// SPDX-License-Identifier: AGPL-3.0-only
/**
 * CNSA 1.0 → CNSA 2.0 suite data.
 *
 * Every figure here is transcribed from cached evidence, not recalled:
 *  - NSA CNSA 2.0 Advisory (PP-22-1338, Sep 2022 Ver 1.0)  → library `NSA CNSA 2.0`
 *  - CNSA 2.0 and Quantum Computing FAQ (U/OO/6072712-26 | PP-26-3194,
 *    October 2026 Ver 2.2)                                 → library `NSA CNSA 2.0 FAQ`
 *
 * The FAQ is the fresher of the two and is where the dated milestones live;
 * the advisory is where the algorithm selections live.
 */

export interface SuiteAlgorithm {
  purpose: string
  cnsa1: string
  cnsa2: string
  /** why the CNSA 2.0 choice is what it is, per the advisory's own reasoning */
  rationale: string
}

/**
 * The side-by-side that makes the crypto-agility argument concrete: the same
 * suite, one revision apart, with every public-key line replaced.
 */
export const SUITE_COMPARISON: SuiteAlgorithm[] = [
  {
    purpose: 'Software & firmware signing',
    cnsa1: 'RSA-3072 / ECDSA P-384',
    cnsa2: 'LMS or XMSS (NIST SP 800-208); ML-DSA-87 also approved',
    rationale:
      'NSA moved this use case first, for three stated reasons: NIST had already standardised the algorithms, the use case is more urgent than others, and stateful hash-based signatures have the longest cryptanalytic history — their performance costs matter least here. LMS and XMSS are the approved SP 800-208 schemes (all parameter sets; NSA recommends LMS with SHA-256/192); the multi-tree variants HSS and XMSS^MT are not allowed. Validated ML-DSA-87 is also approved for software and firmware signing, but NSA wants LMS and XMSS adopted now where possible because validated implementations have been available longer. ML-DSA can make sense when a signing strategy needs more signatures than a single LMS or XMSS key can reasonably provide, or in distributed signing environments.',
  },
  {
    purpose: 'Key establishment',
    cnsa1: 'ECDH P-384 / RSA-3072',
    cnsa2: 'ML-KEM-1024 (FIPS 203)',
    rationale:
      'Level-5 parameters only. CNSA 2.0 does not offer the lower ML-KEM parameter sets that FIPS 203 defines — an NSS-specific narrowing of the standard.',
  },
  {
    purpose: 'Digital signatures (general use)',
    cnsa1: 'ECDSA P-384 / RSA-3072',
    cnsa2: 'ML-DSA-87 (FIPS 204)',
    rationale:
      'Again level-5 only. ML-DSA-44 and ML-DSA-65 are FIPS-approved but not CNSA 2.0-approved. ML-DSA-87 is approved for any signing use case, including software and firmware.',
  },
  {
    purpose: 'Symmetric encryption',
    cnsa1: 'AES-256',
    cnsa2: 'AES-256',
    rationale:
      'Unchanged. Grover gives at most a quadratic speed-up, so a 256-bit key retains a 128-bit security margin. The advisory describes this section as only a modest change from CNSA 1.0, allowing a little more flexibility.',
  },
  {
    purpose: 'Hashing',
    cnsa1: 'SHA-384',
    cnsa2: 'SHA-384 or SHA-512',
    rationale:
      'Symmetric primitives survive the transition. This is the part of the estate that does not need replacing — worth knowing before budgeting to replace it.',
  },
]

export interface CnsaMilestone {
  date: string
  requirement: string
  source: string
}

/**
 * Dated milestones, quoted from the October 2026 FAQ (Ver 2.2), which states
 * the CNSSP 15 dates; the 2016 edition of CNSSP 15 does not carry them. These replaced the per-equipment-type timetable (2025 to
 * 2033) that the 2022 advisory carried, which is itself a useful thing for a
 * learner to see — the deadline moved because the policy was revised, not
 * because anyone missed it.
 */
export const CNSA_MILESTONES: CnsaMilestone[] = [
  {
    date: '1 January 2027',
    requirement: 'CNSA 2.0 algorithms will be required in all new acquisitions for NSS.',
    source: 'CNSSP 15, as stated in CNSA 2.0 FAQ Ver 2.2 (October 2026)',
  },
  {
    date: '31 December 2030',
    requirement:
      'All NSS equipment and services that cannot support CNSA 2.0 must be phased out unless otherwise granted an exception. NSA also expects encryption to be broadly quantum resistant by default by this date.',
    source: 'CNSSP 15, as stated in CNSA 2.0 FAQ Ver 2.2 (October 2026)',
  },
  {
    date: '31 December 2031',
    requirement:
      'CNSA 2.0 algorithms are mandated for use, unless otherwise noted, to achieve full quantum resistance for NSS.',
    source: 'CNSSP 15, as stated in CNSA 2.0 FAQ Ver 2.2 (October 2026)',
  },
  {
    date: '2035',
    requirement:
      'The goal set in NSM-10 for achieving quantum resistance. NSA intends that all NSS will be quantum-resistant well ahead of 2035.',
    source: 'NSM-10, as described in CNSA 2.0 FAQ Ver 2.2 (October 2026)',
  },
]

/**
 * NSA's hybrid position, stated carefully — it is routinely reported as a ban
 * and it is not one. Quoted and paraphrased from the FAQ's "Hybrids" section.
 */
export const CNSA_HYBRID_POSITION =
  'NSA "has confidence in CNSA 2.0 algorithms and will not require NSS developers to use hybrid certified products for security purposes." That is a decision not to *require* hybrids — not a prohibition. The FAQ explicitly allows that "product availability and interoperability requirements may lead to adopting hybrid solutions," and acknowledges that some protocols may need hybrid-like constructions simply to carry the larger ML-KEM-1024 and ML-DSA-87 objects.'

/**
 * The stated downsides — worth teaching because they are the strongest
 * published argument against the hybrid-by-default posture most of the
 * commercial world has adopted, and learners meet the opposite advice
 * elsewhere in this catalogue (see the Hybrid Cryptography module).
 */
export const CNSA_HYBRID_OBJECTIONS = [
  'Added protocol and library complexity: extra negotiation, extra error handling, modified APIs, more testing.',
  'Interoperability gets harder, not easier — every party must share both the component algorithms and the hybridisation method.',
  'It buys a second transition later, when classical components are eventually dropped.',
  'More security products fail from implementation flaws than from cryptanalysis, so added complexity is itself a risk.',
]

/**
 * A detail that makes the freshness point better than any lecture could: the
 * September 2022 advisory names the algorithms CRYSTALS-Kyber and
 * CRYSTALS-Dilithium, because FIPS 203/204 did not exist yet. The October
 * 2026 FAQ (Ver 2.2) calls the same algorithms ML-KEM-1024 and ML-DSA-87. Same suite,
 * same requirement, two vocabularies — and a search for "Kyber" in your own
 * estate will not find documents written after standardisation.
 */
export const CNSA_NAMING_DRIFT = {
  advisory2022: ['CRYSTALS-Kyber', 'CRYSTALS-Dilithium'],
  faq2024: ['ML-KEM-1024', 'ML-DSA-87'],
  note: 'The advisory predates FIPS 203/204 final. Both documents remain current and in force; only the naming changed.',
}
