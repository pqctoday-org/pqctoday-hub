---
module_id: pqc-implementation-security
title: PQC Implementation Security & Side-Channel Resistance
track: Hardware Infrastructure
difficulty: advanced
duration: 60 min
workshop_steps: 4
---

# PQC Implementation Security & Side-Channel Resistance

## Topics Covered

- Constant-time pitfalls in FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA): KyberSlash-class variable-latency division (`t / q` with `q = 3329` vs. Barrett/Montgomery constant-time multiply-shift reductions), ML-DSA rejection-sampling early-exit branching (`||z||_∞`, `||r0||_∞`, `||ct0||_∞`), non-constant-time `memcmp` in FO comparison, and secret-dependent memory/cache indexing
- Compiler and binary verification: per-ISA disassembly checks banning `DIV`/`SDIV`/`UDIV` on secret paths, `dudect` statistical timing tests, and `Timecop`/`ctgrind` taint tracking
- Fujisaki-Okamoto (FO) transform implicit rejection in FIPS 203 (`ML-KEM.Decaps`, Algorithm 18): unconditional computation of `K̄ = J(z || c)`, full-length constant-time comparison of `c` vs. `c'`, branchless `cmov` selection without returning error codes, and immediate zeroization of `m'` and `r'`
- Hardware/embedded masking & fault-injection defenses: linear NTT masking vs. non-linear bottlenecks (A2B/B2A conversions, masked rejection sampling, and FIPS 202 Keccak/SHAKE Chi step), quadratic fresh-randomness demand at higher masking orders, operation shuffling against single-trace horizontal attacks, and redundant verification (verify-after-sign) against voltage/clock glitches and laser faults on FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA)
- Evaluation evidence and certification scoping: TVLA (`Welch's t-test`, `|t| > 4.5` threshold and key caveats — TVLA detects leakage rather than proving exploitability or ruling out higher-order/template attacks), FIPS 140-3 non-invasive attack mitigation (ISO/IEC 19790:2025, ISO/IEC 17825, NIST SP 800-140F, FIPS 140-3 IG PQC, post-Sept 2026 FIPS 140-2 Historical transition), and EUCC CIR (EU) 2024/482 (`AVA_VAN.4` / `AVA_VAN.5` bound to exact TOE firmware and silicon revision)

## Workshop

1. Timing Leak Inspector — Interactive side-by-side code-pattern triage comparing vulnerable vs. constant-time ML-KEM and ML-DSA snippets with production verification tooling
2. FO Implicit Rejection Lab — Interactive 5-stage `ML-KEM.Decaps` walkthrough contrasting valid ciphertext, 1-bit tampered ciphertext (implicit rejection returning `K̄ = J(z || c)`), and a broken explicit-error/early-exit `memcmp` oracle
3. Masking & Fault Cost Explorer — Interactive masking-order (`Unmasked`, `1st-Order`, `2nd-Order`) and fault-countermeasure (`None`, `Redundant Verify`, `Shuffling + Redundancy`) trade-off explorer across ML-KEM-768, ML-DSA-65, NTT, and Keccak/SHAKE (illustrative educational profiles, not vendor benchmarks)
4. TVLA & Certification Evidence Scope — Interactive Yes/No/Unknown evidence-scoping checklist enforcing the rule that unanswered controls never indicate low exposure

## Key Standards

- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA), FIPS 205 (SLH-DSA), FIPS 202 (SHA-3 / SHAKE)
- FIPS 140-3 (ISO/IEC 19790:2025, ISO/IEC 17825, NIST SP 800-140F, FIPS 140-3 IG PQC)
- EUCC CIR (EU) 2024/482 (`AVA_VAN.4` / `AVA_VAN.5`)
- NIST SP 800-227 (Recommendations for Key-Encapsulation Mechanisms)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
