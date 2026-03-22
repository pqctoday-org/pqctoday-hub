# Entropy & PQC — In Simple Terms

## What This Is About
Cryptographic security depends on the quality of randomness, known as entropy. A perfectly designed cryptographic algorithm is essentially worthless if the underlying random number generator (RNG) used to pick the keys is predictable.

## Why It Matters
Predictable random seeds lead to total key recovery attacks. In Post-Quantum Cryptography, standard algorithms like ML-KEM (FIPS 203) and ML-DSA (FIPS 204) strictly require exactly 32 bytes of full entropy to generate their seeds securely. Furthermore, if random numbers repeat during the generation of Stateful Signatures (like LMS or XMSS), it causes catastrophic tree security failures.

## The Key Takeaway
Current Hardware Random Number Generators (TRNGs) are actually already quantum-safe because they rely on physical, unpredictable noise processes, rather than computational math assumptions. The core challenge is ensuring these physical sources are properly conditioned, tested, and combined without bias.

## What's Happening
NIST explicitly defines how to test and combine these random sources through the SP 800-90 standards. Additionally, the NIST Entropy Source Validation (ESV) program provides formal certification for these sources to guarantee they meet the strict 256-bit security strength required to power high-level PQC operations.
