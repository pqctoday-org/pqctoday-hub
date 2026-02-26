# PQC 101: Introduction to Post-Quantum Cryptography

## Overview

PQC 101 is the foundational learning module that introduces post-quantum cryptography (PQC) from scratch. It explains why current public-key algorithms (RSA, ECC, ECDSA, EdDSA, ECDH, DH) are vulnerable to quantum computers, introduces the three families of PQC algorithms standardized by NIST, and walks through the migration timeline from 2016 to 2035. The module is structured as a 5-step guided lesson covering the quantum threat, the NIST standardization process, key milestones, industry-specific urgency levels, and role-based next steps.

## Key Concepts

- **Shor's Algorithm** breaks RSA and ECC by solving integer factorization and discrete logarithm problems in polynomial time on a quantum computer
- **Harvest Now, Decrypt Later (HNDL)** is an attack where adversaries capture encrypted data today and store it for future quantum decryption
- **Harvest Now, Forge Later (HNFL)** targets digital signatures — adversaries capture signed artifacts and forge them once a CRQC can recover private keys
- **Three PQC algorithm families**: lattice-based (ML-KEM, ML-DSA, FN-DSA), hash-based (SLH-DSA, LMS/HSS), and code-based (Classic McEliece, HQC)
- **NIST PQC standards**: FIPS 203 (ML-KEM for key establishment), FIPS 204 (ML-DSA for digital signatures), FIPS 205 (SLH-DSA for conservative signatures), published August 2024
- **Migration timeline**: NIST targets deprecation of RSA-2048 and 112-bit ECC by 2030, full disallowance of classical public-key crypto by 2035
- **CNSA 2.0** mandates phased PQC adoption for U.S. national security systems starting 2025
- **Industry urgency**: Finance and government are critical priority; healthcare, telecom, blockchain are high; IoT and automotive are medium

## Workshop / Interactive Activities

The workshop consists of 4 hands-on steps using real OpenSSL WASM operations in the browser:

1. **Algorithm Family Explorer** — interactive exploration of why lattice-based, hash-based, and code-based algorithms resist quantum attacks
2. **Algorithm Comparison Table** — side-by-side comparison of classical (Ed25519, ECDSA P-256) and PQC algorithms (ML-DSA-44/65/87, SLH-DSA) including key sizes and security levels
3. **Key Generation Workshop** — generate real key pairs using OpenSSL commands (e.g., `openssl genpkey -algorithm ML-DSA-65`) and observe the size differences between classical and PQC keys
4. **Signature Demo** — sign a message with both classical and PQC algorithms and verify signatures to demonstrate how digital signatures prove authenticity

The module also includes an Exercises tab with guided problems and a References tab linking to authoritative sources.

## Related Standards

- FIPS 203 (ML-KEM / Kyber)
- FIPS 204 (ML-DSA / Dilithium)
- FIPS 205 (SLH-DSA / SPHINCS+)
- NIST IR 8547 (Transition to Post-Quantum Cryptography Standards)
- NSA CNSA 2.0 (Commercial National Security Algorithm Suite 2.0)
