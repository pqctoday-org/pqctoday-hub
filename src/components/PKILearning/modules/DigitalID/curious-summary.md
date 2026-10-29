### What This Is About

The eIDAS 2.0 regulation mandates that all 27 EU member states provide citizens with a European Digital Identity (EUDI) Wallet by 2026. These wallets use formats like mdoc and SD-JWT to allow selective disclosure of attributes (e.g., proving age without revealing a birthplace) across a pan-European trust framework.

### Why It Matters

Current EUDI implementations are secured by classical ECDSA (P-256) signatures for issuing attestations and binding identities to devices. If an attacker leverages a quantum computer to forge these signatures, they can create perfectly valid but counterfeit credentials, enabling total identity impersonation and fraud across the entire European Union.

### The Key Takeaway

Because digital identities represent high-value targets, there is a case for national wallet infrastructures to plan for PQC early. As of October 2026, neither eIDAS 2.0 nor the EU reference framework for the wallet (the ARF) requires it, but NIST algorithms like ML-DSA and SLH-DSA, which are designed to resist a large-scale quantum computer, are available to sign long-lived credentials.

### What's Happening

The eIDAS 2.0 framework requires all 27 EU member states to deploy EUDI Wallets by 2026. As of October 2026, quantum-safe signatures (ML-DSA and SLH-DSA) are not required, and ETSI says its cryptographic suites specification (TS 119 312 V2.1.1, June 2026) is incomplete for the EUDI Wallet, with an update in preparation.
