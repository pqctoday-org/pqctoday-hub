// SPDX-License-Identifier: AGPL-3.0-only

export interface TimingLeakPattern {
  id: string
  title: string
  algorithm: 'ML-KEM' | 'ML-DSA' | 'ML-KEM / ML-DSA'
  standardRef: string
  leakClass:
    | 'Variable-Latency Division'
    | 'Secret-Dependent Branch'
    | 'Early-Exit Comparison'
    | 'Cache / Memory Indexing'
  severity: 'Critical' | 'High'
  vulnerableTitle: string
  vulnerableCode: string
  fixedTitle: string
  fixedCode: string
  leakMechanism: string
  remediationRule: string
  verificationTooling: string[]
  limitationNote: string
}

export const TIMING_LEAK_PATTERNS: TimingLeakPattern[] = [
  {
    id: 'kyberslash-division',
    title: 'KyberSlash-Class Secret-Dependent Division (t / q)',
    algorithm: 'ML-KEM',
    standardRef: 'FIPS 203 (Compress_1 / Decompress_1)',
    leakClass: 'Variable-Latency Division',
    severity: 'Critical',
    vulnerableTitle: 'Vulnerable: Compiler emits variable-time DIV / SDIV instruction',
    vulnerableCode: `// Vulnerable C pattern during ML-KEM message decoding / compression
// On many x86, ARM, and RISC-V cores, integer division latency depends on operand magnitude.
uint16_t compress_1_vuln(uint16_t coeff) {
  uint32_t t = ((uint32_t)coeff << 1) + 1665;
  return (uint16_t)((t / 3329) & 1); // LEAK: secret-dependent dividend in hardware DIV
}`,
    fixedTitle: 'Constant-Time: Barrett multiply-shift reduction (no division instruction)',
    fixedCode: `// Constant-Time Barrett-style multiply-shift for q = 3329
// Uses fixed-latency multiply + shift; verify assembly emits no DIV/SDIV/UDIV.
uint16_t compress_1_ct(uint16_t coeff) {
  uint32_t t = ((uint32_t)coeff << 1) + 1665;
  // floor(2^28 / 3329) = 80635; exact for all valid reduced inputs
  uint32_t q_approx = (t * 80635u) >> 28;
  return (uint16_t)(q_approx & 1u);
}`,
    leakMechanism:
      'Hardware integer division units often terminate early when the dividend is small or has leading zeros. During ML-KEM decapsulation, the intermediate polynomial coefficient depends on secret key s; timing the division across chosen ciphertexts recovers secret coefficients (as shown in KyberSlash1 and KyberSlash2).',
    remediationRule:
      'Replace all secret-dependent `/` and `%` operations with constant-time Barrett or Montgomery multiply-shift reductions, and inspect compiled object code for `div`, `idiv`, `sdiv`, or `udiv` instructions across every target ISA and compiler optimization flag.',
    verificationTooling: [
      'Disassembly scan (`objdump -d` / CI rule banning DIV/SDIV/UDIV inside crypto symbols)',
      'Statistical timing test (`dudect` with Welch’s t-test across fixed vs. random inputs)',
      'Taint / symbolic analysis (`ctgrind`, `Binsec/Rel`, or `Timecop` via Valgrind)',
    ],
    limitationNote:
      'Passing `dudect` on one x86-64 build does not guarantee an ARM Cortex-M or RISC-V compiler build is division-free; compilers can also reintroduce branches during optimization passes.',
  },
  {
    id: 'mldsa-rejection-branch',
    title: 'ML-DSA Rejection-Sampling Early-Exit Branching',
    algorithm: 'ML-DSA',
    standardRef: 'FIPS 204 (ML-DSA.Sign_internal)',
    leakClass: 'Secret-Dependent Branch',
    severity: 'High',
    vulnerableTitle: 'Vulnerable: Short-circuit loop reveals which coefficient failed norm bound',
    vulnerableCode: `// Vulnerable norm check in ML-DSA signing loop
// Returning immediately on the first failing coefficient leaks its index and magnitude.
int check_norm_vuln(const int32_t *z, size_t len, int32_t bound) {
  for (size_t i = 0; i < len; i++) {
    int32_t abs_val = (z[i] < 0) ? -z[i] : z[i]; // LEAK: branchy abs()
    if (abs_val >= bound) {
      return 1; // LEAK: early exit reveals failing coefficient index i
    }
  }
  return 0;
}`,
    fixedTitle: 'Constant-Time: Branchless absolute value + full-vector mask accumulation',
    fixedCode: `// Constant-time infinity-norm check across all coefficients
// Only the final single-bit rejection decision (publicly visible as retry count) is branched on.
uint32_t check_norm_ct(const int32_t *z, size_t len, int32_t bound) {
  uint32_t fail_mask = 0;
  for (size_t i = 0; i < len; i++) {
    int32_t sign = z[i] >> 31;                   // arithmetic shift: 0 or -1
    int32_t abs_val = (z[i] ^ sign) - sign;      // branchless |z[i]|
    // High bit set if (bound - 1 - abs_val) < 0, i.e., abs_val >= bound
    fail_mask |= (uint32_t)(bound - 1 - abs_val) >> 31;
  }
  return fail_mask & 1u;
}`,
    leakMechanism:
      'In ML-DSA signing, the rejection count itself is an inherent public side-effect of Fiat-Shamir with Aborts, but leaking *which* coefficient index `i` or *which* of the four checks (`||z||_∞`, `||r0||_∞`, `||ct0||_∞`, hint weight) triggered the abort leaks partial information about masking polynomial `y` and secret vectors `s1`/`s2`.',
    remediationRule:
      'Evaluate all norm and hint checks branchlessly over the full polynomial vector, combine the per-check failure bits with bitwise OR, and only branch once on the aggregated rejection bit to restart the signing loop.',
    verificationTooling: [
      'Dynamic taint checking (`Timecop` / Valgrind memcheck on secret-tainted `y`, `s1`, `s2`)',
      'Compiler barrier / `cmov` inspection to ensure `-O2`/`-O3` does not fold masks back into `if` branches',
      'Cycle-accurate simulation or trace alignment on embedded targets',
    ],
    limitationNote:
      'Constant-time software norm checks stop timing leaks of failing indices, but single-trace power/EM attacks during `y` generation or `c * s1` still require hardware masking or shuffling.',
  },
  {
    id: 'fo-early-exit-memcmp',
    title: 'Non-Constant-Time memcmp & Branch in FO Re-Encryption Check',
    algorithm: 'ML-KEM',
    standardRef: 'FIPS 203 (Algorithm 18, ML-KEM.Decaps_internal)',
    leakClass: 'Early-Exit Comparison',
    severity: 'Critical',
    vulnerableTitle: 'Vulnerable: Standard memcmp + if-branch leaks ciphertext validity',
    vulnerableCode: `// Vulnerable FO re-encryption comparison in ML-KEM.Decaps
// Standard memcmp stops at the first differing byte; branching leaks valid vs. invalid c.
int decaps_select_vuln(uint8_t *out_k, const uint8_t *k_valid,
                       const uint8_t *k_reject, const uint8_t *c,
                       const uint8_t *c_prime, size_t c_len) {
  if (memcmp(c, c_prime, c_len) != 0) { // LEAK: byte-index timing + branch prediction
    memcpy(out_k, k_reject, 32);
    return ERR_DECAPS_MISMATCH;         // LEAK: explicit error breaks implicit rejection!
  }
  memcpy(out_k, k_valid, 32);
  return OK;
}`,
    fixedTitle: 'Constant-Time: Bitwise OR diff + branchless cmov selecting K or K̄',
    fixedCode: `// Constant-time FO ciphertext verification and implicit-rejection selection
// Always computes both K and K_bar = J(z || c), then selects without branching or error codes.
void decaps_select_ct(uint8_t *out_k, const uint8_t *k_valid,
                      const uint8_t *k_reject, const uint8_t *c,
                      const uint8_t *c_prime, size_t c_len) {
  uint32_t diff = 0;
  for (size_t i = 0; i < c_len; i++) {
    diff |= (uint32_t)(c[i] ^ c_prime[i]);
  }
  // mask = 0xFFFFFFFF if diff != 0 (mismatch -> select k_reject), else 0x00000000
  uint32_t mask = (uint32_t)(-((diff | (~diff + 1u)) >> 31));
  for (size_t i = 0; i < 32; i++) {
    out_k[i] = (uint8_t)((k_valid[i] & ~mask) | (k_reject[i] & mask));
  }
}`,
    leakMechanism:
      "Standard `memcmp` exits at the first differing byte, leaking how many prefix bytes of the re-encrypted ciphertext `c'` matched `c`. Returning a distinct error code or taking a different branch turns decapsulation into a decryption-failure / plaintext-checking oracle, enabling full key recovery under chosen-ciphertext attacks.",
    remediationRule:
      'Compare the entire ciphertext byte-by-byte with bitwise XOR/OR, derive a full-width constant-time bitmask, select between `K` and `K̄ = J(z || c)` via constant-time `cmov`, and always return success without exposing whether re-encryption matched.',
    verificationTooling: [
      'Fault/tamper unit tests asserting identical return status and valid 32-byte key length on mutated ciphertexts',
      'Constant-time verification (`dudect` comparing valid vs. 1-bit-flipped ciphertexts)',
      'ACVP ML-KEM decapsulation vectors including implicit-rejection test cases',
    ],
    limitationNote:
      "Even with constant-time `cmov`, leaking `c == c'` through an application-layer TLS/HPKE error message or downstream AEAD timing can still create an oracle if the caller mishandles the shared secret.",
  },
  {
    id: 'secret-table-indexing',
    title: 'Secret-Dependent Memory Indexing & Cache-Timing Lookups',
    algorithm: 'ML-KEM / ML-DSA',
    standardRef: 'FIPS 203 / FIPS 204 (Sampling & Decoding)',
    leakClass: 'Cache / Memory Indexing',
    severity: 'High',
    vulnerableTitle: 'Vulnerable: Indexing a table with secret polynomial bits',
    vulnerableCode: `// Vulnerable table lookup indexed by secret noise/message bits
// Cache-line hits/misses (Flush+Reload, Prime+Probe) reveal the secret index.
static const int16_t NOISE_LUT[16] = { /* ... */ };

int16_t decode_secret_vuln(uint8_t secret_nibble) {
  return NOISE_LUT[secret_nibble & 0x0F]; // LEAK: secret-dependent memory address
}`,
    fixedTitle: 'Constant-Time: Arithmetic/bitsliced computation or full-table constant-time scan',
    fixedCode: `// Constant-time full-scan selection (or direct arithmetic computation without LUT)
// Every cache line of the table is accessed identically regardless of secret_nibble.
int16_t decode_secret_ct(uint8_t secret_nibble) {
  uint8_t idx = secret_nibble & 0x0Fu;
  int16_t acc = 0;
  for (uint8_t i = 0; i < 16; i++) {
    uint32_t eq = (uint32_t)(i ^ idx);
    int16_t mask = (int16_t)(~((eq | (~eq + 1u)) >> 31) + 1u); // -1 if i == idx, else 0
    acc |= (int16_t)(NOISE_LUT[i] & mask);
  }
  return acc;
}`,
    leakMechanism:
      'On shared-cache CPUs (cloud VMs, multi-tenant servers, smartphones), indexing an array or S-box by secret data causes different cache lines to be fetched. Co-resident attackers using Prime+Probe or Flush+Reload observe which cache sets were touched and recover secret coefficients or noise samples.',
    remediationRule:
      'Eliminate secret-dependent memory addresses entirely: prefer direct arithmetic or bitsliced formulas (e.g., Hamming-weight subtraction for Centered Binomial Distribution `CBD_η`), or perform a full-table constant-time scan when a small lookup is unavoidable.',
    verificationTooling: [
      'Cache-trace analysis (`CacheAudit`, `DATA` / Differential Address Trace Analysis)',
      'Valgrind/Timecop memory-address taint tracking (flagging any secret-tainted pointer offset)',
      'Static code review banning `array[secret]` patterns in cryptographic modules',
    ],
    limitationNote:
      'Eliminating secret-dependent addresses stops classical cache-line leaks, but speculative execution (Spectre-class) or hardware prefetcher quirks still require architecture-appropriate fences in high-assurance boundaries.',
  },
]

