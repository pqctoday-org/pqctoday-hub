# Decommissioning & Program Closure — In Simple Terms

## What This Is About

This is the end of a post-quantum migration: turning off the old, quantum-vulnerable cryptography and formally winding the program down. Both steps are surprisingly easy to skip — teams report systems as "done" on a ticket, and programs quietly drift on without ever closing.

## Why It Matters

A migration isn't finished when you add post-quantum cryptography — it's finished when the old RSA/ECC keys are actually gone, on a defensible schedule (under NIST's timeline, the old cryptography is set to be deprecated after 2030 and disallowed after 2035). And you only really know it happened if you can see it in the system's behaviour — for example, capturing the connection handshake and confirming it negotiated a post-quantum algorithm — rather than trusting a change ticket.

## The Key Takeaway

Close deliberately. Verify the highest-value systems completely and sample the rest; remove and then confirm-removed the old cryptography; and hand every ongoing responsibility (the crypto inventory, vendor monitoring, security detections, reporting) to a named permanent owner, accepting any leftover risk on the record. Then the program can formally end instead of fading away.

- **ACVP KAT Conformance vs. Module Boundary Validation**: NIST CAVP ACVP JSON test vectors verify mathematical algorithm conformance of an implementation under test (`IUT`). CMVP FIPS 140-3 validates a cryptographic module against its security requirements (module specification and boundary, interfaces, self-tests, key and SSP zeroization, physical security, with entropy sources validated separately under SP 800-90B); non-invasive (side-channel) requirements are currently N/A by default. Common Criteria/EUCC evaluates the product against its own Security Target, and only what the ST claims.
- **Evidence-Chain Verification vs. Sample Non-Equivalence**: When reading a production certificate, a useful check is: the certificate or module number and its status (active, historical or revoked); the exact module or product name and version; the tested operational environment or configuration (CMVP: Security Policy; CC: evaluated configuration in the certification report); the CAVP algorithm certificate numbers listed for the algorithms you rely on; and, for CC/EUCC, the Security Target and assurance level it claims. This is Hub practice guidance, not a certification-scheme requirement. A sample Hub exercise export or a vendor marketing datasheet is never certification evidence.
