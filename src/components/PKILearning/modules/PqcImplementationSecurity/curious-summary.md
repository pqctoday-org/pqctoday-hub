### What This Is About

Even when post-quantum algorithms like ML-KEM, ML-DSA, and SLH-DSA are mathematically strong, real-world software and hardware implementations can still leak secret keys through execution timing, CPU caches, power draw, electromagnetic emissions, or voltage glitches.

### Why It Matters

A single variable-time division instruction (like KyberSlash), an early-exit loop during ML-DSA signing, or returning an error message when ML-KEM decapsulation fails can give an attacker enough signal to recover a private key. On smart cards, embedded devices, and HSMs, physical side channels and fault injection require dedicated masking and verification defenses that carry real cycle, memory, and randomness costs.

### The Key Takeaway

Passing mathematical correctness tests (ACVP) is only the starting line. Verify constant-time behavior on compiled binaries, enforce FIPS 203 implicit rejection without error oracles, budget masking around non-linear bottlenecks (Keccak and A2B/B2A conversions) plus redundant verification for faults, and demand concrete TVLA, FIPS 140-3, and EUCC AVA_VAN evidence rather than marketing claims.

### What's Happening

Following the September 2026 transition of FIPS 140-2 to Historical status, cryptographic module evaluations center on FIPS 140-3 (ISO/IEC 19790 / NIST SP 800-140F / IG PQC) and EUCC (`AVA_VAN.4`/`AVA_VAN.5`), making reproducible side-channel and fault-resistance evidence essential for production PQC deployments.
