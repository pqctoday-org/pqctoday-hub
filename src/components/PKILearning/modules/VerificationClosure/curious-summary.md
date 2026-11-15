# Decommissioning & Program Closure — In Simple Terms

## What This Is About

This is the end of a post-quantum migration: turning off the old, quantum-vulnerable cryptography and formally winding the program down. Both steps are surprisingly easy to skip — teams report systems as "done" on a ticket, and programs quietly drift on without ever closing.

## Why It Matters

A migration isn't finished when you add post-quantum cryptography — it's finished when the old RSA/ECC keys are actually gone, on a defensible schedule (under NIST's timeline, the old cryptography is set to be deprecated after 2030 and disallowed after 2035). And you only really know it happened if you can see it in the system's behaviour — for example, capturing the connection handshake and confirming it negotiated a post-quantum algorithm — rather than trusting a change ticket.

## The Key Takeaway

Close deliberately. Verify the highest-value systems completely and sample the rest; remove and then confirm-removed the old cryptography; and hand every ongoing responsibility (the crypto inventory, vendor monitoring, security detections, reporting) to a named permanent owner, accepting any leftover risk on the record. Then the program can formally end instead of fading away.

- **ACVP KAT Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`), whereas CMVP FIPS 140-3 and Common Criteria (`CC/EUCC`) validate the cryptographic module boundary, physical/logical isolation, RNG health tests (SP 800-90B), key zeroization, and side-channel protections.
- **Evidence-Chain Verification vs. Sample Non-Equivalence**: An auditor or engineering lead closing a migration dossier must cross-check `Operational Environment (OE)`, `CAVP Algorithm Cert #`, `CMVP Module Cert #`, `Tested Version/Commit`, and `Security Target SHA-256` on a production CAVP/CMVP/CC certificate; a sample Hub exercise export or vendor marketing datasheet is never certification evidence.
