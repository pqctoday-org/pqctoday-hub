// SPDX-License-Identifier: GPL-3.0-only
import { ExternalLink, ShieldAlert, Cpu, Zap, KeyRound, Code2, AlertTriangle } from 'lucide-react'
import clsx from 'clsx'

type AttackCategory =
  | 'side-channel'
  | 'fault-injection'
  | 'rng-failure'
  | 'secret-handling'
  | 'api-misuse'

interface AttackReference {
  referenceId: string
  title: string
  url: string
  localFile?: string
}

type AttackSeverity = 'critical' | 'high' | 'medium' | 'low'

interface AlgorithmAttackProfile {
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

const ATTACK_CATEGORY_META: Record<
  AttackCategory,
  { label: string; icon: React.ElementType; color: string }
> = {
  'side-channel': {
    label: 'Side-Channel',
    icon: Cpu,
    color: 'text-status-error',
  },
  'fault-injection': {
    label: 'Fault Injection',
    icon: Zap,
    color: 'text-status-warning',
  },
  'rng-failure': {
    label: 'RNG Failure',
    icon: KeyRound,
    color: 'text-status-error',
  },
  'secret-handling': {
    label: 'Secret Handling',
    icon: ShieldAlert,
    color: 'text-status-warning',
  },
  'api-misuse': {
    label: 'API/Integration',
    icon: Code2,
    color: 'text-status-info',
  },
}

const ATTACK_PROFILES: AlgorithmAttackProfile[] = [
  {
    algorithm: 'ML-KEM / Kyber',
    family: 'Lattice-based KEM',
    summary:
      'Single-trace key recovery demonstrated on unmasked implementations. Attacks remain effective against masked and shuffled countermeasures. Clock/voltage glitching, laser and EM fault injection exploit polynomial multiplication and decryption routines on ARM Cortex-M4.',
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
    ],
    countermeasures: [
      'Use masked implementations (first-order or higher-order masking of NTT operations)',
      'Enable constant-time polynomial arithmetic; avoid branch-dependent execution',
      'Deploy NIST SP 800-90B compliant DRBG for all randomness',
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
]

const SEVERITY_LABELS: Record<AttackSeverity, { label: string; className: string }> = {
  critical: { label: 'Critical', className: 'bg-status-error/90 text-white' },
  high: { label: 'High', className: 'bg-status-error/60 text-white' },
  medium: { label: 'Medium', className: 'bg-status-warning/70 text-white' },
  low: { label: 'Low', className: 'bg-status-warning/40 text-foreground' },
}

function StatusBadge({
  status,
  severity,
}: {
  status: 'yes' | 'no' | 'unknown'
  severity?: AttackSeverity
}) {
  if (status === 'yes' && severity) {
    // eslint-disable-next-line security/detect-object-injection
    const sev = SEVERITY_LABELS[severity]
    return (
      <span
        className={clsx(
          'inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium',
          sev.className
        )}
        title={`Severity: ${sev.label}`}
      >
        {sev.label}
      </span>
    )
  }
  if (status === 'yes') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-error/80 text-white font-medium">
        Vulnerable
      </span>
    )
  }
  if (status === 'no') {
    return (
      <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-status-success/80 text-white font-medium">
        Not Found
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
      Unknown
    </span>
  )
}

export const ImplementationAttacksView: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Introductory context */}
      <div className="glass-panel p-4 md:p-6">
        <div className="flex items-start gap-3 p-4 bg-status-warning/10 border border-status-warning/30 rounded-lg">
          <AlertTriangle className="text-status-warning flex-shrink-0 mt-0.5" size={20} />
          <div className="text-sm">
            <p className="font-semibold mb-1 text-foreground">Implementation Attack Evidence</p>
            <p className="text-muted-foreground">
              This tab summarizes known implementation-level attacks on PQC algorithms —
              side-channel leakage, fault injection, RNG failures, and API misuse. These are{' '}
              <span className="font-medium text-foreground">implementation vulnerabilities</span>,
              not weaknesses in the underlying mathematics. Each tile links to peer-reviewed
              research and authoritative sources.
            </p>
          </div>
        </div>
      </div>

      {/* Attack category + severity legend */}
      <div className="glass-panel p-4 space-y-3">
        <div className="flex flex-wrap gap-4 justify-center">
          {Object.entries(ATTACK_CATEGORY_META).map(([key, meta]) => {
            const Icon = meta.icon
            return (
              <div key={key} className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Icon size={14} className={meta.color} />
                <span>{meta.label}</span>
              </div>
            )
          })}
        </div>
        <div className="flex flex-wrap gap-3 justify-center border-t border-border pt-3">
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">
            Severity:
          </span>
          {(
            Object.entries(SEVERITY_LABELS) as [
              AttackSeverity,
              { label: string; className: string },
            ][]
          ).map(([key, sev]) => (
            <span
              key={key}
              className={clsx(
                'inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium',
                sev.className
              )}
            >
              {sev.label}
            </span>
          ))}
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium bg-status-success/80 text-white">
            Not Found
          </span>
          <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full font-medium bg-muted text-muted-foreground">
            Unknown
          </span>
        </div>
      </div>

      {/* Algorithm attack tiles */}
      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
        {ATTACK_PROFILES.map((profile) => (
          <div
            key={profile.algorithm}
            className="glass-panel p-5 flex flex-col gap-4 hover:border-primary/50 transition-colors border border-border rounded-lg"
          >
            {/* Header */}
            <div>
              <h4 className="font-semibold text-foreground text-base">{profile.algorithm}</h4>
              <span className="text-xs text-muted-foreground">{profile.family}</span>
            </div>

            {/* Attack status grid */}
            <div className="grid grid-cols-1 gap-2">
              {profile.attacks.map((attack) => {
                const meta = ATTACK_CATEGORY_META[attack.category]
                const Icon = meta.icon
                return (
                  <div
                    key={attack.category}
                    className={clsx(
                      'flex items-start gap-2 p-2 rounded-md text-sm',
                      attack.status === 'yes' && 'bg-status-error/5',
                      attack.status === 'unknown' && 'bg-muted/30'
                    )}
                  >
                    <Icon size={14} className={clsx(meta.color, 'mt-0.5 shrink-0')} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-medium text-foreground">{meta.label}</span>
                        <StatusBadge status={attack.status} severity={attack.severity} />
                      </div>
                      {attack.detail && (
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                          {attack.detail}
                        </p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Summary */}
            <p className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
              {profile.summary}
            </p>

            {/* Countermeasures */}
            {profile.countermeasures && profile.countermeasures.length > 0 && (
              <div className="bg-status-success/5 border border-status-success/20 rounded-md p-3">
                <span className="text-xs font-semibold text-status-success uppercase tracking-wider block mb-1.5">
                  Countermeasures
                </span>
                <ul className="space-y-1">
                  {profile.countermeasures.map((cm, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <span className="text-status-success mt-0.5 shrink-0">&bull;</span>
                      <span>{cm}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Reference links */}
            <div className="flex flex-col gap-1.5 mt-auto">
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                References
              </span>
              {profile.references.map((ref) => (
                <a
                  key={ref.referenceId}
                  href={ref.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-start gap-1.5 text-xs text-accent hover:text-primary transition-colors group"
                  title={ref.title}
                >
                  <ExternalLink
                    size={12}
                    className="shrink-0 mt-0.5 opacity-60 group-hover:opacity-100"
                  />
                  <span className="line-clamp-2">{ref.title}</span>
                </a>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
