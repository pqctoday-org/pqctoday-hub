---
generated: 2026-10-17
category: Certification Schemes
document_count: 1
requirement_count: 6
---

## BSI TR-02102-1
- **Source**: Cryptographic Mechanisms: Recommendations and Key Lengths
- **URL**: https://www.bsi.bund.de/SharedDocs/Downloads/EN/BSI/Publications/TechGuidelines/TG02102/BSI-TR-02102-1.pdf
- **Requirement count**: 6
- **Assurance / FIPS**:
    - _T3 Repeatable · all_: Ensure that random number generators used for cryptographic purposes are drawn from the recommended classes (e.g., DRG.3, NTG.1) and conform to the AIS 20/31 evaluation methodology; PTG.2 is no longer recommended for general use.
    - _T3 Repeatable · keys_: Use only recommended key-derivation functions and hybridisation mechanisms; derive password-based keys with Argon2id and apply recommended key derivation after key exchange.
    - _T3 Repeatable · libraries_: Account for implementation aspects (side-channel resistance, secure implementation) when procuring or deploying cryptographic modules; require side-channel-hardened implementations per the guideline.
- **Governance**:
    - _T2 Risk-Informed · all_: Maintain a documented, management-approved cryptographic policy anchored to BSI recommended mechanisms, key lengths and a defined security level of at least 120 bits; select algorithms and parameters (symmetric, hash, MAC, signature, KEM)…
- **Inventory**:
    - _T3 Repeatable · keys_: Maintain a cryptographic inventory sufficient to identify where RSA, DH, ECC and other classical asymmetric mechanisms and their key lengths are deployed, so equivalent-key-length thresholds and transitional deadlines (e.g., RSA 2000-bit t…
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Plan and execute migration from classical-only asymmetric mechanisms to quantum-safe or hybrid mechanisms (ML-KEM, FrodoKEM, Classic McEliece, HQC; ML-DSA, SLH-DSA, LMS/XMSS) within the published migration periods, with sole use of classic…
