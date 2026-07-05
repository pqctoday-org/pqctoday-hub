// SPDX-License-Identifier: GPL-3.0-only
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
  countermeasures?: string[]
}

export const ATTACK_PROFILES: AlgorithmAttackProfile[] = [
  {
    algorithm: 'ML-KEM / Kyber',
    family: 'Lattice-based KEM',
    summary:
      'Single-trace key recovery demonstrated on unmasked implementations. Attacks remain effective against masked and shuffled countermeasures. Clock/voltage glitching, laser and EM fault injection exploit polynomial multiplication and decryption routines on ARM Cortex-M4. A practical kleptographic backdoor has been demonstrated in key generation itself, and profiled deep-learning power analysis has broken masked hardware implementations — both without a quantum computer or any break of the underlying lattice problem.',
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
          'Clock/voltage glitching, laser and EM fault injection on polynomial multiplication',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG or nonce reuse compromises semantic security',
      },
      { category: 'secret-handling', status: 'unknown' },
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
        status: 'yes',
        severity: 'high',
        detail:
          'Profiled deep-learning power analysis recovers keys from 1st/2nd/3rd-order masked hardware implementations; transformer models separately shown to attack LWE-based lattice problems directly (smaller parameter sets, not yet standardized ML-KEM sizes)',
      },
    ],
    countermeasures: [
      'Use masked implementations (first-order or higher-order masking of NTT operations)',
      'Enable constant-time polynomial arithmetic; avoid branch-dependent execution',
      'Deploy NIST SP 800-90B compliant DRBG for all randomness',
      'Use FIPS 140-3 validated modules with CAVP/ACVP certification',
      'Source key-generation implementations only from vetted, reproducible builds — a kleptographic backdoor is invisible in the algorithm spec and only auditable in the actual code',
    ],
    references: [
      {
        referenceId: 'PROACT-2025-SCA-Lattice-PQC',
        title: 'Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)',
        url: 'https://proact-school.cs.ru.nl/assets/uploads/slides/PROACT2025.pdf',
        localFile: 'public/library/PROACT-2025-SCA-Lattice-PQC.pdf',
      },
      {
        referenceId: 'NIST-PQC-Seminar-FaultInjection-Lattice',
        title:
          'Practical Fault Injection Attacks on Lattice-based NIST PQC Standards (NIST Seminar)',
        url: 'https://www.nist.gov/video/pqc-seminar-practical-fault-injection-attacks-lattice-based-nist-pqc-standards-kyber-and',
        localFile: 'public/library/NIST-PQC-Seminar-FaultInjection-Lattice.html',
      },
      {
        referenceId: 'KLEPTO-2022-Kyber-Backdoor',
        title: 'Backdooring Post-Quantum Cryptography: Kleptographic Attacks on Lattice-based KEMs',
        url: 'https://eprint.iacr.org/2022/1681',
        localFile: 'public/library/KLEPTO-2022-Kyber-Backdoor.html',
      },
      {
        referenceId: 'SCA-2023-Masked-Kyber-DL',
        title:
          'A Side-Channel Attack on a Bitsliced Higher-Order Masked CRYSTALS-Kyber Implementation',
        url: 'https://eprint.iacr.org/2023/1042',
        localFile: 'public/library/SCA-2023-Masked-Kyber-DL.html',
      },
      {
        referenceId: 'SALSA-2022-Lattice-Transformer',
        title: 'SALSA: Attacking Lattice Cryptography with Transformers',
        url: 'https://arxiv.org/abs/2207.04785',
        localFile: 'public/library/SALSA-2022-Lattice-Transformer.pdf',
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
        severity: 'critical',
        detail: 'Nonce reuse enables key recovery and forgery',
      },
      { category: 'secret-handling', status: 'unknown' },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail: 'Misconfigurations and insecure protocol usage',
      },
    ],
    countermeasures: [
      'Use masked implementations for NTT and rejection sampling',
      'Ensure deterministic nonce generation (hedged against bad RNG)',
      'Deploy redundancy checks to detect fault injection during signing',
      'Use FIPS 140-3 validated modules with CAVP/ACVP certification',
    ],
    references: [
      {
        referenceId: 'PROACT-2025-SCA-Lattice-PQC',
        title: 'Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)',
        url: 'https://proact-school.cs.ru.nl/assets/uploads/slides/PROACT2025.pdf',
        localFile: 'public/library/PROACT-2025-SCA-Lattice-PQC.pdf',
      },
      {
        referenceId: 'NIST-PQC-Seminar-FaultInjection-Lattice',
        title:
          'Practical Fault Injection Attacks on Lattice-based NIST PQC Standards (NIST Seminar)',
        url: 'https://www.nist.gov/video/pqc-seminar-practical-fault-injection-attacks-lattice-based-nist-pqc-standards-kyber-and',
        localFile: 'public/library/NIST-PQC-Seminar-FaultInjection-Lattice.html',
      },
    ],
  },
  {
    algorithm: 'FN-DSA / Falcon',
    family: 'Lattice-based Signature (NTRU)',
    summary:
      'FN-DSA is the most side-channel-vulnerable NIST PQC standard due to its use of floating-point Gaussian sampling over the reals. Constant-time implementation is notoriously difficult. Key material leaks through floating-point register timing and power traces. Multiple independent research groups have demonstrated practical attacks.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'critical',
        detail:
          'Floating-point Gaussian sampler leaks key material via power/EM traces; constant-time implementation extremely difficult',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail: 'Perturbation of NTRU sampling and tree traversal enables key recovery',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Nonce reuse in signing enables full key recovery',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail:
          'Secret key material stored in floating-point registers; harder to zeroize than integer types',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail:
          'Incorrect tree format handling or signature compression errors compromise security',
      },
    ],
    countermeasures: [
      'Use only implementations that pass constant-time verification (e.g., ctgrind)',
      'Avoid floating-point on platforms without constant-time FP guarantees',
      'Consider integer-only sampler variants (at performance cost)',
      'Ensure proper zeroization of floating-point registers after signing',
      'Prefer ML-DSA on constrained devices where FN-DSA side-channel hardening is impractical',
    ],
    references: [
      {
        referenceId: 'PROACT-2025-SCA-Lattice-PQC',
        title: 'Side-Channel and Fault Attacks on ML-KEM and ML-DSA (PROACT 2025)',
        url: 'https://proact-school.cs.ru.nl/assets/uploads/slides/PROACT2025.pdf',
        localFile: 'public/library/PROACT-2025-SCA-Lattice-PQC.pdf',
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
          'Timing leakage via variable-time division instructions; remotely exploitable over network',
      },
      { category: 'fault-injection', status: 'unknown' },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG compromises semantic security',
      },
      { category: 'secret-handling', status: 'unknown' },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail: 'Misconfigurations and insecure protocol usage',
      },
    ],
    countermeasures: [
      'Replace compiler-emitted division with constant-time Barrett reduction',
      'Use constant-time decoding for all error correction steps',
      'Verify constant-time behavior with tools like dudect or ctgrind',
    ],
    references: [
      {
        referenceId: 'USENIX-2024-HQC-Division-Timing',
        title: 'Divide and Surrender: Exploiting Variable Division Instruction Timing in HQC',
        url: 'https://www.usenix.org/conference/usenixsecurity24/presentation/schr%C3%B6der',
        localFile: 'public/library/USENIX-2024-HQC-Division-Timing.html',
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
        detail: 'Fault injection on FFT and Gaussian elimination operations',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG compromises semantic security',
      },
      { category: 'secret-handling', status: 'unknown' },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'low',
        detail: 'Very large public keys (~1MB) create bandwidth/storage integration challenges',
      },
    ],
    countermeasures: [
      'Use hardened hardware implementations with SCA-resistant FFT',
      'Deploy redundancy-based fault detection in Gaussian elimination',
      'Pre-validate key sizes in protocol integrations to prevent buffer issues',
    ],
    references: [
      {
        referenceId: 'IACR-2024-1828-McEliece-SCA-Fault',
        title: 'Classic McEliece Hardware Implementation with Enhanced Side-Channel Resistance',
        url: 'https://eprint.iacr.org/2024/1828',
        localFile: 'public/library/IACR-2024-1828-McEliece-SCA-Fault.html',
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
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG compromises semantic security',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail: 'Rowhammer corrupts key-generation routine producing high-error public keys',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail: 'Misconfigurations and insecure protocol usage',
      },
    ],
    countermeasures: [
      'Use constant-time Gaussian sampling (CDT or table-based)',
      'Deploy Rowhammer mitigations (ECC DRAM, TRR, memory isolation)',
      'Re-encrypt ciphertext after decapsulation to detect decryption failures (FO transform)',
    ],
    references: [
      {
        referenceId: 'FrodoKEM-SCA-Countermeasures-2024',
        title: 'Countermeasures against Side-Channel Attacks in FrodoKEM',
        url: 'https://doi.org/10.21203/rs.3.rs-7530666/v1',
        localFile: 'public/library/FrodoKEM-SCA-Countermeasures-2024.html',
      },
      {
        referenceId: 'IACR-2022-952-FrodoKEM-Rowhammer',
        title: 'When Frodo Flips: End-to-End Key Recovery on FrodoKEM via Rowhammer',
        url: 'https://eprint.iacr.org/2022/952',
        localFile: 'public/library/IACR-2022-952-FrodoKEM-Rowhammer.html',
      },
    ],
  },
  {
    algorithm: 'NTRU+',
    family: 'Lattice-based KEM',
    summary:
      'Single-trace side-channel attacks demonstrated on classic NTRU recover the secret key from a single power trace. These attacks are transferable to NTRU+ due to shared polynomial multiplication structure (both use NTRU-like arithmetic on ARM Cortex-M4). No public fault-injection attacks found specific to NTRU+.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail:
          'Single-trace and DPA key recovery demonstrated on classic NTRU; transferable to NTRU+ via shared polynomial arithmetic',
      },
      { category: 'fault-injection', status: 'unknown' },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG compromises semantic security',
      },
      { category: 'secret-handling', status: 'unknown' },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'medium',
        detail: 'Misconfigurations and insecure protocol usage',
      },
    ],
    countermeasures: [
      'Use masked polynomial multiplication implementations',
      'Deploy constant-time NTT/INTT operations',
      'Verify implementation with power analysis test equipment before deployment',
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
      'Rowhammer-based universal signature forgery demonstrated. DRAM bit flips during signature generation produce valid signatures without knowledge of the private key. Rowhammer is persistent and remotely triggerable. Hash-based operations are inherently constant-time, providing natural side-channel resistance.',
    attacks: [
      {
        category: 'side-channel',
        status: 'no',
        detail: 'Hash operations are inherently constant-time; no known SCA vulnerabilities',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'critical',
        detail:
          'Rowhammer bit flips forge signatures without the private key; remotely triggerable',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Weak PRNG compromises semantic security',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail: 'Memory bit flips corrupt internal state during signing',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'low',
        detail: 'Large signature sizes (~8-50KB) require protocol-level size validation',
      },
    ],
    countermeasures: [
      'Deploy Rowhammer mitigations (ECC DRAM, Target Row Refresh, memory isolation)',
      'Use hardware-backed signing environments (HSMs, TEEs) for high-value keys',
      'Implement signature re-verification after generation as a sanity check',
    ],
    references: [
      {
        referenceId: 'ArXiv-2025-SLH-DSA-Rowhammer',
        title: 'SLasH-DSA: Breaking SLH-DSA Using an End-to-End Rowhammer Framework',
        url: 'https://doi.org/10.48550/arXiv.2509.13048',
        localFile: 'public/library/ArXiv-2025-SLH-DSA-Rowhammer.html',
      },
    ],
  },
  {
    algorithm: 'LMS / XMSS (Stateful Hash-Based)',
    family: 'Stateful Hash-based Signature',
    summary:
      'Stateful hash-based schemes have a unique and catastrophic vulnerability: reusing a one-time signature (OTS) state completely compromises the signing key. Unlike all other PQC algorithms, correct state management is not optional — it is a hard security requirement. State must be persistently stored and crash-safe.',
    attacks: [
      {
        category: 'side-channel',
        status: 'no',
        detail: 'Hash operations are inherently constant-time; no known SCA vulnerabilities',
      },
      { category: 'fault-injection', status: 'unknown' },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'high',
        detail: 'Weak PRNG during initial key generation compromises all future signatures',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'critical',
        detail:
          'State reuse produces identical one-time signatures, enabling full key recovery. State must be crash-safe and persistent.',
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
      'Reserve OTS indices for crash recovery (skip-ahead strategy per NIST SP 800-208)',
      'Monitor remaining signature budget; plan key rotation before exhaustion',
    ],
    references: [
      {
        referenceId: 'NIST-SP-800-208',
        title: 'NIST SP 800-208: Recommendation for Stateful HBS Schemes (LMS, XMSS)',
        url: 'https://csrc.nist.gov/pubs/sp/800/208/final',
        localFile: 'public/library/NIST_SP_800-208.pdf',
      },
    ],
  },
  {
    algorithm: 'Hybrid KEM (X25519+ML-KEM)',
    family: 'Hybrid KEM (PQC + Classical)',
    summary:
      'Hybrid KEMs like X25519MLKEM768 and SecP256r1MLKEM768 inherit the ML-KEM implementation attack surface for the PQC component. The classical ECDH component (X25519 or ECDH P-256/P-384) adds its own constant-time requirements. Security is at least as strong as the stronger component.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail:
          'ML-KEM component: power/EM leakage on NTT. ECDH component: scalar multiplication timing leaks if not constant-time.',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail:
          'Inherited from ML-KEM: glitching on polynomial operations. ECDH: invalid curve attacks if point validation skipped.',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail:
          'Both components require independent secure randomness; shared PRNG failure breaks both',
      },
      { category: 'secret-handling', status: 'unknown' },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'high',
        detail:
          'Incorrect combiner function may leak component secrets; must use proper KDF (e.g., HKDF) over concatenated shared secrets',
      },
    ],
    countermeasures: [
      'Use a standards-compliant combiner (RFC 9180 HPKE or TLS 1.3 hybrid draft)',
      'Ensure both components use independent randomness from a NIST SP 800-90B DRBG',
      'Apply ML-KEM masking countermeasures to the PQC component',
      'Validate ECDH public keys (point-on-curve, cofactor check) before use',
    ],
    references: [
      {
        referenceId: 'EmergentMind-Nonce-Reuse-Crypto',
        title: 'Nonce Reuse in Cryptography',
        url: 'https://www.emergentmind.com/topics/nonce-reuse',
        localFile: 'public/library/EmergentMind-Nonce-Reuse-Crypto.html',
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
        status: 'yes',
        severity: 'high',
        detail:
          'ML-DSA: power/EM leakage on NTT. ECDSA: scalar multiplication timing if not constant-time.',
      },
      {
        category: 'fault-injection',
        status: 'yes',
        severity: 'high',
        detail: 'Inherited from ML-DSA. ECDSA: sign computation faults can leak private scalar.',
      },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail:
          'ECDSA nonce reuse = full classical key recovery. ML-DSA nonce reuse = PQC key recovery. Both must use deterministic nonce generation (RFC 6979 / hedged).',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail:
          'Two private keys to protect; ECDSA key is small (32B) and easily exfiltrated if memory is compromised',
      },
      {
        category: 'api-misuse',
        status: 'yes',
        severity: 'high',
        detail:
          'Verifier must check BOTH signatures; accepting either alone defeats the composite guarantee',
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
        localFile: 'public/library/EmergentMind-Nonce-Reuse-Crypto.html',
      },
      {
        referenceId: 'Invicti-OWASP-CryptoFailures-2025',
        title: 'Cryptographic Failures: 2025 OWASP Top 10 Risk',
        url: 'https://www.invicti.com/blog/web-security/cryptographic-failures',
        localFile: 'public/library/Invicti-OWASP-CryptoFailures-2025.html',
      },
    ],
  },
  {
    algorithm: 'RNG & API Misuse (All Algorithms)',
    family: 'Cross-cutting',
    summary:
      'All PQC schemes depend on secure random number generation and correct integration. Weak PRNGs, nonce reuse, and protocol misconfigurations enable key recovery and forgery. OWASP Top 10 cryptographic failures arise from misconfigurations and weak key management rather than algorithmic weaknesses.',
    attacks: [
      { category: 'side-channel', status: 'unknown' },
      { category: 'fault-injection', status: 'unknown' },
      {
        category: 'rng-failure',
        status: 'yes',
        severity: 'critical',
        detail: 'Repeating nonces or using weak PRNG compromises semantic security',
      },
      {
        category: 'secret-handling',
        status: 'yes',
        severity: 'high',
        detail: 'Insecure key storage, missing zeroization, and unprotected memory',
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
      'Use NIST SP 800-90B compliant DRBG (CTR_DRBG, HMAC_DRBG, or Hash_DRBG)',
      'Zeroize all key material after use (memset_s or explicit_bzero)',
      'Follow OWASP Cryptographic Failures guidance for integration patterns',
      'Use FIPS 140-3 validated cryptographic modules in production',
    ],
    references: [
      {
        referenceId: 'EmergentMind-Nonce-Reuse-Crypto',
        title: 'Nonce Reuse in Cryptography',
        url: 'https://www.emergentmind.com/topics/nonce-reuse',
        localFile: 'public/library/EmergentMind-Nonce-Reuse-Crypto.html',
      },
      {
        referenceId: 'Invicti-OWASP-CryptoFailures-2025',
        title: 'Cryptographic Failures: 2025 OWASP Top 10 Risk',
        url: 'https://www.invicti.com/blog/web-security/cryptographic-failures',
        localFile: 'public/library/Invicti-OWASP-CryptoFailures-2025.html',
      },
    ],
  },
  {
    // Classical (non-PQC) entries. The message these two carry: current,
    // widely-deployed classical crypto is broken today via kleptography and
    // AI-assisted side-channel analysis — with no dependence on a quantum
    // computer, and no need to wait for one. PQC migration urgency should not
    // read as "safe until Q-day"; these are live, demonstrated risks now.
    algorithm: 'RSA / ECDSA (Classical)',
    family: 'Classical Public-Key',
    summary:
      'The most famous real-world kleptographic backdoor targeted a classical elliptic-curve RNG (Dual_EC_DRBG), not a PQC scheme: covertly leaking the private key to whoever held the backdoor key, standardized by NIST and practically exploitable against real TLS stacks (OpenSSL-FIPS, RSA BSAFE, Windows SChannel). This predates any PQC algorithm and has nothing to do with quantum computing.',
    attacks: [
      { category: 'side-channel', status: 'unknown' },
      { category: 'fault-injection', status: 'unknown' },
      { category: 'rng-failure', status: 'unknown' },
      { category: 'secret-handling', status: 'unknown' },
      { category: 'api-misuse', status: 'unknown' },
      {
        category: 'kleptography',
        status: 'yes',
        severity: 'critical',
        detail:
          'NSA-inserted Dual_EC_DRBG backdoor (SETUP construction) practically exploited against real TLS implementations',
      },
      { category: 'ai-cryptanalysis', status: 'unknown' },
    ],
    countermeasures: [
      'Never trust an RNG/DRBG whose internal constants are not independently verifiable as nothing-up-my-sleeve',
      'Prefer NIST SP 800-90A/B compliant DRBGs with published, reproducible constant derivations (e.g. CTR_DRBG, HMAC_DRBG)',
      'Audit third-party cryptographic libraries for undisclosed algorithm substitutions or vendor-set defaults',
    ],
    references: [
      {
        referenceId: 'KLEPTO-2014-DualEC-Backdoor',
        title: 'On the Practical Exploitability of Dual EC in TLS Implementations',
        url: 'https://www.usenix.org/system/files/conference/usenixsecurity14/sec14-paper-checkoway.pdf',
        localFile: 'public/library/KLEPTO-2014-DualEC-Backdoor.pdf',
      },
    ],
  },
  {
    algorithm: 'AES (Classical)',
    family: 'Symmetric',
    summary:
      'AES is the current, widely-deployed symmetric standard — and remains vulnerable to AI/ML-based side-channel analysis today. Convolutional neural networks profile and defeat jitter-based hiding countermeasures without trace realignment, a foundational result that established deep learning as a practical side-channel technique, independent of any quantum computer or algorithmic weakness in AES itself.',
    attacks: [
      {
        category: 'side-channel',
        status: 'yes',
        severity: 'high',
        detail:
          'Power/EM leakage defeats hiding countermeasures via profiled deep-learning analysis',
      },
      { category: 'fault-injection', status: 'unknown' },
      { category: 'rng-failure', status: 'unknown' },
      { category: 'secret-handling', status: 'unknown' },
      { category: 'api-misuse', status: 'unknown' },
      { category: 'kleptography', status: 'unknown' },
      {
        category: 'ai-cryptanalysis',
        status: 'yes',
        severity: 'high',
        detail:
          'Convolutional neural networks profile and recover keys through jitter-based countermeasures without trace realignment (foundational deep-learning side-channel result)',
      },
    ],
    countermeasures: [
      'Combine masking with hiding countermeasures — ML-based side-channel analysis has shown hiding alone is insufficient',
      'Evaluate implementations against profiled deep-learning attacks, not just classical DPA/CPA, during certification',
      'Use FIPS 140-3 validated modules with side-channel-resistant implementations',
    ],
    references: [
      {
        referenceId: 'SCA-2017-AES-CNN-Jitter',
        title:
          'Convolutional Neural Networks with Data Augmentation Against Jitter-Based Countermeasures',
        url: 'https://hal.science/hal-01661212',
        localFile: 'public/library/SCA-2017-AES-CNN-Jitter.html',
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
