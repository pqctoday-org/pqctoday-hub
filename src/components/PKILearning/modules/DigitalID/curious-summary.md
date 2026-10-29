### What This Is About

The eIDAS 2.0 regulation mandates that all 27 EU member states provide citizens with a European Digital Identity (EUDI) Wallet by 2026. These wallets use formats like mdoc and SD-JWT to allow selective disclosure of attributes (e.g., proving age without revealing a birthplace) across a pan-European trust framework.

### Why It Matters

Current EUDI implementations are secured by classical ECDSA (P-256) signatures for issuing attestations and binding identities to devices. If an attacker leverages a quantum computer to forge these signatures, they can create perfectly valid but counterfeit credentials, enabling total identity impersonation and fraud across the entire European Union.

### The Key Takeaway

Because digital identities represent high-value targets, national wallet infrastructures are strong candidates to adopt PQC early. Nothing in eIDAS 2.0 or the current reference framework requires it yet, but NIST algorithms like ML-DSA and SLH-DSA are available to protect long-lived credentials against Harvest Now, Decrypt Later threats.

### What's Happening

The eIDAS 2.0 framework requires all 27 EU member states to deploy EUDI Wallets by 2026, so the choice of signature algorithm is being made now. Quantum-safe signatures (ML-DSA and SLH-DSA) are not required yet, and ETSI says its cryptographic suites specification is still incomplete for the EUDI Wallet, with an update in preparation.
