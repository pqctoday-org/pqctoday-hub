// SPDX-License-Identifier: GPL-3.0-only

// ── Homomorphic Encryption (FHE) — context data for the Learn tab ─────────
// What "fully homomorphic" promises, where FHE is used, what it costs, how the
// cost is being reduced, and where FHE stands in standards and compliance.
// Every quote below was checked against the cited page on 2026-10-10. Figures
// are as reported by each source, on that source's own baseline; they are not
// our measurements and must not be compared or multiplied across rows.

/** The 2–3 line summary at the top of every Learn section, in reading order. */
export const TAKEAWAYS = {
  fundamentals: [
    'FHE lets a server compute on data it only ever sees encrypted: the trust moves from hardware to mathematics.',
    '“Fully” means any computation can in principle be evaluated, not that every computation is exact, fast or verified.',
  ],
  schemes: [
    'Each scheme fits a data type: BFV/BGV for exact integers, CKKS for approximate real numbers, TFHE for comparisons and lookup logic.',
    'CKKS works like fixed-point arithmetic: every result carries noise and is correct only to a number of bits, so read it by rounding.',
  ],
  useCases: [
    'FHE is in production for private lookups; most other uses are peer-reviewed studies, pilots or research.',
    'The sources show it used where a small query or simple computation can wait seconds to hours, and the data could not otherwise be shared.',
  ],
  cost: [
    'FHE costs thousands of times or more the time of computing in the clear, depending on the workload and the source.',
    'GPUs, FPGAs, purpose-built chips and better algorithms reduce it; reported speedups use different baselines and do not multiply.',
  ],
  keys: [
    'One small secret key, and public evaluation keys that can reach gigabytes and need integrity protection.',
    'AES data enters FHE only through transciphering: the server runs the cipher’s decryption inside FHE.',
  ],
  quantum: [
    'Lattice-based FHE has no known quantum break.',
    'The parts around the scheme (key exchange, signatures on the key set) are usually still classical and need a post-quantum fix.',
  ],
  standards: [
    'No FHE scheme is FIPS-approved, CNSA-approved or Common Criteria-certified, and ISO/IEC 28033 is not yet published.',
    'What can be validated today is the conventional cryptography around FHE, not FHE itself.',
  ],
  custody: [
    'An HSM can hold the FHE secret key, stream out even a multi-GB evaluation-key set in bounded pieces, sign it and decrypt under policy; it cannot run the homomorphic computation.',
    'Whoever may ask the HSM to decrypt can recover the key, so decryption policy, compensating controls or threshold decryption carry the security model.',
  ],
  implementations: [
    'TFHE-rs, OpenFHE, Lattigo and fhe.rs implement the draft schemes as open source; the workshop scenarios follow them.',
  ],
} satisfies Record<string, string[]>

/** One line of the "expectation the name invites → what the sources show" table. */
export interface FhePromiseRow {
  expectation: string
  sourcesShow: string
}

export const FHE_PROMISE_ROWS: FhePromiseRow[] = [
  {
    expectation: 'Any computation can run on encrypted data',
    sourcesShow:
      'In principle yes, but each scheme favours a data type. Microsoft SEAL: “For applications where exact values are necessary, the BFV and BGV schemes are more suitable”, CKKS suits real numbers, and with these schemes “encrypted comparison, sorting, or regular expressions, are in most cases not feasible”. TFHE handles comparisons and lookup logic, on small integers.',
  },
  {
    expectation: 'Results come back exact',
    sourcesShow:
      'Depends on the scheme. CKKS is “a homomorphic encryption scheme for approximate arithmetic” (Cheon, Kim, Kim & Song 2017): results are close to the true value, correct to a number of bits. BFV, BGV and TFHE return exact integers as long as the noise stays within bounds.',
  },
  {
    expectation: 'The data is protected',
    sourcesShow:
      'From the server, yes: “Any entity that has only the public and the evaluation keys cannot learn anything about the encrypted data in isolation” (ICO). But whoever holds the secret key, or may ask for decryptions, decides who sees results (section 8), and “Fully Homomorphic Encryption does not provide data integrity by design, only confidentiality” (NCSC 2025).',
  },
  {
    expectation: 'It runs at a usable speed',
    sourcesShow:
      'At a cost. The ICO describes HE as “several thousand times slower than processing plaintext”; DARPA estimated in 2021 that it was “about a million times slower” to compute in the FHE world; NIST SP 800-226 says that in most cases secure computation “is several orders of magnitude slower than native execution” and that “its performance is improving quickly” (section 4).',
  },
  {
    expectation: 'Decrypted results can be shared freely',
    sourcesShow:
      'Not without care. Decrypted CKKS results seen by others can lead to key recovery (Li & Micciancio 2021); the countermeasure, noise flooding, costs precision (Li, Micciancio, Schultz & Sorrell 2022). Exact schemes need a negligible decryption-failure probability (Cheon et al. 2024).',
  },
]

