### What This Is About

Testing post-quantum cryptography is fundamentally different from classical crypto. Strategies must account for significant performance cliffs (driven by larger certificate sizes and TCP overhead), interoperability fragility during hybrid handshakes, and hardware implementation leakage.

### Why It Matters

A single fixed-versus-random Test Vector Leakage Assessment (TVLA) test is not enough for lattice-based PQC: it flags any input-dependent difference, including leakage of public data such as ciphertexts, so labs add specific tests on the steps that handle secrets. Unmasked PQC implementations are highly vulnerable to power-analysis side-channel attacks, especially during the Number Theoretic Transform (NTT) stage.

### The Key Takeaway

Successful PQC validation requires a layered approach: passive discovery for safe inventorying, active scanning for endpoint readiness, and rigorous hybrid interoperability testing, ensuring that fallback paths don't silently compromise security.

- **ACVP KAT Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`). CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B); non-invasive (side-channel) requirements are currently N/A by default. Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: When reading a production certificate, a useful check is: the certificate or module number and its status (active, historical or revoked); the exact module or product name and version; the tested operational environment or configuration (CMVP: Security Policy; CC: evaluated configuration in the certification report); the CAVP algorithm certificate numbers listed for the algorithms you rely on; and, for CC/EUCC, the Security Target and assurance level it claims. This is Hub practice guidance, not a certification-scheme requirement. A sample Hub exercise export or a vendor marketing datasheet is never certification evidence.

### What's Happening

Testing frameworks are evolving to address PQC-specific challenges like lattice side-channel leakage and hybrid handshake interoperability, with organizations adopting layered validation strategies combining passive discovery, active scanning, and hybrid interoperability testing.
