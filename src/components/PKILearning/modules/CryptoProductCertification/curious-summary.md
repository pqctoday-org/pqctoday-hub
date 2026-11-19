### What This Is About

Security products such as hardware security modules (HSMs) carry certificates: FIPS 140-3 in the US and Canada, Common Criteria internationally, EUCC in the European Union, and PCI approval for payment devices. This module explains what each certificate proves, why you read what a certificate covers before its level, and what happens when a certified product adds post-quantum cryptography. Three follow-on modules go deeper: into FIPS 140-3; into Common Criteria, EUCC and eIDAS; and into PCI.

### Why It Matters

A certificate covers something narrow: a defined product, at a specific version and configuration, checked against one scheme's rules. Adding new algorithms changes the product, and every scheme has its own route for handling that change. Reading a certificate wrongly leads to buying — or selling — protection that was never certified.

### The Key Takeaway

Read what a certificate covers before you read its grade. A deadline to move to post-quantum cryptography makes the work urgent, but it does not make certification faster or skip any step.

- **ACVP KAT Vector Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`). CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B); non-invasive (side-channel) requirements are currently N/A by default. Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: When reading a production certificate, a useful check is: the certificate or module number and its status (active, historical or revoked); the exact module or product name and version; the tested operational environment or configuration (CMVP: Security Policy; CC: evaluated configuration in the certification report); the CAVP algorithm certificate numbers listed for the algorithms you rely on; and, for CC/EUCC, the Security Target and assurance level it claims. This is Hub practice guidance, not a certification-scheme requirement. A sample Hub exercise export or a vendor marketing datasheet is never certification evidence.

### What's Happening

As of November 2026, FIPS 140-2 certificates moved to the CMVP Historical list in September 2026 while FIPS 140-3 itself is unchanged, NIST published final NIST IR 8547 (October 2026) deprecating quantum-vulnerable public-key algorithms after 2030 and disallowing them under NIST standards after 2035, the EU's EUCC scheme already lists post-quantum algorithms in its approved cryptography guidance (ECCG ACM v2), and PCI's newest HSM standard (PTS HSM v5.0) adds post-quantum definitions without naming a required algorithm or deadline.