/** Which scheme fits which data, with the source that says so. */
export interface FheSchemeFitRow {
  need: string
  scheme: string
  why: string
}

export const FHE_SCHEME_FIT: FheSchemeFitRow[] = [
  {
    need: 'Exact integers: counting, matching, private lookups',
    scheme: 'BFV / BGV',
    why: '“For applications where exact values are necessary, the BFV and BGV schemes are more suitable” (Microsoft SEAL README). Apple’s private lookups use BFV.',
  },
  {
    need: 'Real numbers: statistics, machine-learning inference',
    scheme: 'CKKS',
    why: 'SEAL names CKKS for applications such as “summing up encrypted real numbers, evaluating machine learning models on encrypted data”; results are approximate.',
  },
  {
    need: 'Comparisons, branching, lookup-table logic',
    scheme: 'TFHE / CGGI',
    why: 'With BFV, BGV and CKKS, “encrypted comparison, sorting, or regular expressions, are in most cases not feasible” (SEAL README). TFHE evaluates functions through lookup tables during bootstrapping, on bits and small integers.',
  },
]

export type FheEvidenceLevel =
  | 'Production'
  | 'Peer-reviewed'
  | 'Regulator case study'
  | 'Pilot'
  | 'Vendor documentation'
  | 'Research only'

/** Where FHE is used, ranked by evidence level. Costs are as reported by each source. */
export interface FheUseCase {
  useCase: string
  level: FheEvidenceLevel
  scheme: string
  cost: string
  source: string
}

export const FHE_USE_CASES: FheUseCase[] = [
  {
    useCase:
      'Private lookups at scale (Apple: Enhanced Visual Search for photos, caller ID information, business logos in Mail, web content filtering)',
    level: 'Production',
    scheme: 'BFV',
    cost: 'No latency figures published',
    source: 'Apple Machine Learning Research, October 2024',
  },
  {
    useCase: 'Password breach check (Microsoft Edge Password Monitor)',
    level: 'Production',
    scheme: 'Microsoft SEAL (scheme not named)',
    cost: 'No latency published; the breach database is split into shards of about 60,000 credentials',
    source: 'Microsoft Research Blog, 21 January 2021',
  },
  {
    useCase: 'Private set intersection (the technique behind such breach checks)',
    level: 'Peer-reviewed',
    scheme: 'HE (SEAL)',
    cost: '5,000 × 16 million 32-bit items: 36 s online, 12.5 MB exchanged',
    source: 'Chen, Laine & Rindal, ACM CCS 2017',
  },
  {
    useCase: 'Genomics: genome-wide association study',
    level: 'Peer-reviewed',
    scheme: 'CKKS',
    cost: '100,000 individuals × 500,000 SNPs in 5.6 h on one server node',
    source: 'Blatt, Gusev, Polyakov & Goldwasser, PNAS 2020',
  },
  {
    useCase: 'Biometric 1:N search',
    level: 'Peer-reviewed',
    scheme: 'BFV',
    cost: 'Search of a 100-million-entry gallery in 500 s',
    source: 'Engelsma, Jain & Boddeti, HERS, IEEE T-BIOM',
  },
  {
    useCase: 'AI inference (image classification)',
    level: 'Peer-reviewed',
    scheme: 'Leveled HE',
    cost: '99% accuracy on MNIST; around 59,000 predictions per hour on one PC, with 250 s per prediction (4,096 run at once)',
    source: 'Gilad-Bachrach et al., CryptoNets, ICML 2016',
  },
  {
    useCase: 'AI training',
    level: 'Peer-reviewed',
    scheme: 'CKKS',
    cost: 'Logistic regression on 422,108 samples × 200 features in about 17 h; small models only',
    source: 'Han et al., AAAI 2019',
  },
  {
    useCase:
      'Financial-crime intelligence sharing across borders (nodes in the US, India and the UK, hub in Singapore)',
    level: 'Regulator case study',
    scheme: 'Not named',
    cost: 'Fastest round trip about 100 s for querying 1 million records',
    source: 'IMDA PET Sandbox, Mastercard case study',
  },
  {
    useCase: 'Official statistics',
    level: 'Pilot',
    scheme: 'HE combined with MPC and differential privacy',
    cost: 'A count in 10–11 s; a standard deviation in about 400 s',
    source: 'UN Guide on Privacy-Enhancing Technologies for Official Statistics, 2023',
  },
  {
    useCase: 'Confidential smart contracts',
    level: 'Vendor documentation',
    scheme: 'TFHE',
    cost: 'Vendor-stated: from 0.2 to over 20 transactions per second on CPU; decryption by a threshold MPC key-management service',
    source: 'Zama Protocol litepaper',
  },
  {
    useCase: 'Credit scoring and insurance',
    level: 'Research only',
    scheme: '—',
    cost: '—',
    source: 'Masters et al., IACR ePrint 2019/1113 (Real World Crypto 2020)',
  },
]

