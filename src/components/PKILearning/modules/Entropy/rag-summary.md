# Entropy & Randomness Module

This module teaches the critical role of entropy and randomness in cryptographic security, with emphasis on post-quantum requirements. All cryptographic security depends on the quality of randomness used for key generation, nonces, and initialization vectors. A perfectly designed algorithm is worthless if the underlying random number generator is predictable. The module covers the complete NIST SP 800-90 framework, from raw entropy sources through conditioning to fully constructed Random Bit Generators.

## Key Concepts

- **Entropy fundamentals**: Why entropy quality determines cryptographic strength; historical failures like the 2008 Debian OpenSSL bug (PID-only seeding produced only ~32,768 possible keys)
- **NIST SP 800-90 family**: SP 800-90A (DRBG mechanisms), SP 800-90B (entropy source validation), SP 800-90C (RBG constructions combining sources with DRBGs)
- **DRBG mechanisms**: CTR_DRBG (AES-based, most widely deployed), Hash_DRBG (SHA-256/512), HMAC_DRBG (used in deterministic signatures), and XOF_DRBG (SHAKE-based, new in Rev 2, ideal for PQC algorithms ML-KEM and ML-DSA)
- **Entropy testing (SP 800-90B)**: Continuous health tests (Repetition Count, Adaptive Proportion) and min-entropy estimators (Most Common Value, Collision, Markov, Compression, t-Tuple, Longest Repeated Substring, predictor tests)
- **NIST ESV Program**: Formal entropy source validation through CMVP, launched April 2022, separate from FIPS 140-3 module validation
- **TRNG vs QRNG**: Classical hardware random number generators (Intel RDRAND, ARM RNDR) vs quantum random number generators (ID Quantique Quantis, ANU vacuum source); both are quantum-safe
- **Combining sources for PQC**: XOR combination preserves entropy of the stronger source; HMAC/hash conditioning removes bias; defense-in-depth per SP 800-90C
- **PQC seed requirements**: ML-KEM (FIPS 203) and ML-DSA (FIPS 204) both require exactly 32 bytes of full entropy; RBG must operate at 256-bit security strength for Category 5

## Workshop Activities

1. **Random Byte Generation**: Generate and compare random bytes from Web Crypto API and OpenSSL WASM
2. **Entropy Testing**: Run simplified SP 800-90B statistical tests on generated random data
3. **ESV Validation Walkthrough**: Step through the NIST Entropy Source Validation process (source description, noise model, raw samples, health tests, conditioning)
4. **QRNG Exploration**: Compare pre-fetched quantum random data (ANU QRNG) with local TRNG output
5. **Combining Sources**: Combine TRNG and QRNG entropy using the SP 800-90C XOR+conditioning framework

## Related Standards

- NIST SP 800-90A Rev. 1 and Rev. 2 (DRBG Mechanisms)
- NIST SP 800-90B (Entropy Source Validation)
- NIST SP 800-90C (RBG Constructions)
- NIST SP 800-131A Rev. 3 (Security Strength Requirements)
- FIPS 203 (ML-KEM) and FIPS 204 (ML-DSA) seed requirements
- NIST ESV Program (Entropy Source Validation under CMVP)
