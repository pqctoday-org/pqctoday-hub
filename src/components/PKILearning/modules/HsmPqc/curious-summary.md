# HSM & PQC Operations — In Simple Terms

## What This Is About

Hardware Security Modules (HSMs) are physical, highly secure, tamper-resistant devices that protect a network's most sensitive cryptographic keys (meeting standards like FIPS 140-3). PKCS#11 v3.2, an OASIS Standard since June 2026, defines how these devices handle Post-Quantum Cryptography.

## Why It Matters

Classical cryptography used tiny memory buffers. For example, ECDSA uses roughly 64 bytes, while ML-KEM-768 requires 1,184 bytes. If an HSM isn't specifically upgraded to handle PQC, its internal buffers will instantly overflow. Additionally, new stateful signatures (like LMS) require atomic NVRAM writes to track every single signature made, making HSMs the only truly safe platform to run them.

Checking a PQC-capable HSM means checking four different things: NIST's algorithm tests (CAVP), the module's own certificate and its Security Policy (CMVP), the self-tests the module runs on its own algorithms and key pairs, and the submission route a firmware update takes. Passing the algorithm tests does not make a product validated, and firmware that runs ML-KEM or ML-DSA in a non-approved mode does not need the self-tests a validated approved mode needs. Under NIST's CMVP Management Manual, adding PQC to a validated module is an Update only if each category of security change stays under 30%; otherwise it is a full submission.

## The Key Takeaway

The physical hardware upgrades are happening right now. Major on-premise HSM vendors (such as Thales, Entrust, and Utimaco) already ship PQC firmware updates, though the algorithms each one supports differ (Thales and Utimaco do not yet offer SLH-DSA, for example), the programming interface can trail the firmware (Entrust's nShield exposed ML-DSA through PKCS#11 first, then ML-KEM from Security World v13.9.3 and SLH-DSA from v13.9.5, after both were available through its native nCore interface), and only some of their FIPS 140 certificates list PQC algorithms yet. Cloud HSMs are uneven: AWS CloudHSM creates and uses ML-DSA signing keys inside the HSM. AWS says ML-DSA is available in FIPS mode, while the NIST Security Policy for the same module lists ML-DSA and ML-KEM as non-approved services and its certificate lists no PQC algorithm; the two statements have not been reconciled. Google lists its post-quantum algorithms for software keys only, none for HSM keys (checked October 2026).

## What's Happening

PKCS#11 v3.2, an OASIS Standard since June 2026, standardizes how applications call HSMs for ML-KEM encapsulation, ML-DSA and SLH-DSA signatures, and stateful hash-based signatures, while vendors add each algorithm to their firmware and then to their programming interface release by release.