/** Claims seen online that we could not confirm from a primary source; not repeated in this module. */
export const FHE_UNCONFIRMED_CLAIMS: string[] = [
  'That Microsoft Edge’s breach check uses BFV specifically (the Microsoft post names SEAL, not the scheme)',
  'That Google Password Checkup or Private Join and Compute are FHE deployments',
  'That BIS Project Aurora, AUSTRAC/Fintel or the UK Cyber Defence Alliance use homomorphic encryption',
  'That any FHE product is “FIPS-validated FHE”, that ISO/IEC 28033 is published, or that NIST is standardizing FHE',
]

/** Reported overhead of FHE over computing in the clear. */
export interface FheOverheadQuote {
  who: string
  when: string
  quote: string
  caveat: string
}

export const FHE_OVERHEAD_QUOTES: FheOverheadQuote[] = [
  {
    who: 'ICO (UK regulator), HE guidance',
    when: 'Current guidance',
    quote: '“several thousand times slower than processing plaintext”',
    caveat: 'A general statement, not tied to one workload',
  },
  {
    who: 'DARPA, DPRIVE announcement',
    when: '2021',
    quote: '“about a million times slower”',
    caveat:
      'An estimate that motivated the programme; DPRIVE seeks FHE computation “within a factor of ten of unencrypted computations”',
  },
  {
    who: 'NIST SP 800-226',
    when: 'March 2025',
    quote:
      'in most cases, secure computation “is several orders of magnitude slower than native execution”',
    caveat: 'NIST adds that “its performance is improving quickly”',
  },
  {
    who: 'Gentry & Halevi, EUROCRYPT 2011',
    when: '2011',
    quote:
      'one bootstrapping operation took from 30 seconds (“small” setting) to 30 minutes (“large” setting) on one CPU',
    caveat:
      'An early implementation of Gentry’s scheme; later schemes and algorithms are much faster (see below)',
  },
]

/** FHE compared with other privacy-enhancing technologies. */
export interface FhePetRow {
  pet: string
  cost: string
  trust: string
}

export const FHE_PET_COMPARISON: FhePetRow[] = [
  {
    pet: 'FHE',
    cost: 'Thousands of times slower or more; large ciphertexts and keys (ICO; UN PET Guide: “message expansion, computational cost, and engineering cost”)',
    trust:
      'The mathematics, and whoever holds the secret key or may ask for decryptions. Most schemes give input privacy to a single party (UN PET Guide); no integrity of the result (NCSC)',
  },
  {
    pet: 'Trusted execution environment (TEE)',
    cost: '“small but noticeable performance penalty” (UN PET Guide)',
    trust:
      'The hardware vendor and its attestation: the “security model of TEEs is not cryptographic in nature” (UN PET Guide), and several existing enclaves have been vulnerable to data-extraction attacks (NIST SP 800-226)',
  },
  {
    pet: 'Secure multiparty computation (MPC)',
    cost: 'For general computation such as database queries, “a slowdown up to 10,000 times” (UN PET Guide), plus network rounds',
    trust: 'That the parties do not collude; the output, once revealed, is not protected by MPC',
  },
  {
    pet: 'Differential privacy (DP)',
    cost: '“The main cost of using differential privacy is a loss in terms of output accuracy” (UN PET Guide)',
    trust: 'Protects what the outputs reveal, not the inputs during computation',
  },
  {
    pet: 'Federated learning (FL)',
    cost: 'Training stays where the data is; coordination overhead',
    trust:
      'That shared model updates do not reveal the data: they “can nonetheless leak sensitive information” (UN PET Guide)',
  },
]

