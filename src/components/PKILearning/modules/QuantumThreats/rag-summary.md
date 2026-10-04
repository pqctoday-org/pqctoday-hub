# Quantum Threat Mechanics

## Overview

The Quantum Threats module provides an in-depth technical explanation of how quantum computers threaten current cryptographic systems. It covers the physics of qubits and superposition, explains Shor's algorithm (which breaks RSA and ECC) and Grover's algorithm (which weakens AES and SHA), presents CRQC timeline projections from multiple agencies, and details both the HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attack models. This module builds on PQC 101 with deeper technical rigor and quantitative analysis.

## Key Concepts

- **Qubits and superposition** — quantum bits exist in a combination of 0 and 1 simultaneously; entanglement correlates them, so an N-qubit register holds a superposition over 2^N basis states at once. This is not 2^N computations in parallel: measurement returns one outcome, and an algorithm only wins when interference concentrates amplitude onto the answer
- **Shor's Algorithm** — solves integer factorization (RSA) and discrete logarithm (ECC/DH) in polynomial time O(n^3); RSA-2048 requires approximately 1,537 logical qubits (Gidney 2025, Google Quantum AI, arXiv:2505.15917 — superseding the 2016-era ~4,098 figure); 256-bit curves such as P-256 and secp256k1 require ≤1,200 logical qubits at 90M Toffoli gates (Google Quantum AI + Ethereum Foundation, March 2026), a low-end estimate against which other published work puts 256-bit ECC at ~2,330+
- **Grover's Algorithm** — provides quadratic speedup for searching unstructured databases, effectively halving symmetric key security bits; AES-128 drops to 64-bit security (insufficient), AES-256 retains 128-bit security (secure)
- **CRQC (Cryptographically Relevant Quantum Computer)** — a quantum computer powerful enough to run Shor's algorithm against production-size keys
- **CRQC timeline projections**: NIST IR 8547 (initial public draft, November 2024) proposes deprecating RSA, ECDSA and EdDSA after 2030 and disallowing them after 2035. NSA's CNSA 2.0 (September 2022 announcement) sets 2025 as the support-and-prefer milestone for software and firmware signing, with exclusive use by 2030, and by 2033 for web, cloud and operating systems; its December 2024 FAQ (version 2.1, newer) adds that equipment and services that cannot support CNSA 2.0 are to be phased out by 31 December 2030 and CNSA 2.0 algorithms mandated by 31 December 2031, unless otherwise noted. The Global Risk Institute's 2025 survey of 26 experts found a cryptographically relevant quantum computer "quite possible" (28-49%) within 10 years and "likely" (51-70%) within 15. BSI Germany's TR-02102-1 (version 2026-01) recommends classical key agreement alone only until the end of 2031, and quantum-safe mechanisms by the end of 2030 for applications with very high protection requirements. ANSSI France's current FAQ recommends hybrid protection and says it will not be reasonable to buy products without post-quantum cryptography after 2030; there is no regulatory obligation today.
- **Mosca's Theorem** — if data must remain secure X years, migration takes Y years, and CRQC arrives in Z years, migration must start within Z - X - Y years
- **HNDL attack phases**: Harvest (intercept encrypted traffic), Store (archive cheaply), Decrypt (use CRQC to break key exchange and recover symmetric keys)
- **HNFL attack phases**: Capture (collect signed artifacts like firmware, certificates, code-signing blobs), Store (wait for quantum capability), Forge (recover private key via Shor's, forge arbitrary signatures retroactively)
- **HNFL targets** include PKI hierarchies, root CA certificates, firmware signing, software update pipelines, and government ePassports

## Workshop / Interactive Activities

The workshop has 5 interactive steps:

1. **Security Level Degradation** — visualize how quantum attacks reduce the effective security level of classical algorithms, with configurable algorithm selection
2. **Algorithm Vulnerability Matrix** — comprehensive comparison grid of all algorithms versus quantum attack types
3. **Key Size Analyzer** — side-by-side comparison of two algorithms showing key sizes, ciphertext sizes, and security parameters
4. **HNDL Timeline Calculator** — input your data sensitivity period, migration time, and CRQC estimate to calculate your migration deadline using Mosca's Theorem
5. **HNFL Risk Calculator** — calculate when signing credentials must be rotated to PQC based on credential validity periods and CRQC projections

## Related Standards

- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0
- BSI Technical Recommendations (Germany)
- ANSSI Guidance on Post-Quantum Cryptography (France)
- Global Risk Institute Quantum Threat Timeline
