### What This Is About

Testing post-quantum cryptography is fundamentally different from classical crypto. Strategies must account for significant performance cliffs (driven by larger certificate sizes and TCP overhead), interoperability fragility during hybrid handshakes, and hardware implementation leakage.

### Why It Matters

A single fixed-versus-random Test Vector Leakage Assessment (TVLA) test is not enough for lattice-based PQC: it flags any input-dependent difference, including leakage of public data such as ciphertexts, so labs add specific tests on the steps that handle secrets. Unmasked PQC implementations are highly vulnerable to power-analysis side-channel attacks, especially during the Number Theoretic Transform (NTT) stage.

### The Key Takeaway

Successful PQC validation requires a layered approach: passive discovery for safe inventorying, active scanning for endpoint readiness, and rigorous hybrid interoperability testing, ensuring that fallback paths don't silently compromise security.

- **ACVP KAT Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`), whereas CMVP FIPS 140-3 and Common Criteria (`CC/EUCC`) validate the cryptographic module boundary, physical/logical isolation, RNG health tests (SP 800-90B), key zeroization, and side-channel protections.
- **Certificate Evidence-Chain Cross-Check vs. Sample Non-Equivalence**: An auditor or engineering lead must cross-check `Operational Environment (OE)`, `CAVP Algorithm Cert #`, `CMVP Module Cert #`, `Tested Version/Commit`, and `Security Target SHA-256` on a production CAVP/CMVP/CC certificate, whereas a sample Hub exercise or vendor marketing datasheet is never certification evidence.

### What's Happening

Testing frameworks are evolving to address PQC-specific challenges like lattice side-channel leakage and hybrid handshake interoperability, with organizations adopting layered validation strategies combining passive discovery, active scanning, and hybrid interoperability testing.