/** How the cost is being reduced. Speedups are against each paper's own baseline. */
export interface FheAccelerationRow {
  approach: string
  example: string
  reported: string
  status: string
}

export const FHE_ACCELERATION: FheAccelerationRow[] = [
  {
    approach: 'GPU',
    example: 'Jung et al., TCHES 2021 (CKKS)',
    reported: '257× over a single-threaded CPU implementation',
    status: 'Peer-reviewed; vendor GPU benchmark pages also exist (e.g. TFHE-rs)',
  },
  {
    approach: 'FPGA',
    example: 'FAB, HPCA 2023 (CKKS with bootstrapping)',
    reported: '213× over state-of-the-art CPU, 1.5× over GPU',
    status: 'Peer-reviewed',
  },
  {
    approach: 'FPGA',
    example: 'HEAX, ASPLOS 2020',
    reported: '164–268× “for a wide range of FHE parameters”',
    status: 'Peer-reviewed',
  },
  {
    approach: 'ASIC (simulated)',
    example: 'F1 (MICRO 2021), CraterLake (ISCA 2022), BTS (ISCA 2022), ARK (MICRO 2022)',
    reported:
      'Thousands of times over a CPU: F1 geometric mean 5,400×; CraterLake geometric mean 4,600×; BTS 5,556× on ResNet-20; ARK 18,214× on one ResNet-20 inference',
    status: 'Simulated designs, not fabricated chips',
  },
  {
    approach: 'ASIC (fabricated)',
    example: 'Intel HERACLES, ISSCC 2026',
    reported:
      '1,074 to 5,547 times as fast as an Intel Xeon CPU across seven key operations, as reported by IEEE Spectrum',
    status: 'Fabricated chip; figures as reported by the press (the ISSCC paper was not checked)',
  },
  {
    approach: 'Algorithms',
    example:
      'TFHE (Journal of Cryptology); full-RNS CKKS (SAC 2018); hybrid key switching (CT-RSA 2020); non-sparse bootstrapping (EUROCRYPT 2021)',
    reported:
      'TFHE bootstrapping from 690 ms (FHEW) to 13 ms on one core; full-RNS CKKS 17.3× faster decryption and 8.3× faster multiplication; 14.1× higher bootstrapped throughput',
    status: 'Peer-reviewed; improvements are now in the open-source libraries',
  },
]

/** One row of the standards and compliance table. */
export interface FheStandardRow {
  body: string
  coversFhe: string
  status: string
  source: string
}

export const FHE_STANDARDS: FheStandardRow[] = [
  {
    body: 'ISO/IEC 28033 (fully homomorphic encryption), parts 1–4',
    coversFhe: 'Yes',
    status:
      'Not published. Part 1 (general) and part 2 (exact arithmetic: BGV/BFV) at DIS, votes closed; part 3 (approximate numbers: CKKS) and part 4 (look-up-table evaluation) at FDIS, final ballots started 23 September (part 3) and 8 September 2026 (part 4)',
    source: 'ISO project pages for ISO/IEC 28033-1 to -4',
  },
  {
    body: 'ISO/IEC 18033-6:2019',
    coversFhe: 'Partially homomorphic only',
    status: 'Published: ElGamal and Paillier',
    source: 'ISO',
  },
  {
    body: 'HomomorphicEncryption.org Security Standard v1.1',
    coversFhe: 'Yes (community)',
    status:
      'v1.1, 21 November 2018: describes BGV, BFV and GSW, with parameter tables including post-quantum ones; CKKS is mentioned but “not described in this standard”',
    source: 'homomorphicencryption.org/standard',
  },
  {
    body: 'FIPS 140-3 (NIST SP 800-140C r2, Implementation Guidance 2.4.A)',
    coversFhe: 'No',
    status:
      'No FHE among the approved security functions; non-approved functions cannot run in a module’s approved mode',
    source: 'NIST SP 800-140C r2; FIPS 140-3 IG',
  },
  {
    body: 'CMVP certificate #5175 (an FHE-related product)',
    coversFhe: 'No',
    status:
      'DataKrypto Module for FHEnom (FIPS 140-3 Level 1, March 2026): the approved algorithms are AES, SHA-2/SHA-3, HMAC, DRBGs, RSA, ECDSA, EdDSA, key agreement and KDFs; none is FHE',
    source: 'NIST CMVP certificate #5175',
  },
  {
    body: 'NIST Privacy-Enhancing Cryptography (PEC) project, NIST IR 8214C',
    coversFhe: 'Tracked, not standardized',
    status:
      'FHE is category S5 of the threshold call, under “Special others, not specified by NIST”: “FHE is not part of NIST-standards”. The PEC project “is accompanying FHE developments and initiatives toward future useful standards”',
    source: 'NIST IR 8214C (January 2026); NIST PEC FHE page',
  },
  {
    body: 'NSA CNSA 2.0',
    coversFhe: 'No',
    status:
      'Homomorphic encryption is listed among areas that “have no generally approved solutions”; “Neither NSA nor NIST has produced standards for these areas”; NSS owners should consult NSA',
    source: 'NSA CNSA 2.0 FAQ, version 2.1, December 2024',
  },
  {
    body: 'Common Criteria',
    coversFhe: 'No',
    status: 'No protection profile or certified product found that mentions FHE',
    source: 'commoncriteriaportal.org product and protection-profile lists, checked 2026-10-10',
  },
  {
    body: 'NCSC (UK), Advanced Cryptography',
    coversFhe: 'Guidance only',
    status:
      '“there are no certification programmes for Advanced Cryptography”; FHE “does not provide data integrity by design, only confidentiality”',
    source: 'NCSC white paper, 28 April 2025',
  },
  {
    body: 'BSI TR-02102, ANSSI PG-083',
    coversFhe: 'No',
    status: 'Homomorphic encryption not covered',
    source: 'BSI TR-02102 and ANSSI PG-083, checked 2026-10-10',
  },
]

