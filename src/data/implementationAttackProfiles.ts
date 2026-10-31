// SPDX-License-Identifier: AGPL-3.0-only
// Implementation / side-channel attack profiles — the single source of truth for
// the Algorithms "Implementation Attacks" view AND the Threats cross-link.
// Pure data (no UI imports) so consumers don't pull in the view component.

export type AttackCategory =
  | 'side-channel'
  | 'fault-injection'
  | 'rng-failure'
  | 'secret-handling'
  | 'api-misuse'
  | 'kleptography'
  | 'ai-cryptanalysis'

export interface AttackReference {
  referenceId: string
  title: string
  url: string
  localFile?: string
}

export type AttackSeverity = 'critical' | 'high' | 'medium' | 'low'

export interface AlgorithmAttackProfile {
  algorithm: string
  family: string
  attacks: {
    category: AttackCategory
    status: 'yes' | 'no' | 'unknown'
    severity?: AttackSeverity
    detail?: string
  }[]
  summary: string
  references: AttackReference[]
  /** Mitigation considerations — points to weigh, not a checklist that makes an implementation safe. */
  countermeasures?: string[]
}

/** Reader-facing name of each attack category (shared by desktop and phone views). */
export const ATTACK_CATEGORY_LABELS: Record<AttackCategory, string> = {
  'side-channel': 'Side-Channel',
  'fault-injection': 'Fault Injection',
  'rng-failure': 'RNG Failure',
  'secret-handling': 'Secret Handling',
  'api-misuse': 'API/Integration',
  kleptography: 'Kleptography',
  'ai-cryptanalysis': 'AI-Assisted Cryptanalysis',
}

/** Severity is a qualitative reading of the reviewed sources, not a CVSS score. */
export const ATTACK_SEVERITY_NOTE = 'Reported impact (PQC Today qualitative reading, not CVSS)'

