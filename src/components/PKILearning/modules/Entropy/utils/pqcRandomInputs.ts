// SPDX-License-Identifier: GPL-3.0-only
/**
 * Canonical data: the random inputs each PQC operation draws, and the RBG
 * security-strength rule FIPS 203 / 204 / 205 attach to them.
 *
 * Every value here was checked on 2026-09-24 against the final PDFs
 * (FIPS 203, 204 and 205, all published 2024-08-13) and the CSRC errata
 * spreadsheets. The `quote` fields are verbatim sentences from those PDFs.
 * The Learn panel renders from this file; summaries and QA text must agree
 * with it. Do not restate these rules in prose elsewhere — import them.
 *
 * Key points the data encodes (and that earlier copy got wrong):
 *  - A 32-byte random input does NOT mean 32 bytes of entropy or a
 *    256-bit RBG. The RBG strength is set per parameter set.
 *  - ML-DSA-44 has a split rule: shall be >= 128 bits, should be >= 192 bits.
 *  - Hedged-signing randomness (ML-DSA `rnd`, SLH-DSA `addrnd`) has no
 *    mandatory RBG strength: it "should ideally" come from an approved RBG.
 */

/** Normative strength of a rule, as worded in the standard. */
export type RuleLevel = 'shall' | 'should'

export interface RbgStrengthRule {
  /** Parameter set(s) the rule applies to. */
  parameterSets: string[]
  /** Minimum RBG security strength in bits. */
  minBits: number
  level: RuleLevel
}

export interface SourceQuote {
  /** e.g. "FIPS 203 §3.3" */
  section: string
  /** Verbatim sentence from the final PDF. */
  quote: string
}

export interface PqcRandomInput {
  id: string
  standard: 'FIPS 203' | 'FIPS 204' | 'FIPS 205'
  operation: string
  /** Symbols of the random values drawn by the operation. */
  inputs: string[]
  /** Length of each input, as the standard states it. */
  length: string
  /**
   * Minimum RBG security strength rules. Empty when the standard sets no
   * mandatory strength (hedged signing) or no fresh randomness is drawn.
   */
  strengthRules: RbgStrengthRule[]
  /** One-line statement of the rule, for display. */
  ruleSummary: string
  /** Extra facts a learner needs (derivation, where it must be generated). */
  notes: string
  sources: SourceQuote[]
}