/** A reference, grouped by topic in the Learn tab's References list. */
export interface FheReference {
  text: string
  url?: string
  /** Library row id (e.g. IACR-ePrint-2020-1533); linked from the list once the row exists. */
  libraryId?: string
}

export interface FheReferenceGroup {
  topic: string
  refs: FheReference[]
}

export const FHE_REFERENCE_GROUPS: FheReferenceGroup[] = [
  {
    topic: 'Definitions, schemes and data types',
    refs: [
      {
        text: 'Gentry. Fully Homomorphic Encryption Using Ideal Lattices. STOC 2009, pp. 169–178.',
        url: 'https://dl.acm.org/doi/10.1145/1536414.1536440',
      },
      {
        text: 'Cheon, Kim, Kim, Song. Homomorphic Encryption for Arithmetic of Approximate Numbers. ASIACRYPT 2017, IACR ePrint 2016/421.',
        url: 'https://eprint.iacr.org/2016/421',
        libraryId: 'IACR-ePrint-2016-421',
      },
      {
        text: 'Lattigo v6 package documentation (CKKS: fixed-point approximate arithmetic).',
        url: 'https://pkg.go.dev/github.com/tuneinsight/lattigo/v6',
      },
      {
        text: 'Microsoft SEAL, README (choosing between BFV/BGV and CKKS).',
        url: 'https://github.com/microsoft/SEAL',
      },
      {
        text: 'Zama, Concrete ML documentation, “Key concepts” (16-bit integer limit).',
        url: 'https://docs.zama.org/concrete-ml/get-started/concepts',
      },
    ],
  },
  {
    topic: 'Decryption limits',
    refs: [
      {
        text: 'Li, Micciancio. On the Security of Homomorphic Encryption on Approximate Numbers. EUROCRYPT 2021, IACR ePrint 2020/1533.',
        url: 'https://eprint.iacr.org/2020/1533',
        libraryId: 'IACR-ePrint-2020-1533',
      },
      {
        text: 'Li, Micciancio, Schultz, Sorrell. Securing Approximate Homomorphic Encryption Using Differential Privacy. CRYPTO 2022, IACR ePrint 2022/816.',
        url: 'https://eprint.iacr.org/2022/816',
        libraryId: 'IACR-ePrint-2022-816',
      },
      {
        text: 'Bossuat, Costache, Mouchet, Nürnberger, Troncoso-Pastoriza. Accurate and Composable Noise Estimates for CKKS with Application to Exact HE Computation. IACR Communications in Cryptology 2025, IACR ePrint 2024/853.',
        url: 'https://eprint.iacr.org/2024/853',
        libraryId: 'IACR-ePrint-2024-853',
      },
      {
        text: 'Checri, Sirdey, Boudguiga, Bultel. On the practical CPAD security of “exact” and threshold FHE schemes and libraries. CRYPTO 2024, IACR ePrint 2024/116.',
        url: 'https://eprint.iacr.org/2024/116',
        libraryId: 'IACR-ePrint-2024-116',
      },
      {
        text: 'Cheon, Choe, Passelègue, Stehlé, Suvanto. Attacks Against the INDCPA-D Security of Exact FHE Schemes. ACM CCS 2024, IACR ePrint 2024/127.',
        url: 'https://eprint.iacr.org/2024/127',
        libraryId: 'IACR-ePrint-2024-127',
      },
      {
        text: 'Loftus, May, Smart, Vercauteren. On CCA-Secure Fully Homomorphic Encryption. IACR ePrint 2010/560.',
        url: 'https://eprint.iacr.org/2010/560',
        libraryId: 'IACR-ePrint-2010-560',
      },
      {
        text: 'Chenal, Tang. On Key Recovery Attacks against Existing Somewhat Homomorphic Encryption Schemes. LATINCRYPT 2014, IACR ePrint 2014/535.',
        url: 'https://eprint.iacr.org/2014/535',
        libraryId: 'IACR-ePrint-2014-535',
      },
      {
        text: 'Manulis, Nguyen. Fully Homomorphic Encryption beyond IND-CCA1 Security: Integrity through Verifiability. EUROCRYPT 2024, IACR ePrint 2024/202.',
        url: 'https://eprint.iacr.org/2024/202',
        libraryId: 'IACR-ePrint-2024-202',
      },
      {
        text: 'Bootland et al. (Zama). Threshold (Fully) Homomorphic Encryption. IACR ePrint 2025/699 (preprint).',
        url: 'https://eprint.iacr.org/2025/699',
        libraryId: 'IACR-ePrint-2025-699',
      },
      {
        text: 'Zama fhEVM documentation (zero-knowledge proofs on inputs; threshold key management); NIST Threshold Call preview TCall-1 Zama-PW01.',
      },
      {
        text: 'OpenFHE documentation, “Making CKKS More Secure” (NOISE_FLOODING_DECRYPT).',
      },
      {
        text: 'TFHE-rs documentation, “Security and cryptography” (noise, failure probability and IND-CPA-D).',
        url: 'https://docs.zama.org/tfhe-rs/get-started/security-and-cryptography',
      },
      {
        text: 'Lattigo, SECURITY.md (IND-CPA-D security, DecodePublic).',
        url: 'https://github.com/tuneinsight/lattigo/blob/main/SECURITY.md',
      },
      {
        text: 'OpenFHE, CKKS_NOISE_FLOODING.md (noise flooding and static noise estimation).',
        url: 'https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/CKKS_NOISE_FLOODING.md',
      },
      {
        text: 'OpenFHE, ckks-noise-flooding.cpp example (experimental NOISE_FLOODING_DECRYPT mode).',
        url: 'https://github.com/openfheorg/openfhe-development/blob/main/src/pke/examples/ckks-noise-flooding.cpp',
      },
    ],
  },
  {
    topic: 'Use cases',
    refs: [
      {
        text: 'Apple Machine Learning Research. Combining Machine Learning and Homomorphic Encryption in the Apple Ecosystem. October 2024.',
        url: 'https://machinelearning.apple.com/research/homomorphic-encryption',
      },
      {
        text: 'Lauter, Kannepalli, Laine, Cruz Moreno. Password Monitor: Safeguarding passwords in Microsoft Edge. Microsoft Research Blog, 21 January 2021.',
        url: 'https://www.microsoft.com/en-us/research/blog/password-monitor-safeguarding-passwords-in-microsoft-edge/',
      },
      {
        text: 'Chen, Laine, Rindal. Fast Private Set Intersection from Homomorphic Encryption. ACM CCS 2017, IACR ePrint 2017/299.',
        url: 'https://eprint.iacr.org/2017/299',
      },
      {
        text: 'Blatt, Gusev, Polyakov, Goldwasser. Secure large-scale genome-wide association studies using homomorphic encryption. PNAS 117(21), 2020.',
        url: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC7261120/',
      },
      {
        text: 'Engelsma, Jain, Boddeti. HERS: Homomorphically Encrypted Representation Search. IEEE T-BIOM 2021, arXiv 2003.12197.',
        url: 'https://arxiv.org/abs/2003.12197',
      },
      {
        text: 'Gilad-Bachrach, Dowlin, Laine, Lauter, Naehrig, Wernsing. CryptoNets. ICML 2016.',
        url: 'https://proceedings.mlr.press/v48/gilad-bachrach16.html',
      },
      {
        text: 'Han et al. Logistic Regression on Homomorphic Encrypted Data at Scale. AAAI 2019.',
        url: 'https://ojs.aaai.org/index.php/AAAI/article/view/5000',
      },
      {
        text: 'IMDA (Singapore) PET Sandbox, case study: Mastercard.',
        url: 'https://www.imda.gov.sg/-/media/imda/files/programme/pet-sandbox/imda-pet-sandbox--case-study--mastercard.pdf',
      },
      {
        text: 'Anastasia, Ho. Stepping through the looking glass of privacy-enhancing technologies. Mastercard, 1 April 2024.',
        url: 'https://www.mastercard.com/news/perspectives/2024/stepping-through-the-looking-glass-of-privacy-enhancing-technologies/',
      },
      {
        text: 'United Nations. Guide on Privacy-Enhancing Technologies for Official Statistics. 2023 (Statistics Korea, case study 11).',
        url: 'https://unstats.un.org/bigdata/task-teams/privacy/guide/2023_UN%20PET%20Guide.pdf',
      },
      {
        text: 'Zama Protocol litepaper (vendor documentation).',
        url: 'https://docs.zama.org/protocol/zama-protocol-litepaper',
      },
      {
        text: 'Masters et al. (IBM and Banco Bradesco). Real World Crypto 2020, IACR ePrint 2019/1113.',
        url: 'https://eprint.iacr.org/2019/1113',
      },
    ],
  },
  {
    topic: 'Overhead and acceleration',
    refs: [
      {
        text: 'UK Information Commissioner’s Office. Privacy-enhancing technologies: homomorphic encryption.',
        url: 'https://ico.org.uk/for-organisations/uk-gdpr-guidance-and-resources/data-sharing/privacy-enhancing-technologies/what-pets-are-there/homomorphic-encryption-he/',
      },
      {
        text: 'DARPA. DARPA Selects Researchers to Accelerate Use of Fully Homomorphic Encryption. 8 March 2021.',
        url: 'https://www.darpa.mil/news-events/2021-03-08',
      },
      {
        text: 'DARPA. Data Protection in Virtual Environments (DPRIVE) programme page.',
        url: 'https://www.darpa.mil/research/programs/data-protection-in-virtual-environments',
      },
      {
        text: 'NIST SP 800-226, Guidelines for Evaluating Differential Privacy Guarantees. March 2025.',
        url: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-226.pdf',
      },
      {
        text: 'Gentry, Halevi. Implementing Gentry’s Fully-Homomorphic Encryption Scheme. EUROCRYPT 2011, IACR ePrint 2010/520.',
        url: 'https://eprint.iacr.org/2010/520',
      },
      {
        text: 'Jung et al. Over 100x Faster Bootstrapping in Fully Homomorphic Encryption through Memory-centric Optimization with GPUs. TCHES 2021.',
        url: 'https://tches.iacr.org/index.php/TCHES/article/view/9062',
      },
      {
        text: 'Agrawal et al. FAB: An FPGA-based Accelerator for Bootstrappable Fully Homomorphic Encryption. HPCA 2023, arXiv 2207.11872.',
        url: 'https://arxiv.org/abs/2207.11872',
      },
      {
        text: 'Riazi, Laine, Pelton, Dai. HEAX: An Architecture for Computing on Encrypted Data. ASPLOS 2020, arXiv 1909.09731.',
        url: 'https://arxiv.org/abs/1909.09731',
      },
      {
        text: 'Samardzic et al. F1: A Fast and Programmable Accelerator for Fully Homomorphic Encryption. MICRO 2021, arXiv 2109.05371.',
        url: 'https://arxiv.org/abs/2109.05371',
      },
      {
        text: 'Samardzic et al. CraterLake: A Hardware Accelerator for Efficient Unbounded Computation on Encrypted Data. ISCA 2022.',
        url: 'https://people.csail.mit.edu/sanchez/papers/2022.craterlake.isca.pdf',
      },
      {
        text: 'Kim et al. BTS: An Accelerator for Bootstrappable Fully Homomorphic Encryption. ISCA 2022, arXiv 2112.15479.',
        url: 'https://arxiv.org/abs/2112.15479',
      },
      {
        text: 'Kim et al. ARK: Fully Homomorphic Encryption Accelerator with Runtime Data Generation and Inter-Operation Key Reuse. MICRO 2022, arXiv 2205.00922.',
        url: 'https://arxiv.org/abs/2205.00922',
      },
      {
        text: 'Moore. IEEE Spectrum article on Intel’s Heracles FHE chip, 10 March 2026.',
        url: 'https://spectrum.ieee.org/fhe-intel',
      },
      {
        text: 'Chillotti, Gama, Georgieva, Izabachène. TFHE: Fast Fully Homomorphic Encryption over the Torus. Journal of Cryptology 2020, IACR ePrint 2018/421.',
        url: 'https://eprint.iacr.org/2018/421',
        libraryId: 'IACR-ePrint-2018-421',
      },
      {
        text: 'Cheon, Han, Kim, Kim, Song. A Full RNS Variant of Approximate Homomorphic Encryption. SAC 2018, IACR ePrint 2018/931.',
        url: 'https://eprint.iacr.org/2018/931',
      },
      {
        text: 'Bossuat, Mouchet, Troncoso-Pastoriza, Hubaux. Efficient Bootstrapping for Approximate Homomorphic Encryption with Non-Sparse Keys. EUROCRYPT 2021, IACR ePrint 2020/1203.',
        url: 'https://eprint.iacr.org/2020/1203',
        libraryId: 'IACR-ePrint-2020-1203',
      },
      {
        text: 'Bossuat, Troncoso-Pastoriza, Hubaux. Bootstrapping for Approximate Homomorphic Encryption with Negligible Failure-Probability by Using Sparse-Secret Encapsulation. IACR ePrint 2022/024 (source of the N16QP1546H192H32 parameter set used in the workshop’s CKKS measurements).',
        url: 'https://eprint.iacr.org/2022/024',
        libraryId: 'IACR-ePrint-2022-024',
      },
    ],
  },
  {
    topic: 'Standards and compliance',
    refs: [
      {
        text: 'ISO/IEC DIS 28033-1, -2 and FDIS 28033-3, -4, Information security — Fully homomorphic encryption (project pages).',
        url: 'https://www.iso.org/standard/87640.html',
      },
      {
        text: 'ISO/IEC 18033-6:2019, Encryption algorithms — Part 6: Homomorphic encryption.',
        url: 'https://www.iso.org/standard/67740.html',
      },
      {
        text: 'HomomorphicEncryption.org. Homomorphic Encryption Security Standard v1.1. 21 November 2018.',
        url: 'https://homomorphicencryption.org/standard/',
      },
      {
        text: 'NIST SP 800-140C r2, CMVP Approved Security Functions.',
        url: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-140Cr2.pdf',
      },
      {
        text: 'NIST CMVP, Implementation Guidance for FIPS 140-3 (IG 2.4.A).',
        url: 'https://csrc.nist.gov/csrc/media/Projects/cryptographic-module-validation-program/documents/fips%20140-3/FIPS%20140-3%20IG.pdf',
      },
      {
        text: 'NIST CMVP certificate #5175, DataKrypto Module for FHEnom.',
        url: 'https://csrc.nist.gov/projects/cryptographic-module-validation-program/certificate/5175',
      },
      {
        text: 'Brandão, Peralta. NIST IR 8214C, NIST First Call for Multi-Party Threshold Schemes. January 2026.',
        url: 'https://nvlpubs.nist.gov/nistpubs/ir/2026/NIST.IR.8214C.pdf',
      },
      {
        text: 'NIST Privacy-Enhancing Cryptography project, FHE page.',
        url: 'https://csrc.nist.gov/projects/pec/fhe',
      },
      {
        text: 'NSA. CNSA 2.0 FAQ, version 2.1, December 2024.',
        url: 'https://media.defense.gov/2022/Sep/07/2003071836/-1/-1/1/CSI_CNSA_2.0_FAQ_.PDF',
      },
      {
        text: 'UK NCSC. Advanced Cryptography white paper, version 1.0, 28 April 2025.',
        url: 'https://www.ncsc.gov.uk/whitepaper/advanced-cryptography',
      },
      {
        text: 'EDPB. Guidelines 02/2026 on anonymisation, version 1.0 for public consultation, adopted 7 July 2026 (paragraph 91).',
        url: 'https://www.edpb.europa.eu/public-consultations/guidelines-022026-on-anonymisation_en',
      },
    ],
  },
]
