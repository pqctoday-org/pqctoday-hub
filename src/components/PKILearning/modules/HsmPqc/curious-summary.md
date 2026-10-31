# HSM & PQC Operations — In Simple Terms

## What This Is About

Hardware Security Modules (HSMs) are physical, highly secure, tamper-resistant devices that protect a network's most sensitive cryptographic keys (meeting standards like FIPS 140-3). PKCS#11 v3.2, an OASIS Standard since June 2026, defines how these devices handle Post-Quantum Cryptography.

## Why It Matters

Classical cryptography used tiny memory buffers. For example, ECDSA uses roughly 64 bytes, while ML-KEM-768 requires 1,184 bytes. If an HSM isn't specifically upgraded to handle PQC, its internal buffers will instantly overflow. Additionally, new stateful signatures (like LMS) require atomic NVRAM writes to track every single signature made, making HSMs the only truly safe platform to run them.

Checking a PQC-capable HSM means checking four different things: NIST's algorithm tests (CAVP), the module's own certificate and its Security Policy (CMVP), the self-tests the module runs on its own algorithms and key pairs, and the submission route a firmware update takes. Passing the algorithm tests does not make a product validated, and firmware that runs ML-KEM or ML-DSA in a non-approved mode does not need the self-tests a validated approved mode needs. Under NIST's CMVP Management Manual, adding PQC to a validated module is an Update only if each category of security change stays under 30%; otherwise it is a full submission.

## The Key Takeaway

The physical hardware upgrades are happening right now. Major on-premise HSM vendors (such as Thales, Entrust, and Utimaco) already ship PQC firmware updates, though the algorithms each one supports differ (Thales's Luna Post Quantum Algorithms page lists ML-KEM, ML-DSA and LMS-HSS, and that page and its v7.9 release post do not list SLH-DSA; Utimaco's Quantum Protect page shows SLH-DSA as in progress; Entrust's nShield release notes describe SLH-DSA), the programming interface can trail the firmware (Entrust's release notes list ML-DSA in its PKCS#11 interface from Security World v13.9.0, ML-KEM from Security World v13.9.3 and SLH-DSA from v13.9.5, after describing ML-KEM and SLH-DSA in v13.9.0 as available only through its native nCore interface), and only some of their FIPS 140 certificates list PQC algorithms yet (Thales Luna T7 certificate #5450 lists ML-KEM, ML-DSA and LMS; Entrust nShield 5s certificates #5329 and #4745 list none). Cloud HSMs are uneven: AWS CloudHSM documents ML-DSA key generation and signing in the cluster. AWS documents ML-DSA as available in FIPS mode on hsm2m.medium clusters from 1 September 2026, while the NIST Security Policy for CMVP certificate #4703, the certificate AWS lists for hsm2m.medium, lists ML-DSA and ML-KEM as non-approved (not allowed in the approved mode of operation) and the certificate lists no PQC algorithm; the two statements have not been reconciled. Google lists its post-quantum algorithms for software keys only, none for HSM keys.

## What's Happening

PKCS#11 v3.2, an OASIS Standard since June 2026, standardizes how applications call HSMs for ML-KEM encapsulation, ML-DSA and SLH-DSA signatures, and stateful hash-based signatures, while vendors add each algorithm to their firmware and then to their programming interface release by release.