export const ATTACK_PROFILES: AlgorithmAttackProfile[] = [
  {
    algorithm: 'ML-KEM / Kyber',
    family: 'Lattice-based KEM',
    summary:
      'Attacks remain effective against masked and shuffled countermeasures. Profiled deep-learning power analysis recovers shared and secret keys from first-, second- and third-order masked Kyber-768 implementations running on an ARM Cortex-M4. A practical backdoor in Kyber key generation, inserted through kleptography, has been demonstrated at the protocol level on TLS 1.3.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'critical',
        detail: 'Power/EM leakage; single-trace key recovery on unmasked implementations',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail:
          'Corrupting the random-seed pointer used in polynomial sampling, with laser fault injection on an STM32H7, can give full key and message recovery for ML-KEM, with reported success rates up to 100%. A Rowhammer-based attack on the Fujisaki-Okamoto transform recovers the long-term secret key of Kyber and Saber.',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail: 'Misconfigurations and insecure protocol usage',
      },
      {
        category: 'kleptography',
        status: 'yes',
        severity: 'critical',
        detail:
          'Practical SETUP backdoor demonstrated in key generation — the public key covertly leaks the secret key to the backdoor holder; validated end-to-end on TLS 1.3',
      },
      {
        category: 'ai-cryptanalysis',
        status: 'unknown',
      },
    ],
    countermeasures: [
      'Masking alone is not enough: a side-channel attack on a higher-order masked implementation of an IND-CCA secure lattice-based KEM has been published.',
      'Draw all randomness from an SP 800-90A DRBG seeded by an SP 800-90B-validated entropy source',
      'Source key-generation implementations only from vetted, reproducible builds — a kleptographic backdoor is invisible in the algorithm spec and only auditable in the actual code',
    ],
    references: [
      {
        referenceId: 'PROACT-2025-SCA-Lattice-PQC',
        title: 'Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)',
        url: 'https://proact-school.cs.ru.nl/assets/uploads/slides/PROACT2025.pdf',
        localFile: 'library/PROACT-2025-SCA-Lattice-PQC.pdf',
      },
      {
        referenceId: 'NIST-PQC-Seminar-FaultInjection-Lattice',
        title:
          'Practical Fault Injection Attacks on Lattice-based NIST PQC Standards (NIST Seminar)',
        url: 'https://www.nist.gov/video/pqc-seminar-practical-fault-injection-attacks-lattice-based-nist-pqc-standards-kyber-and',
        localFile: 'library/NIST-PQC-Seminar-FaultInjection-Lattice.html',
      },
      {
        referenceId: 'KLEPTO-2022-Kyber-Backdoor',
        title: 'Backdooring Post-Quantum Cryptography: Kleptographic Attacks on Lattice-based KEMs',
        url: 'https://eprint.iacr.org/2022/1681',
        localFile: 'library/KLEPTO-2022-Kyber-Backdoor.html',
      },
      {
        referenceId: 'SCA-2023-Masked-Kyber-DL',
        title:
          'A Side-Channel Attack on a Bitsliced Higher-Order Masked CRYSTALS-Kyber Implementation',
        url: 'https://eprint.iacr.org/2023/1042',
        localFile: 'library/SCA-2023-Masked-Kyber-DL.html',
      },
      {
        referenceId: 'SALSA-2022-Lattice-Transformer',
        title: 'SALSA: Attacking Lattice Cryptography with Transformers',
        url: 'https://arxiv.org/abs/2207.04785',
        localFile: 'library/SALSA-2022-Lattice-Transformer.pdf',
      },
      {
        referenceId: 'IACR-2025-2009-ML-KEM-ML-DSA-Seed-Pointer-Fault',
        title:
          'When Randomness Isn’t Random: Practical Fault Attack on Post-Quantum Lattice Standards',
        url: 'https://eprint.iacr.org/2025/2009',
      },
      {
        referenceId: 'IACR-2023-1731-LWE-KEM-Rowhammer',
        title:
          'A practical key-recovery attack on LWE-based key-encapsulation mechanism schemes using Rowhammer',
        url: 'https://eprint.iacr.org/2023/1731',
      },
      {
        referenceId: 'IACR-2022-919-Masked-LWE-KEM-SCA',
        title:
          'Side-Channel Attacks on Lattice-Based KEMs Are Not Prevented by Higher-Order Masking',
        url: 'https://eprint.iacr.org/2022/919',
      },
    ],
  },
  {
    algorithm: 'ML-DSA / Dilithium',
    family: 'Lattice-based Signature',
    summary:
      'Shares implementation characteristics with ML-KEM. Practical side-channel and fault-injection attacks demonstrated on unmasked software implementations via power/EM leakage and fault injection to manipulate internal states.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'critical',
        detail: 'Power/EM leakage; key recovery on unmasked implementations',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail: 'Fault injection manipulates internal signing states',
      },
      {
        category: 'rng-failure',
        status: 'yes',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    countermeasures: [
      "FIPS 204 specifies by default the 'hedged' variant of signing, which uses both fresh randomness and randomness derived from the message and a precomputed value in the private key.",
      'Deploy redundancy checks to detect fault injection during signing',
      'Module validation (FIPS 140-3, CAVP certificates) checks that the algorithms give correct results on the tested vectors; on its own it does not establish side-channel or fault-injection resistance, so check whether the implementation was tested against those attacks specifically',
    ],
    references: [
      {
        referenceId: 'PROACT-2025-SCA-Lattice-PQC',
        title: 'Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)',
        url: 'https://proact-school.cs.ru.nl/assets/uploads/slides/PROACT2025.pdf',
        localFile: 'library/PROACT-2025-SCA-Lattice-PQC.pdf',
      },
      {
        referenceId: 'NIST-PQC-Seminar-FaultInjection-Lattice',
        title:
          'Practical Fault Injection Attacks on Lattice-based NIST PQC Standards (NIST Seminar)',
        url: 'https://www.nist.gov/video/pqc-seminar-practical-fault-injection-attacks-lattice-based-nist-pqc-standards-kyber-and',
        localFile: 'library/NIST-PQC-Seminar-FaultInjection-Lattice.html',
      },
    ],
  },
  {
    algorithm: 'FN-DSA / Falcon',
    family: 'Lattice-based Signature (NTRU)',
    summary:
      'Constant-time software implementations exist, but devices without a floating-point unit, or with a variable-time one, are a known limitation, and a masked implementation against power analysis is still an open problem (Falcon v1.2 specification, §1).',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'critical',
        detail:
          'Floating-point Gaussian sampling: timing leaks on variable-time floating-point units; masking against power/EM analysis is still an open problem',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail:
          'Signing prepends a fresh random 320-bit salt so the same hash is never signed twice; two signatures of one hash break the security proof (Falcon v1.2 §2.2.2). A failing RNG that repeats salts removes that protection.',
      },
      {
        category: 'secret-handling',
        status: 'yes',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    countermeasures: [
      'Avoid floating-point on platforms without constant-time FP guarantees',
      'Prefer ML-DSA on constrained devices where FN-DSA side-channel hardening is impractical',
    ],
    references: [
      {
        referenceId: 'Falcon-Spec-v12',
        title: 'Falcon: Fast-Fourier Lattice-based Compact Signatures over NTRU, v1.2',
        url: 'https://falcon-sign.info/falcon.pdf',
        localFile: 'library/Falcon-Spec-v12.pdf',
      },
    ],
  },
  {
    algorithm: 'HQC',
    family: 'Code-based KEM',
    summary:
      'Timing side-channel attacks exploit compiler-emitted variable-time division instructions. A Plaintext-Checking oracle recovers secret keys quickly. The vulnerability stems from an implementation issue, not the underlying code-based scheme.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'critical',
        detail:
          'Variable-time division instructions leak timing in HQC key recovery; the reported attack needs the attacker on the same physical core as the victim.',
      },
      {
        category: 'fault-injection',
        status: 'yes',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    countermeasures: [
      'Use constant-time decoding for all error correction steps',
      'Verify constant-time behavior with tools like dudect or ctgrind',
    ],
    references: [
      {
        referenceId: 'USENIX-2024-HQC-Division-Timing',
        title: 'Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC',
        url: 'https://www.usenix.org/conference/usenixsecurity24/presentation/schr%C3%B6der',
        localFile: 'library/USENIX-2024-HQC-Division-Timing.html',
      },
    ],
  },
  {
    algorithm: 'Classic McEliece',
    family: 'Code-based KEM',
    summary:
      'Numerous side-channel and fault-injection attacks exploit vulnerable operations including additive Fast Fourier Transforms and Gaussian elimination. Hardened hardware designs have been proposed to mitigate both attack classes.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail: 'Attacks on additive FFT and Gaussian elimination',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail:
          'A key-recovery fault-injection attack on the Classic McEliece KEM has been reported. Additive FFT and Gaussian elimination are among the operations targeted by prior side-channel and fault-injection attacks on Classic McEliece.',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    countermeasures: ['Use hardened hardware implementations with SCA-resistant FFT'],
    references: [
      {
        referenceId: 'IACR-2024-1828-McEliece-SCA-Fault',
        title: 'Classic McEliece Hardware Implementation with Enhanced Side-Channel Resistance',
        url: 'https://eprint.iacr.org/2024/1828',
        localFile: 'library/IACR-2024-1828-McEliece-SCA-Fault.html',
      },
    ],
  },
  {
    algorithm: 'FrodoKEM',
    family: 'LWE-based KEM',
    summary:
      'Power-analysis and template attacks target the discrete Gaussian sampler. Rowhammer DRAM bit flips demonstrated end-to-end key recovery by forcing high-error public keys and exploiting decryption failures.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail: 'Power analysis and template attacks on discrete Gaussian sampler',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'critical',
        detail: 'Rowhammer DRAM bit flips enable end-to-end key recovery via decryption failure',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail: 'Rowhammer corrupts key-generation routine producing high-error public keys',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    countermeasures: ['Use constant-time Gaussian sampling (CDT or table-based)'],
    references: [
      {
        referenceId: 'FrodoKEM-SCA-Countermeasures-2024',
        title: 'Countermeasures against Side-Channel Attacks in FrodoKEM',
        url: 'https://doi.org/10.21203/rs.3.rs-7530666/v1',
        localFile: 'library/FrodoKEM-SCA-Countermeasures-2024.html',
      },
      {
        referenceId: 'IACR-2022-952-FrodoKEM-Rowhammer',
        title: 'When Frodo Flips: End-to-End Key Recovery on FrodoKEM via Rowhammer',
        url: 'https://eprint.iacr.org/2022/952',
        localFile: 'library/IACR-2022-952-FrodoKEM-Rowhammer.html',
      },
    ],
  },
  {
    algorithm: 'NTRU+',
    family: 'Lattice-based KEM',
    summary:
      'No implementation-attack research specific to NTRU+ was found in the sources reviewed on 2026-10-28.',
    attacks: [
      {
        category: 'side-channel',
        status: 'unknown',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    references: [
      {
        referenceId: 'MDPI-2018-NTRU-SingleTrace-SCA',
        title: 'Single Trace Side-Channel Analysis on NTRU Implementation',
        url: 'https://doi.org/10.3390/app8112014',
      },
    ],
  },
  {
    algorithm: 'SLH-DSA / SPHINCS+',
    family: 'Hash-based Signature',
    summary:
      'Rowhammer-based universal signature forgery demonstrated. DRAM bit flips during signature generation produce valid signatures without knowledge of the private key. Hash-based schemes are not immune to physical attacks: FIPS 205 §3.2 tells implementers to protect SLH-DSA against side-channel and fault attacks, citing published power-analysis and fault attacks on SPHINCS.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'medium',
        detail:
          'Differential power analysis of SPHINCS and XMSS is published; FIPS 205 §3.2 requires protecting implementations against side-channel attacks. The default hedged variant adds fresh randomness to signing for this reason.',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'critical',
        detail:
          'Rowhammer bit flips can forge signatures without the private key; the published attack is software-only (no physical access) but needs the attacker’s code to run on the same machine as the signer. Earlier fault attacks on SPHINCS are cited in FIPS 205 §3.2.',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail:
          "A weak RNG at key generation exposes the private seeds and breaks every signature; signing itself can run deterministically, so RNG failure there loses the hedged variant's side-channel protection rather than the key",
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail: 'Memory bit flips corrupt internal state during signing',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
    ],
    references: [
      {
        referenceId: 'ArXiv-2025-SLH-DSA-Rowhammer',
        title: 'SLasH-DSA: Breaking SLH-DSA Using an End-to-End Rowhammer Framework',
        url: 'https://doi.org/10.48550/arXiv.2509.13048',
        localFile: 'library/ArXiv-2025-SLH-DSA-Rowhammer.html',
      },
      {
        referenceId: 'NIST-FIPS-205',
        title: 'FIPS 205: Stateless Hash-Based Digital Signature Standard (SLH-DSA), §3.2',
        url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.205.pdf',
        localFile: 'library/FIPS_205.pdf',
      },
    ],
  },
  {
    algorithm: 'LMS / XMSS (Stateful Hash-Based)',
    family: 'Stateful Hash-based Signature',
    summary: 'State must be persistently stored and crash-safe.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'medium',
        detail:
          'Differential power analysis of XMSS is published (cited in FIPS 205 §3.2); hashing secret one-time keys is not automatically leak-free on real hardware',
      },
      {
        category: 'fault-injection',
        status: 'yes',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'yes',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'critical',
        detail:
          'Failure to update and persist state after each signature is a total break. Finite signature budget requires lifecycle planning.',
      },
    ],
    countermeasures: [
      'Use hardware-backed state storage (HSM, TPM) with atomic write guarantees',
      'Implement write-ahead logging for state updates before signing',
      'Monitor remaining signature budget; plan key rotation before exhaustion',
    ],
    references: [
      {
        referenceId: 'NIST-SP-800-208',
        title: 'NIST SP 800-208: Recommendation for Stateful HBS Schemes (LMS, XMSS)',
        url: 'https://csrc.nist.gov/pubs/sp/800/208/final',
        localFile: 'library/NIST_SP_800-208.pdf',
      },
    ],
  },
  {
    algorithm: 'Hybrid KEM (X25519+ML-KEM)',
    family: 'Hybrid KEM (PQC + Classical)',
    summary:
      'Hybrid KEMs like X25519MLKEM768 and SecP256r1MLKEM768 inherit the ML-KEM implementation attack surface for the PQC component. The classical ECDH component (X25519 or ECDH P-256/P-384) adds its own constant-time requirements. A well-designed hybrid stays secure if at least one component is secure, but only when the shared secrets go through a sound key combiner (NIST SP 800-227 §4.6 lists the approved ones). That is a confidentiality property: it does not cancel an implementation flaw in either component.',
    attacks: [
      {
        category: 'side-channel',
        status: 'unknown',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'high',
        detail:
          'NIST SP 800-227 notes that a combiner KDF(K1, K2) over only the two shared secrets does not preserve IND-CCA security when only one of the two component schemes is IND-CCA and the designer may not know which, and it encourages combiners that generically preserve IND-CCA security.',
      },
    ],
    countermeasures: [
      'Use the combiner the protocol specifies (for TLS 1.3, the ECDHE-MLKEM key-share draft feeds both secrets into the key schedule) or an approved key combiner from NIST SP 800-227 §4.6.2',
      'Ensure both components draw independent randomness from an SP 800-90A DRBG seeded by an SP 800-90B-validated entropy source',
      'Apply ML-KEM masking countermeasures to the PQC component',
    ],
    references: [
      {
        referenceId: 'EmergentMind-Nonce-Reuse-Crypto',
        title: 'Nonce Reuse in Cryptography',
        url: 'https://www.emergentmind.com/topics/nonce-reuse',
        localFile: 'library/EmergentMind-Nonce-Reuse-Crypto.html',
      },
      {
        referenceId: 'NIST-SP-800-227',
        title: 'NIST SP 800-227: Recommendations for Key-Encapsulation Mechanisms, §4.6',
        url: 'https://nvlpubs.nist.gov/nistpubs/SpecialPublications/NIST.SP.800-227.pdf',
        localFile: 'library/NIST_SP_800-227.pdf',
      },
    ],
  },
  {
    algorithm: 'Composite Signatures (ML-DSA+ECDSA)',
    family: 'Composite Signature (PQC + Classical)',
    summary:
      'Composite signature schemes like ML-DSA-44-ECDSA-P256 combine PQC and classical signatures so that both must verify. The ML-DSA component inherits lattice side-channel risks, while the ECDSA component adds critical nonce reuse vulnerability — a single ECDSA nonce reuse leaks the classical private key entirely.',
    attacks: [
      {
        category: 'side-channel',
        status: 'unknown',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'yes',
      },
    ],
    countermeasures: [
      'Use deterministic ECDSA nonces (RFC 6979) or hedged randomness',
      'Apply ML-DSA masking countermeasures to the PQC component',
      'Verify composite signature validation checks BOTH components (not OR logic)',
      'Protect both private keys equally; zeroize after use',
    ],
    references: [
      {
        referenceId: 'EmergentMind-Nonce-Reuse-Crypto',
        title: 'Nonce Reuse in Cryptography',
        url: 'https://www.emergentmind.com/topics/nonce-reuse',
        localFile: 'library/EmergentMind-Nonce-Reuse-Crypto.html',
      },
      {
        referenceId: 'Invicti-OWASP-CryptoFailures-2025',
        title: 'Cryptographic Failures: 2025 OWASP Top 10 Risk',
        url: 'https://www.invicti.com/blog/web-security/cryptographic-failures',
        localFile: 'library/Invicti-OWASP-CryptoFailures-2025.html',
      },
      {
        referenceId: 'NIST-FIPS-204',
        title: 'FIPS 204: Module-Lattice-Based Digital Signature Standard (ML-DSA), §3.4',
        url: 'https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.204.pdf',
        localFile: 'library/FIPS_204.pdf',
      },
    ],
  },
  {
    algorithm: 'RNG & API Misuse (All Algorithms)',
    family: 'Cross-cutting',
    summary:
      'Weak PRNGs, nonce reuse, and protocol misconfigurations enable key recovery and forgery. OWASP Top 10 cryptographic failures arise from misconfigurations and weak key management rather than algorithmic weaknesses.',
    attacks: [
      {
        category: 'side-channel',
        status: 'unknown',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Repeating nonces or using weak PRNG compromises semantic security',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'high',
        detail:
          'Misconfigurations, weak key management, and insecure protocol usage across all schemes',
      },
    ],
    countermeasures: [
      'Follow OWASP Cryptographic Failures guidance for integration patterns',
      "In X25519 and X448, a public key that is a point of small order removes the other party's private key from the result, so the result is the all-zero value; RFC 7748 says both sides may check for an all-zero shared secret and abort if so, for example by combining all of its bytes with OR.",
      'RFC 9180 (HPKE), section 7.1.4, goes further for X25519 and X448: recipients must check whether the Diffie-Hellman shared secret is the all-zero value and abort if so.',
      "",
    ],
    references: [
      {
        referenceId: 'EmergentMind-Nonce-Reuse-Crypto',
        title: 'Nonce Reuse in Cryptography',
        url: 'https://www.emergentmind.com/topics/nonce-reuse',
        localFile: 'library/EmergentMind-Nonce-Reuse-Crypto.html',
      },
      {
        referenceId: 'Invicti-OWASP-CryptoFailures-2025',
        title: 'Cryptographic Failures: 2025 OWASP Top 10 Risk',
        url: 'https://www.invicti.com/blog/web-security/cryptographic-failures',
        localFile: 'library/Invicti-OWASP-CryptoFailures-2025.html',
      },
      {
        referenceId: 'RFC-7748-Elliptic-Curves-for-Security',
        title: 'Elliptic Curves for Security (RFC 7748)',
        url: 'https://www.rfc-editor.org/rfc/rfc7748',
        localFile: 'library/IETF_RFC_7748.html',
      },
      {
        referenceId: 'RFC-9180-Hybrid-Public-Key-Encryption',
        title: 'Hybrid Public Key Encryption (RFC 9180)',
        url: 'https://www.rfc-editor.org/rfc/rfc9180',
        localFile: 'library/IETF_RFC_9180.html',
      },
      {
        referenceId: 'Wycheproof-Project-Test-Vectors',
        title: 'Project Wycheproof test vectors',
        url: 'https://github.com/C2SP/wycheproof',
      },
    ],
  },
  {
    algorithm: 'RSA / ECDSA (Classical)',
    family: 'Classical Public-Key',
    summary:
      'No implementation-attack research specific to RSA / ECDSA (Classical) was found in the sources reviewed on 2026-10-28.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'yes',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'yes',
      },
      {
        category: 'kleptography',
        status: 'unknown',
      },
      {
        category: 'ai-cryptanalysis',
        status: 'unknown',
      },
    ],
    references: [
      {
        referenceId: 'KLEPTO-2014-DualEC-Backdoor',
        title: 'On the Practical Exploitability of Dual EC in TLS Implementations',
        url: 'https://www.usenix.org/system/files/conference/usenixsecurity14/sec14-paper-checkoway.pdf',
        localFile: 'library/KLEPTO-2014-DualEC-Backdoor.pdf',
      },
    ],
  },
  {
    algorithm: 'AES (Classical)',
    family: 'Symmetric',
    summary:
      'Convolutional neural networks profile and defeat jitter-based hiding countermeasures without trace realignment, a foundational result that established deep learning as a practical side-channel technique, independent of any quantum computer or algorithmic weakness in AES itself.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail:
          'Power/EM leakage defeats hiding countermeasures via profiled deep-learning analysis',
      },
      {
        category: 'fault-injection',
        status: 'unknown',
      },
      {
        category: 'rng-failure',
        status: 'unknown',
      },
      {
        category: 'secret-handling',
        status: 'unknown',
      },
      {
        category: 'api-misuse',
        status: 'unknown',
      },
      {
        category: 'kleptography',
        status: 'unknown',
      },
      {
        category: 'ai-cryptanalysis',
        status: 'yes',
        severity: 'high',
        detail:
          'Convolutional neural networks profile and recover keys through jitter-based countermeasures without trace realignment (foundational deep-learning side-channel result)',
      },
    ],
    countermeasures: [
      'Evaluate implementations against profiled deep-learning attacks, not just classical DPA/CPA, during security evaluation',
    ],
    references: [
      {
        referenceId: 'SCA-2017-AES-CNN-Jitter',
        title:
          'Convolutional Neural Networks with Data Augmentation Against Jitter-Based Countermeasures',
        url: 'https://hal.science/hal-01661212',
        localFile: 'library/SCA-2017-AES-CNN-Jitter.html',
      },
    ],
  },
]

