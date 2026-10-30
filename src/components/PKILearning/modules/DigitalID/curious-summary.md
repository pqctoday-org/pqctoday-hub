### What This Is About

The eIDAS 2.0 regulation mandates that all 27 EU member states provide citizens with a European Digital Identity (EUDI) Wallet by 2026. These wallets use formats like mdoc and SD-JWT to allow selective disclosure of attributes (e.g., proving age without revealing a birthplace) across a pan-European trust framework.

### Why It Matters

The OpenID4VP and OpenID4VCI specifications use classical ECDSA (P-256) signatures in most of their examples for issuing attestations and binding identities to devices. If an attacker leverages a quantum computer to forge these signatures, they can create perfectly valid but counterfeit credentials, enabling total identity impersonation and fraud across the entire European Union.

### The Key Takeaway

The text of eIDAS 2.0 and of the EUDI wallet Architecture and Reference Framework (ARF) that we checked contains no occurrence of “quantum.” FIPS 204 says ML-DSA is believed to be secure against adversaries with a large-scale quantum computer, and FIPS 205 says SLH-DSA is designed to resist attacks from one.

### What's Happening

The eIDAS 2.0 framework requires all 27 EU member states to deploy EUDI Wallets by 2026. As of October 2026, quantum-safe signatures (ML-DSA and SLH-DSA) are not required, and ETSI says its cryptographic suites specification (TS 119 312 V2.1.1, June 2026) is incomplete for the EUDI Wallet, with an update in preparation.
