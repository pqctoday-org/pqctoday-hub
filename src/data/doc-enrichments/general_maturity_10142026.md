---
generated: 2026-10-14
category: Technical Standards
document_count: 1
requirement_count: 3
---

## IACR-ePrint-2024-116
- **Source**: On the practical CPAD security of “exact” and threshold FHE schemes and libraries
- **URL**: https://eprint.iacr.org/2024/116
- **Requirement count**: 3
- **Assurance / FIPS**:
    - _T3 Repeatable · libraries_: Enforce systematic addition of smudging noise with proper standard deviation in threshold FHE implementations to prevent CPAD attacks.
    - _T3 Repeatable · libraries_: Ensure noise smudging is not optional in FHE threshold scheme implementations to act as an effective countermeasure against CPAD adversaries.
    - _T3 Repeatable · libraries_: Integrate noise deviation monitoring and blocked decryption into the cryptosystem specification to prevent CPAD attackers from working around limits.
