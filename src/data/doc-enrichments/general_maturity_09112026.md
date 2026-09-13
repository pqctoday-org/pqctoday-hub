---
generated: 2026-09-11
category: Technical Standards
document_count: 1
requirement_count: 3
---

## BIP-32
- **Source**: BIP-32: Hierarchical Deterministic Wallets
- **URL**: https://raw.githubusercontent.com/bitcoin/bips/master/bip-0032.mediawiki
- **Requirement count**: 3
- **Lifecycle / CLM**:
    - _T3 Repeatable · keys_: Verify that the X coordinate in imported extended public key data corresponds to a point on the curve; reject the key if invalid.
    - _T3 Repeatable · keys_: Generate master keys from a seed byte sequence of 128 to 512 bits (256 bits advised) using a (P)RNG, rather than generating keys directly.
    - _T3 Repeatable · keys_: Use hardened derivation for account-level keys to ensure that leakage of account-specific private keys does not compromise the master key or other accounts.
