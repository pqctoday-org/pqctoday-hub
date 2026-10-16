# HSM & PQC Operations — In Simple Terms

## What This Is About

Hardware Security Modules (HSMs) are physical, highly secure, tamper-resistant devices that protect a network's most sensitive cryptographic keys (meeting standards like FIPS 140-3). PKCS#11 v3.2, an OASIS Standard since June 2026, defines how these devices handle Post-Quantum Cryptography.

## Why It Matters

Classical cryptography used tiny memory buffers. For example, ECDSA uses roughly 64 bytes, while ML-KEM-768 requires 1,184 bytes. If an HSM isn't specifically upgraded to handle PQC, its internal buffers will instantly overflow. Additionally, new stateful signatures (like LMS) require atomic NVRAM writes to track every single signature made, making HSMs the only truly safe platform to run them.

## The Key Takeaway

The physical hardware upgrades are happening right now. Major on-premise HSM vendors (such as Thales, Entrust, and Utimaco) already offer production-ready PQC firmware updates. Cloud HSMs are uneven: AWS CloudHSM now creates and uses ML-DSA signing keys inside the HSM, while Google offers its post-quantum keys only in software for now (checked October 2026).

## What's Happening

The PKCS#11 v3.2 specification is being finalized to standardize how HSMs handle ML-KEM encapsulation, ML-DSA signatures, and stateful hash-based signature state management, while on-premise vendors continue to ship production PQC firmware ahead of their cloud counterparts.