export interface FoTraceStep {
  stepNumber: number
  stage: string
  operation: string
  validState: string
  tamperedState: string
  brokenState: string
  securityNote: string
}

export const FO_TRACE_STEPS: FoTraceStep[] = [
  {
    stepNumber: 1,
    stage: 'Input Validation (FIPS 203 §7.3)',
    operation:
      'Verify ciphertext byte length (1,088 B for ML-KEM-768) and decapsulation key hash h = H(ek)',
    validState: 'Length = 1,088 B (PASS); h matches ek hash',
    tamperedState: 'Length = 1,088 B (PASS — single bit flipped inside c); h matches ek hash',
    brokenState: 'Length = 1,088 B (PASS)',
    securityNote:
      'Input length and key-hash checks operate on public metadata only; they do not depend on secret key s.',
  },
  {
    stepNumber: 2,
    stage: 'IND-CPA Decryption (K-PKE.Decrypt)',
    operation: "Decrypt c using secret vector s to obtain candidate 32-byte message m'",
    validState: "m' = original 32-byte message m (0x7a4f...9c12)",
    tamperedState: "m' = corrupted 32-byte message m_bad (0xd108...4e7b) due to bit flip in c",
    brokenState: "m' = corrupted 32-byte message m_bad (0xd108...4e7b)",
    securityNote:
      'Must execute in strict constant time (no secret-dependent division or cache indexing) so K-PKE.Decrypt leaks nothing about s.',
  },
  {
    stepNumber: 3,
    stage: 'Key & Coin Derivation (G) + Rejection Key (J)',
    operation: "Compute (K', r') = G(m' || h) and always compute K̄ = J(z || c) using secret seed z",
    validState:
      "K' = 0x3b91...a02e, r' = valid coins; K̄ = J(z || c) = 0x8f22...11c4 (computed unconditionally)",
    tamperedState:
      "K' = 0x9e14...77f0, r' = wrong coins; K̄ = J(z || c) = 0xc4a1...5b09 (computed unconditionally)",
    brokenState: "Computes (K', r') = G(m' || h); skips J(z || c) unless mismatch occurs",
    securityNote:
      'Computing K̄ = J(z || c) unconditionally prevents power/timing traces from revealing whether the rejection path was taken.',
  },
  {
    stepNumber: 4,
    stage: 'Deterministic Re-Encryption (K-PKE.Encrypt)',
    operation: "Re-encrypt m' under ek with coins r' to produce candidate ciphertext c'",
    validState: "c' matches received c on all 1,088 bytes (diff_mask = 0x00000000)",
    tamperedState:
      "c' differs from received c (diff_mask = 0xFFFFFFFF after scanning all 1,088 bytes)",
    brokenState:
      "c' differs from received c; memcmp() exits early at byte 0 (4 cycles instead of 1,088)",
    securityNote:
      'Re-encryption checks ciphertext integrity without requiring an explicit MAC, forming the core of the Fujisaki-Okamoto IND-CCA2 transform.',
  },
  {
    stepNumber: 5,
    stage: 'Constant-Time Selection & Zeroization',
    operation:
      "Select K_out = cmov(K', K̄, diff_mask), zeroize m' and r', return K_out with OK status",
    validState:
      "Returns K' (0x3b91...a02e); status = OK; timing = constant (100% identical trace shape)",
    tamperedState:
      'Returns K̄ (0xc4a1...5b09); status = OK; timing = constant (indistinguishable from valid decaps)',
    brokenState:
      'Returns ERR_INVALID_CIPHERTEXT (no key); early exit leaks decryption-failure oracle!',
    securityNote:
      'Implicit rejection guarantees an active attacker submitting crafted ciphertexts learns neither a distinct error code nor a timing delta, preventing adaptive chosen-ciphertext key recovery.',
  },
]