/** Classical component tokens that appear inside COMPOSITE/HYBRID profile labels
 *  (e.g. "Composite Signatures (ML-DSA+ECDSA)") but must not, on their own, match
 *  that composite profile — a bare "ECDSA" should resolve to the dedicated
 *  classical profile below, not to the PQC+classical composite one. Gated on
 *  `family` containing "Classical)" (only the two composite/hybrid entries use
 *  that convention) so this exclusion never applies to a genuinely classical,
 *  standalone profile like "RSA / ECDSA (Classical)" or "AES (Classical)". */
const CLASSICAL_ALIAS_TOKENS = new Set(['rsa', 'ecdsa', 'ecdh', 'x25519', 'ed25519', 'dh', 'aes'])
const isCompositeOrHybrid = (p: AlgorithmAttackProfile): boolean => p.family.includes('Classical)')

/**
 * Look up the implementation-attack profile whose algorithm label matches a
 * free-text name (e.g. "ML-KEM-768" -> "ML-KEM / Kyber", "AES-256" -> "AES
 * (Classical)"). Returns undefined when no profile applies — including for a
 * bare classical name like "ECDSA" or "X25519" used only as a *component* of a
 * composite/hybrid profile's label (e.g. inside "Composite Signatures
 * (ML-DSA+ECDSA)"), which must not falsely match that composite entry.
 */
export function getAttackProfile(name: string): AlgorithmAttackProfile | undefined {
  const n = name.toLowerCase().trim()
  if (n.length < 3) return undefined
  return ATTACK_PROFILES.find((p) =>
    p.algorithm
      .toLowerCase()
      .split(/[/()+]/)
      .map((s) => s.trim())
      .some(
        (alias) =>
          alias.length > 2 &&
          !(isCompositeOrHybrid(p) && CLASSICAL_ALIAS_TOKENS.has(alias)) &&
          n.includes(alias)
      )
  )
}

/**
 * Resolve a free-text replacement string (which may name several algorithms,
 * e.g. "ML-KEM-768 + X25519") into the unique attack profiles it names. Owns the
 * tokenization + de-dup so callers don't re-implement splitting.
 */
export function getAttackProfiles(freeText: string): AlgorithmAttackProfile[] {
  const byAlgorithm = new Map<string, AlgorithmAttackProfile>()
  for (const token of freeText.split(/[,+/]|\band\b/i)) {
    const profile = getAttackProfile(token)
    if (profile) byAlgorithm.set(profile.algorithm, profile)
  }
  return [...byAlgorithm.values()]
}
