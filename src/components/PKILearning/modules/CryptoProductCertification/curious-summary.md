### What This Is About

Security products such as hardware security modules (HSMs) carry certificates: FIPS 140-3 in the US and Canada, Common Criteria internationally, EUCC in the European Union, and PCI approval for payment devices. This module explains what each certificate proves, why you read what a certificate covers before its level, and what happens when a certified product adds post-quantum cryptography. Three follow-on modules go deeper: into FIPS 140-3; into Common Criteria, EUCC and eIDAS; and into PCI.

### Why It Matters

A certificate covers something narrow: a defined product, at a specific version and configuration, checked against one scheme's rules. Adding new algorithms changes the product, and every scheme has its own route for handling that change. Reading a certificate wrongly leads to buying — or selling — protection that was never certified.

### The Key Takeaway

Read what a certificate covers before you read its grade. A deadline to move to post-quantum cryptography makes the work urgent, but it does not make certification faster or skip any step.

- **ACVP KAT Vector Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`), whereas CMVP FIPS 140-3 and Common Criteria (`CC/EUCC`) validate the cryptographic module boundary, physical/logical isolation, RNG health tests (SP 800-90B), key zeroization, and side-channel protections.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: An auditor or engineering lead must cross-check `Operational Environment (OE)`, `CAVP Algorithm Cert #`, `CMVP Module Cert #`, `Tested Version/Commit`, and `Security Target SHA-256` on a production CAVP/CMVP/CC certificate; a sample Hub exercise export or vendor marketing datasheet is never certification evidence.

### What's Happening

As of 22 October 2026, the FIPS 140-3 standard itself is unchanged, the EU's scheme already lists post-quantum algorithms in its approved cryptography guidance, and PCI's newest HSM standard adds post-quantum definitions without naming a required algorithm or deadline.