export type MaskingOrder = 'unmasked' | 'first-order' | 'second-order'
export type FaultDefense = 'none' | 'redundant-verify' | 'shuffling-plus-redundancy'
export type TargetComponentId = 'ml-kem-768' | 'ml-dsa-65' | 'ntt-core' | 'keccak-shake'

export interface MaskingTargetProfile {
  id: TargetComponentId
  label: string
  standard: string
  bottleneck: string
  /** Illustrative educational order-of-magnitude relative cycle factors (NOT vendor benchmarks). */
  cycleMultiplier: Record<MaskingOrder, string>
  /** Illustrative educational order-of-magnitude relative RAM/stack factors (NOT vendor benchmarks). */
  ramMultiplier: Record<MaskingOrder, string>
  prngDemand: Record<MaskingOrder, string>
  nonLinearCostNote: string
}

export const MASKING_TARGET_PROFILES: MaskingTargetProfile[] = [
  {
    id: 'ml-kem-768',
    label: 'ML-KEM-768 Decapsulation',
    standard: 'FIPS 203',
    bottleneck: 'Masked A2B/B2A compression, Keccak/SHAKE (G, J, XOF), and FO comparison',
    cycleMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2.5x – 4x',
      'second-order': '~6x – 12x',
    },
    ramMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2x – 2.5x',
      'second-order': '~3x – 4x',
    },
    prngDemand: {
      unmasked: 'None for masking',
      'first-order': 'Moderate (fresh masks for shares, A2B/B2A & Keccak)',
      'second-order': 'High (quadratic growth in fresh randomness for non-linear gadgets)',
    },
    nonLinearCostNote:
      'Linear NTT arithmetic scales roughly linearly with share count (d+1), while A2B/B2A conversions for message decoding and masked SHAKE dominate total latency.',
  },
  {
    id: 'ml-dsa-65',
    label: 'ML-DSA-65 Signing',
    standard: 'FIPS 204',
    bottleneck:
      'Masked rejection sampling (Decompose/HighBits/LowBits), y generation, and SHAKE-256',
    cycleMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~3x – 6x',
      'second-order': '~10x – 20x+',
    },
    ramMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2x – 3x',
      'second-order': '~3.5x – 5x',
    },
    prngDemand: {
      unmasked: 'None for masking (hedged signing uses 32 B rnd)',
      'first-order': 'High (repeated across rejection-sampling iterations)',
      'second-order': 'Very High (fresh randomness per non-linear gadget per retry loop)',
    },
    nonLinearCostNote:
      'Because ML-DSA signing repeats on rejection (~4–5 iterations on average for ML-DSA-65), masked non-linear bound checks and masked SHAKE multiply across every loop attempt.',
  },
  {
    id: 'ntt-core',
    label: 'NTT / Inverse NTT Core',
    standard: 'FIPS 203 / FIPS 204',
    bottleneck:
      'Linear butterfly operations (lowest masking overhead; vulnerable to single-trace template attacks if unshuffled)',
    cycleMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2x',
      'second-order': '~3x',
    },
    ramMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2x',
      'second-order': '~3x',
    },
    prngDemand: {
      unmasked: 'None',
      'first-order': 'Low (initial share splitting only; butterflies stay linear)',
      'second-order': 'Low-Moderate (initial 3-share splitting; optional share refresh)',
    },
    nonLinearCostNote:
      'Because NTT is linear over Z_q, arithmetic masking executes independently on each share without inter-share multiplication — making NTT the cheapest layer to mask.',
  },
  {
    id: 'keccak-shake',
    label: 'Keccak / SHAKE-128 & SHAKE-256',
    standard: 'FIPS 202 (used by FIPS 203/204/205)',
    bottleneck: 'Non-linear Chi (χ) step across 1,600-bit state (24 rounds per permutation)',
    cycleMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~3x – 5x',
      'second-order': '~8x – 15x',
    },
    ramMultiplier: {
      unmasked: '1x (baseline)',
      'first-order': '~2x',
      'second-order': '~3x – 3.5x',
    },
    prngDemand: {
      unmasked: 'None',
      'first-order': 'High (fresh randomness in every masked AND gate of Chi across 24 rounds)',
      'second-order': 'Very High (ISW/DOM quadratic randomness per Chi round)',
    },
    nonLinearCostNote:
      'Keccak powers key derivation, matrix expansion, and hashing in ML-KEM, ML-DSA, and SLH-DSA. Hardware accelerators with Domain-Oriented Masking (DOM) dramatically reduce its software cycle penalty.',
  },
]

