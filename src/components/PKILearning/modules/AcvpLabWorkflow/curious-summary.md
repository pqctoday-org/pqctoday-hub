### What This Is About

Before a cryptographic product can be sold to many governments and regulated buyers, its algorithms are tested by an automated NIST system and the whole product is examined by an accredited laboratory. This module explains, step by step, how that algorithm testing works and what each kind of test result does — and does not — prove.

### Why It Matters

"It passed the NIST tests" can mean very different things: a run against public sample data anyone can download, a run against test data issued to an accredited lab, or an official validation certificate. Mixing them up leads to claims nobody can back.

### The Key Takeaway

Every test result is evidence only for the exact test, settings, software build and machine it ran on. Only NIST publishes validations; running public samples, including on this site, never does.

- **ACVP KAT Vector Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`), whereas CMVP FIPS 140-3 and Common Criteria (`CC/EUCC`) validate the cryptographic module boundary, physical/logical isolation, RNG health tests (SP 800-90B), key zeroization, and side-channel protections.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: An auditor or engineering lead must cross-check five binding fields on a production CAVP/CMVP/CC certificate — `Operational Environment (OE)`, `CAVP Algorithm Cert #`, `CMVP Module Cert #`, `Tested Version/Commit`, and `Security Target SHA-256` — whereas a sample Hub exercise export or vendor marketing datasheet is never certification evidence.

### What's Happening

The PQC Today owner reviewed and signed off this module on 1 November 2026. No accredited laboratory or certification body has reviewed it. It explains how laboratory testing works; it is not laboratory training material.
