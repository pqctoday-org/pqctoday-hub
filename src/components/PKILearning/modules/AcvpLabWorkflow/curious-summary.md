### What This Is About

Before a cryptographic product can be sold to many governments and regulated buyers, its algorithms are tested by an automated NIST system and the whole product is examined by an accredited laboratory. This module explains, step by step, how that algorithm testing works and what each kind of test result does — and does not — prove.

### Why It Matters

"It passed the NIST tests" can mean very different things: a run against public sample data anyone can download, a run against test data issued to an accredited lab, or an official validation certificate. Mixing them up leads to claims nobody can back.

### The Key Takeaway

Every test result is evidence only for the exact test, settings, software build and machine it ran on. Only NIST publishes validations; running public samples, including on this site, never does.

- **ACVP KAT Vector Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify algorithm conformance of an implementation under test (`IUT`). CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B). Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: When reading a production certificate, a useful check is: the certificate or module number and its status (active, historical or revoked); the exact module or product name and version; the tested operational environment or configuration (CMVP: Security Policy; CC: evaluated configuration in the certification report); the CAVP algorithm certificate numbers listed for the algorithms you rely on; and, for CC/EUCC, the Security Target and assurance level it claims. This is Hub practice guidance, not a certification-scheme requirement. A sample Hub exercise export or a vendor marketing datasheet is never certification evidence.

### What's Happening

As of November 2026, NIST's ACVP protocol specification (`draft-ietf-acvp-spec-01`, 30 October 2026) and algorithm sub-specifications cover ML-KEM, ML-DSA and SLH-DSA using seed-driven `AFT` and `VAL` vector groups (distinct from classical `GDT` key-generation groups and SHA `MCT`/`LDT` groups). The PQC Today owner reviewed and signed off this module on 1 November 2026. No accredited laboratory or certification body has reviewed it. It explains how laboratory testing works; it is not laboratory training material.