export interface FaultDefenseProfile {
  id: FaultDefense
  label: string
  cycleOverhead: string
  protectsAgainst: string
  residualRisk: string
}

export const FAULT_DEFENSE_PROFILES: FaultDefenseProfile[] = [
  {
    id: 'none',
    label: 'No Fault Countermeasure',
    cycleOverhead: '+0%',
    protectsAgainst: 'None — passive masking alone does not stop active fault injection.',
    residualRisk:
      'Single clock/voltage glitch or laser pulse skipping a rejection check in ML-DSA, corrupting an SLH-DSA WOTS+ hash chain, or forcing an FO branch flip can recover the secret key in a handful of faults.',
  },
  {
    id: 'redundant-verify',
    label: 'Redundant Verification (Verify-After-Sign / Dual Check)',
    cycleOverhead: '+15% – 40% (signature verify is much faster than masked sign)',
    protectsAgainst:
      'Single-fault key-recovery attacks on deterministic/hedged ML-DSA (FIPS 204) and SLH-DSA (FIPS 205) signing, plus loop-skip faults in FO comparison.',
    residualRisk:
      'Verify-after-sign catches corrupted outputs before release, but double-fault attacks targeting the final equality check or fault-induced leakage prior to output still require hardware sensors or dual-rail logic.',
  },
  {
    id: 'shuffling-plus-redundancy',
    label: 'Operation Shuffling + Redundant Verification',
    cycleOverhead: '+25% – 60% (+ fresh shuffle permutation entropy)',
    protectsAgainst:
      'Single-trace template/horizontal SCA attacks on NTT/sampling (by randomizing butterfly/coefficient order) AND single-fault glitch attacks via redundant verification.',
    residualRisk:
      'Effective only when shuffle permutations use unpredictable fresh randomness and physical glitch/EM detectors protect the control-flow integrity of the final check.',
  },
]

