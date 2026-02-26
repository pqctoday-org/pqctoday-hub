# Quantum Threat Mechanics

## Overview

The Quantum Threats module provides an in-depth technical explanation of how quantum computers threaten current cryptographic systems. It covers the physics of qubits and superposition, explains Shor's algorithm (which breaks RSA and ECC) and Grover's algorithm (which weakens AES and SHA), presents CRQC timeline projections from multiple agencies, and details both the HNDL (Harvest Now, Decrypt Later) and HNFL (Harvest Now, Forge Later) attack models. This module builds on PQC 101 with deeper technical rigor and quantitative analysis.

## Key Concepts

- **Qubits and superposition** — quantum bits exist in a combination of 0 and 1 simultaneously; entanglement correlates qubits so N qubits can process 2^N states in parallel
- **Shor's Algorithm** — solves integer factorization (RSA) and discrete logarithm (ECC/DH) in polynomial time O(n^3); RSA-2048 requires approximately 4,098 logical qubits; P-256 requires approximately 2,330 logical qubits
- **Grover's Algorithm** — provides quadratic speedup for searching unstructured databases, effectively halving symmetric key security bits; AES-128 drops to 64-bit security (insufficient), AES-256 retains 128-bit security (secure)
- **CRQC (Cryptographically Relevant Quantum Computer)** — a quantum computer powerful enough to run Shor's algorithm against production-size keys
- **CRQC timeline projections**: NIST IR 8547 targets deprecation by 2030/disallowance by 2035; NSA CNSA 2.0 requires software PQC by 2025; Global Risk Institute estimates 33% chance by 2033; BSI Germany recommends hybrid migration now; ANSSI France mandates hybrid for government by 2025
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