export const PQC_RANDOM_INPUTS: readonly PqcRandomInput[] = [
  {
    id: 'ml-kem-keygen',
    standard: 'FIPS 203',
    operation: 'ML-KEM.KeyGen',
    inputs: ['d', 'z'],
    length: '32 bytes each',
    strengthRules: [
      { parameterSets: ['ML-KEM-512'], minBits: 128, level: 'shall' },
      { parameterSets: ['ML-KEM-768'], minBits: 192, level: 'shall' },
      { parameterSets: ['ML-KEM-1024'], minBits: 256, level: 'shall' },
    ],
    ruleSummary:
      'Approved RBG (SP 800-90A/B/C) with security strength of at least 128 / 192 / 256 bits for ML-KEM-512 / 768 / 1024.',
    notes:
      'Fresh bytes for every invocation. If random bit generation fails, KeyGen returns an error indication. The seed (d, z) can compute the decapsulation key, so it shall be protected like one.',
    sources: [
      {
        section: 'FIPS 203 §3.3',
        quote:
          'These random bytes shall be generated using an approved RBG, as prescribed in SP 800-90A, SP 800-90B, and SP 800-90C [18, 19, 20]. Moreover, this RBG shall have a security strength of at least 128 bits for ML-KEM-512, at least 192 bits for ML-KEM-768, and at least 256 bits for ML-KEM-1024.',
      },
      {
        section: 'FIPS 203 §7.1, Algorithm 19',
        quote: '𝑑 is 32 random bytes (see Section 3.3) … 𝑧 is 32 random bytes (see Section 3.3)',
      },
      {
        section: 'FIPS 203 §7.1',
        quote:
          'As the seed can be used to compute the decapsulation key, it is sensitive data and shall be treated with the same safeguards as a decapsulation key (see SP 800-227 [1]).',
      },
      {
        section: 'FIPS 203 §8, Table 2',
        quote:
          'Each parameter set is associated with a required security strength for randomness generation (see Section 3.3).',
      },
    ],
  },
  {
    id: 'ml-kem-encaps',
    standard: 'FIPS 203',
    operation: 'ML-KEM.Encaps',
    inputs: ['m'],
    length: '32 bytes',
    strengthRules: [
      { parameterSets: ['ML-KEM-512'], minBits: 128, level: 'shall' },
      { parameterSets: ['ML-KEM-768'], minBits: 192, level: 'shall' },
      { parameterSets: ['ML-KEM-1024'], minBits: 256, level: 'shall' },
    ],
    ruleSummary: 'Same rule as KeyGen (FIPS 203 §3.3 covers both algorithms).',
    notes:
      'A fresh m for every call. If random bit generation fails, Encaps returns an error indication.',
    sources: [
      {
        section: 'FIPS 203 §3.3',
        quote: 'A fresh string of random bytes must be generated for every such invocation.',
      },
      {
        section: 'FIPS 203 §3.3',
        quote:
          'Two algorithms in this standard require the generation of randomness as an internal step: ML-KEM.KeyGen and ML-KEM.Encaps.',
      },
      {
        section: 'FIPS 203 §7.2, Algorithm 20',
        quote: '𝑚 is 32 random bytes (see Section 3.3)',
      },
    ],
  },
  {
    id: 'ml-dsa-keygen',
    standard: 'FIPS 204',
    operation: 'ML-DSA.KeyGen',
    inputs: ['ξ'],
    length: '32 bytes',
    strengthRules: [
      { parameterSets: ['ML-DSA-44'], minBits: 128, level: 'shall' },
      { parameterSets: ['ML-DSA-44'], minBits: 192, level: 'should' },
      { parameterSets: ['ML-DSA-65'], minBits: 192, level: 'shall' },
      { parameterSets: ['ML-DSA-87'], minBits: 256, level: 'shall' },
    ],
    ruleSummary:
      'Approved RBG, fresh seed. ML-DSA-65: shall be ≥ 192 bits. ML-DSA-87: shall be ≥ 256 bits. ML-DSA-44: shall be ≥ 128 bits and should be ≥ 192 bits; with a 128–191-bit RBG its claimed strength drops from category 2 to category 1.',
    notes:
      'ρ, ρ′ and K are derived from ξ inside ML-DSA.KeyGen_internal (Algorithm 6); they are not separate random inputs.',
    sources: [
      {
        section: 'FIPS 204 §3.6.1',
        quote:
          'The seed 𝜉 shall be a fresh (i.e., not previously used) random value generated using an approved RBG, as prescribed in SP 800-90A, SP 800-90B, and SP 800-90C [19, 20, 21]. Moreover, the RBG used shall have a security strength of at least 192 bits for ML-DSA-65 and 256 bits for ML-DSA-87. For ML-DSA-44, the RBG should have a security strength of at least 192 bits and shall have a security strength of at least 128 bits.',
      },
      {
        section: 'FIPS 204 §3.6.1',
        quote:
          'If an approved RBG with at least 128 bits of security but less than 192 bits of security is used, then the claimed security strength of ML-DSA-44 is reduced from category 2 to category 1.',
      },
      {
        section: 'FIPS 204 §6.1, Algorithm 6',
        quote:
          '(𝜌, 𝜌′ , 𝐾) ∈ 𝔹32 × 𝔹64 × 𝔹32 ← H(𝜉||IntegerToBytes(𝑘, 1)||IntegerToBytes(ℓ, 1), 128)',
      },
    ],
  },
  {
    id: 'ml-dsa-sign-hedged',
    standard: 'FIPS 204',
    operation: 'ML-DSA.Sign (hedged, the default)',
    inputs: ['rnd'],
    length: '32 bytes',
    strengthRules: [],
    ruleSummary:
      'No mandatory RBG strength. rnd should ideally come from an approved RBG; other methods for fresh random values may be used.',
    notes:
      'rnd shall be generated by the cryptographic module that runs ML-DSA.Sign_internal. Its main purpose is side-channel and fault-attack countermeasures.',
    sources: [
      {
        section: 'FIPS 204 §3.6.1',
        quote:
          'While this value should ideally be generated by an approved RBG, other methods for generating fresh random values may be used.',
      },
      {
        section: 'FIPS 204 §3.6.1',
        quote:
          'For this purpose, even a weak RBG may be preferable to the fully deterministic variants of Algorithms 2 and 4.',
      },
      {
        section: 'FIPS 204 §5.4',
        quote:
          'If the default “hedged” variant of is used, the 32-byte random value 𝑟𝑛𝑑 shall be generated by the cryptographic module that generates the signature (i.e., that runs ML-DSA.Sign_internal).',
      },
    ],
  },
  {
    id: 'ml-dsa-sign-deterministic',
    standard: 'FIPS 204',
    operation: 'ML-DSA.Sign (deterministic variant)',
    inputs: ['rnd'],
    length: '32 bytes, fixed to {0}^32',
    strengthRules: [],
    ruleSummary: 'No fresh randomness: rnd is the all-zero 32-byte string.',
    notes:
      'The hedged variant is the default. FIPS 204 says even a weak RBG may be preferable to the deterministic variant, because rnd exists to support side-channel and fault-attack countermeasures.',
    sources: [
      {
        section: 'FIPS 204 §5.2',
        quote:
          'If the deterministic variant is desired, then 𝑟𝑛𝑑 is set to the fixed zero string {0}32 .',
      },
      {
        section: 'FIPS 204 §3.6.1',
        quote:
          'For this purpose, even a weak RBG may be preferable to the fully deterministic variants of Algorithms 2 and 4.',
      },
    ],
  },
  {
    id: 'slh-dsa-keygen',
    standard: 'FIPS 205',
    operation: 'slh_keygen',
    inputs: ['SK.seed', 'SK.prf', 'PK.seed'],
    length: 'n bytes each (n = 16, 24 or 32)',
    strengthRules: [
      { parameterSets: ['SLH-DSA-*-128s', 'SLH-DSA-*-128f'], minBits: 128, level: 'shall' },
      { parameterSets: ['SLH-DSA-*-192s', 'SLH-DSA-*-192f'], minBits: 192, level: 'shall' },
      { parameterSets: ['SLH-DSA-*-256s', 'SLH-DSA-*-256f'], minBits: 256, level: 'shall' },
    ],
    ruleSummary:
      'Approved RBG, fresh values, security strength of at least 8n bits (128 / 192 / 256 for n = 16 / 24 / 32).',
    notes: 'n comes from FIPS 205 Table 2: 16 for the -128 sets, 24 for -192, 32 for -256.',
    sources: [
      {
        section: 'FIPS 205 §3.1',
        quote:
          'For each invocation of key generation, each of these values shall be a fresh (i.e., not previously used) random value generated using an approved random bit generator (RBG), as prescribed in SP 800-90A, SP 800-90B, and SP 800-90C [14, 15, 16]. Moreover, the RBG used shall have a security strength of at least 8𝑛 bits.',
      },
    ],
  },
  {
    id: 'slh-dsa-sign',
    standard: 'FIPS 205',
    operation: 'slh_sign (hedged / deterministic)',
    inputs: ['addrnd (hedged)', 'PK.seed as opt_rand (deterministic)'],
    length: 'n bytes',
    strengthRules: [],
    ruleSummary:
      'Hedged: addrnd should ideally come from an approved RBG; other methods may be used. Deterministic: no fresh randomness (opt_rand = PK.seed).',
    notes: 'addrnd shall be generated by the cryptographic module that runs slh_sign_internal.',
    sources: [
      {
        section: 'FIPS 205 §9.2',
        quote:
          'While 𝑎𝑑𝑑𝑟𝑛𝑑 should ideally be generated by an approved random bit generator, other methods for generating fresh random values may be used.',
      },
      {
        section: 'FIPS 205 §9.2',
        quote:
          'For the deterministic variant, 𝑎𝑑𝑑𝑟𝑛𝑑 is not provided as an input, and 𝑜𝑝𝑡_𝑟𝑎𝑛𝑑 is set to PK.seed, which results in signing being deterministic',
      },
      {
        section: 'FIPS 205 §10.2',
        quote:
          'If the default hedged variant of slh_sign_internal is used, the 𝑛-byte random value 𝑎𝑑𝑑𝑟𝑛𝑑 shall be generated by the cryptographic module that runs slh_sign_internal.',
      },
    ],
  },
]

/** Errata state of the three standards, as recorded on the check date. */
export const PQC_ERRATA_STATE = {
  checkedOn: '2026-09-24',
  entries: [
    {
      standard: 'FIPS 203',
      state:
        'Planning note 2025-11-17; errata spreadsheet lists 2 items (Appendix A zeta table, a comment in Algorithm 15). Neither touches the RBG rules.',
      url: 'https://csrc.nist.gov/pubs/fips/203/final',
    },
    {
      standard: 'FIPS 204',
      state:
        'Planning note 2026-07-31; errata spreadsheet lists 12 items. None changes an RBG strength rule; one (2025-12-02, Sec. 5) changes the notation for an RBG failure from NULL to ⊥.',
      url: 'https://csrc.nist.gov/pubs/fips/204/final',
    },
    {
      standard: 'FIPS 205',
      state: 'No planning note or errata listed.',
      url: 'https://csrc.nist.gov/pubs/fips/205/final',
    },
  ],
} as const