export interface TvlaChecklistItem {
  id: string
  domainLabel: string
  question: string
  whyItMatters: string
  drivers: string[]
  evidenceRequest: string
}

export const TVLA_EVIDENCE_ITEMS: TvlaChecklistItem[] = [
  {
    id: 'ct-binary-verification',
    domainLabel: 'Constant-Time Code & Binary Audit',
    question:
      'Have compiled binaries for every target ISA been verified free of secret-dependent division instructions (DIV/SDIV/UDIV), branches, and memory indexing?',
    whyItMatters:
      'Source-level constant-time C/Rust can be broken by compiler optimizations or ISA-specific division latency (KyberSlash). Binary disassembly checks and statistical timing tests must run on the exact shipping build.',
    drivers: ['FIPS 203', 'FIPS 204', 'PROACT 2025'],
    evidenceRequest:
      'CI disassembly report for target architectures, `dudect` / `Timecop` logs on shipping compiler flags, and versioned commit hash.',
  },
  {
    id: 'fo-implicit-rejection',
    domainLabel: 'FO Implicit Rejection & Zeroization',
    question:
      'Does ML-KEM.Decaps implement constant-time full ciphertext comparison, unconditional K̄ = J(z || c) computation, branchless cmov selection, and immediate zeroization of m′ and r′?',
    whyItMatters:
      'An early-exit memcmp or explicit error code on ciphertext mismatch breaks IND-CCA2 security and exposes a chosen-ciphertext key-recovery oracle.',
    drivers: ['FIPS 203', 'NIST SP 800-227'],
    evidenceRequest:
      'ACVP ML-KEM decapsulation implicit-rejection test pass record, constant-time valid-vs-tampered timing trace, and memory-zeroization audit.',
  },
  {
    id: 'tvla-methodology-caveats',
    domainLabel: 'TVLA Methodology & Leakage Scope',
    question:
      'Are TVLA (Welch’s t-test, |t| > 4.5 threshold) reports complete with trace count, fixed-vs-random test vectors, probe setup, and explicit acknowledgement of TVLA limitations?',
    whyItMatters:
      'TVLA detects statistically significant leakage points, but |t| > 4.5 alone does not quantify key-recovery exploitability — and passing a first-order univariate t-test does not rule out higher-order, multivariate, or horizontal template attacks.',
    drivers: ['ISO/IEC 17825', 'NIST SP 800-140F'],
    evidenceRequest:
      'Lab TVLA test report listing trace count (e.g., 10k–1M+), sampling rate, fixed-vs-random vectors, t-statistic plots across NTT/Keccak/sampling windows, and follow-up key-recovery analysis for any peaks exceeding |t| = 4.5.',
  },
  {
    id: 'masking-fault-coverage',
    domainLabel: 'Masking & Fault-Injection Defenses',
    question:
      'Are non-linear layers (A2B/B2A conversions, Keccak/SHAKE Chi, rejection sampling) masked with approved fresh randomness, and are ML-DSA/SLH-DSA protected by redundant verification against fault injection?',
    whyItMatters:
      'Masking only the linear NTT leaves Keccak and rejection sampling exposed to power/EM recovery; omitting redundant verification leaves deterministic or hedged signing vulnerable to single-glitch fault attacks.',
    drivers: ['FIPS 202', 'FIPS 204', 'FIPS 205'],
    evidenceRequest:
      'Countermeasure design specification mapping shares and DRBG randomness budgets per primitive, plus fault-injection test summary (voltage/clock glitch or EMFI campaign results).',
  },
  {
    id: 'fips-140-3-non-invasive',
    domainLabel: 'FIPS 140-3 Non-Invasive Mitigation',
    question:
      'Does the cryptographic module hold an active FIPS 140-3 CMVP validation covering PQC algorithms and applicable non-invasive attack mitigation (ISO/IEC 19790 / NIST SP 800-140F / IG PQC)?',
    whyItMatters:
      'FIPS 140-2 moved to Historical status in September 2026. ACVP functional certificates alone do not prove module-level physical or non-invasive side-channel security.',
    drivers: ['FIPS 140-3', 'ISO/IEC 19790:2025', 'FIPS 140-3 IG PQC'],
    evidenceRequest:
      'Active CMVP FIPS 140-3 certificate number, Security Policy confirming ML-KEM/ML-DSA/SLH-DSA in Approved mode, and non-invasive test evidence (ISO/IEC 17825 / SP 800-140F where required by security level).',
  },
  {
    id: 'eucc-ava-van-scope',
    domainLabel: 'EUCC / Common Criteria AVA_VAN',
    question:
      'For high-assurance hardware (HSMs, smart cards, secure elements), is there an EUCC or Common Criteria certificate at AVA_VAN.4 or AVA_VAN.5 bound to the exact shipping firmware and silicon revision?',
    whyItMatters:
      'EUCC (CIR (EU) 2024/482) high-level assurance requires independent lab vulnerability analysis (AVA_VAN.4/5) scoring attack potential across side-channel and fault-injection vectors; firmware updates outside the certified TOE invalidate coverage.',
    drivers: ['EUCC CIR (EU) 2024/482', 'AVA_VAN.4 / AVA_VAN.5'],
    evidenceRequest:
      'EUCC / CC certificate and Certification Report confirming TOE version, Protection Profile, AVA_VAN level (4 or 5), and PQC algorithm inclusion in the evaluated TOE scope.',
  },
]
