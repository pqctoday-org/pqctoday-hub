### What This Is About

The eIDAS 2.0 regulation mandates that all 27 EU member states provide citizens with a European Digital Identity (EUDI) Wallet by 2026. These wallets use formats like mdoc and SD-JWT to allow selective disclosure of attributes (e.g., proving age without revealing a birthplace) across a pan-European trust framework.

### Why It Matters

Current EUDI implementations are secured by classical ECDSA (P-256) signatures for issuing attestations and binding identities to devices. If an attacker leverages a quantum computer to forge these signatures, they can create perfectly valid but counterfeit credentials, enabling total identity impersonation and fraud across the entire European Union.

### The Key Takeaway

Because digital identities represent high-value targets, national wallet infrastructures must be among the first adopters of PQC. Future architecture frameworks must officially mandate NIST algorithms (like ML-DSA and SLH-DSA) to protect long-lived credentials against Harvest Now, Decrypt Later threats.
