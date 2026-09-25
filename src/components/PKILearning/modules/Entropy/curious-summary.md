# Entropy & PQC — In Simple Terms

## What This Is About

Cryptographic security depends on the quality of randomness, known as entropy. A perfectly designed cryptographic algorithm is essentially worthless if the underlying random number generator (RNG) used to pick the keys is predictable.

## Why It Matters

Predictable random seeds lead to total key recovery attacks. The post-quantum standards spell out exactly which random values they draw: ML-KEM (FIPS 203) draws two 32-byte values to make a key pair and a fresh 32-byte value for every encapsulation, and ML-DSA (FIPS 204) draws one 32-byte seed to make a key pair. A 32-byte value is not the same thing as "256 bits of security". What the standards require is an approved random bit generator whose security strength matches the parameter set — for example, at least 192 bits for ML-KEM-768. Furthermore, if random numbers repeat during the generation of Stateful Signatures (like LMS or XMSS), it causes catastrophic tree security failures.

## The Key Takeaway

Hardware random number generators do not depend on math problems that a quantum computer could solve, so a quantum computer does not break them the way it breaks RSA. That does not make them automatically safe. What matters is whether the physical source really delivers the unpredictability claimed, which has to be measured, checked continuously while the device runs, and combined with the rest of the generator correctly.

## What's Happening

NIST's SP 800-90 series explains how to build and test these generators. NIST's Cryptographic Module Validation Program issues Entropy Validation Certificates to entropy sources after an accredited testing lab has shown that they meet SP 800-90B.
