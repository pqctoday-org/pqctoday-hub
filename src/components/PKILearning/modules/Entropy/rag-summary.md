# Entropy & Randomness Module

This module teaches the critical role of entropy and randomness in cryptographic security, with emphasis on post-quantum requirements. All cryptographic security depends on the quality of randomness used for key generation, nonces, and initialization vectors. A perfectly designed algorithm is worthless if the underlying random number generator is predictable. The module covers the complete NIST SP 800-90 framework, from raw entropy sources through conditioning to fully constructed Random Bit Generators.

## Key Concepts

- **Entropy fundamentals**: Why entropy quality determines cryptographic strength; historical failures like the 2008 Debian OpenSSL bug (PID-only seeding produced only ~32,768 possible keys)
- **NIST SP 800-90 family**: SP 800-90A (DRBG mechanisms), SP 800-90B (entropy source validation), SP 800-90C (RBG constructions combining sources with DRBGs)
- **DRBG mechanisms**: SP 800-90A Rev. 1 (June 2015, the current final version) specifies Hash_DRBG, HMAC_DRBG (§10.1) and CTR_DRBG (§10.2); RFC 6979 deterministic (EC)DSA derives its nonce from HMAC_DRBG. SP 800-90A Rev. 2 is only a pre-draft call for comments (published 2025-09-04, comments closed 2025-11-04) announcing a planned SHAKE/XOF-based DRBG; no draft text exists, so no such mechanism is specified
- **Entropy testing (SP 800-90B)**: Continuous health tests (Repetition Count, Adaptive Proportion) and min-entropy estimators (Most Common Value, Collision, Markov, Compression, t-Tuple, Longest Repeated Substring, predictor tests)
- **Entropy validation (CMVP)**: SP 800-90B specifies the requirements; an accredited testing lab submits the conformance justification through the ESV Server, and CMVP issues an Entropy Validation Certificate. CMVP separately issues Random Bit Generator Validation Certificates for SP 800-90C conformance (IG D.T). NIST publishes no review duration
- **TRNG vs QRNG**: Both are noise sources judged by the same SP 800-90B requirements; "quantum" describes the noise source and is not evidence of entropy. CMVP Entropy Validation Certificates exist for classical sources (e.g. E19, E280 CPU-jitter sources) and for QRNG noise sources (e.g. E63 IDQ Quantis IID QRNG, E145 QuintessenceLabs qStream 100, E214 Entropy Source for Quantum Origin)
- **Combining sources for PQC**: XOR of two independent inputs is at least as unpredictable as the stronger one, but not if they are correlated or one is attacker-influenced; conditioning can raise the entropy rate but cannot add entropy; SP 800-90C specifies the RBG1, RBG2, RBG3 and RBGC constructions
- **PQC random inputs**: ML-KEM KeyGen draws 32-byte d and z and Encaps a fresh 32-byte m; the approved RBG shall have at least 128/192/256 bits of security strength for ML-KEM-512/768/1024 (FIPS 203 §3.3). ML-DSA KeyGen draws a 32-byte seed ξ; the RBG shall be at least 192 bits for ML-DSA-65 and 256 for ML-DSA-87, and for ML-DSA-44 shall be at least 128 and should be at least 192 (FIPS 204 §3.6.1). Hedged-signing randomness (ML-DSA rnd, SLH-DSA addrnd) has no mandatory RBG strength: it should ideally come from an approved RBG. SLH-DSA KeyGen draws three n-byte values from an RBG of at least 8n bits (FIPS 205 §3.1). A 32-byte input does not by itself mean 256 bits of entropy

## Workshop Activities

1. **Random Byte Generation**: Generate and compare random bytes from Web Crypto API and OpenSSL WASM
2. **Entropy Testing**: Run simplified SP 800-90B statistical tests on generated random data
3. **ESV Validation Walkthrough**: Step through the NIST Entropy Source Validation process (source description, noise model, raw samples, health tests, conditioning)
4. **Combining Sources**: Combine two sample sources with XOR and conditioning, and see what the combination does and does not guarantee

The TRNG-vs-QRNG comparison is a Playground simulation (its "QRNG" sample comes from crypto.getRandomValues(); no QRNG hardware is involved).

## Related Standards

- NIST SP 800-90A Rev. 1 (DRBG Mechanisms); Rev. 2 pre-draft call for comments only
- NIST SP 800-90B (Entropy Source Validation)
- NIST SP 800-90C (RBG Constructions)
- NIST SP 800-131A Rev. 3 (Security Strength Requirements)
- FIPS 203 (ML-KEM), FIPS 204 (ML-DSA) and FIPS 205 (SLH-DSA) random-input requirements
- CMVP entropy validations (Entropy and RBG Validation Certificates)
