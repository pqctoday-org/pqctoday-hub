### What This Is About

Stateful hash-based signatures (LMS and XMSS) derive their security only from the security of their underlying hash functions like SHA-256, not from newer mathematical assumptions like lattices or isogenies.

### Why It Matters

Because each One-Time Signature (OTS) key in the Merkle tree can only be used safely once, the signer must track a monotonic state counter. Reusing the same leaf index for two different messages guarantees a catastrophic security failure, allowing an attacker to forge signatures.

### The Key Takeaway

Stateful signatures are among the most conservative post-quantum designs: NIST standardized them in SP 800-208, and NSA's CNSA 2.0 approves LMS and XMSS for signing firmware and software (it prefers LMS with SHA-256/192, and ML-DSA-87 is also allowed for that use). However, they require flawless state management, for which a monotonic counter from some hardware cryptographic modules can help when available.

### What's Happening

LMS and XMSS are already standardized under NIST SP 800-208.

### How It Is Tested

A certificate for a module that signs with LMS or XMSS rests on four checks. NIST publishes an algorithm test for LMS (key generation, signing and verification) but no ACVP specification for XMSS, XMSS^MT or HSS, and the test does not check whether a private key can be exported or a one-time key reused. The module also runs its own self-tests before first use. SP 800-208 requires key generation and signing to stay inside a validated hardware module with Level 3 or higher physical security and no export of private keys; a module that only verifies signatures does not have to meet those hardware rules. For national security systems, NSA's CNSA 2.0 FAQ says a product that only verifies signatures needs algorithm testing (CAVP) alone, while a signer that is itself a national security system must use CMVP-validated hardware, with no waivers. NSA allows LMS and XMSS (all parameters, LMS with SHA-256/192 recommended), not HSS or XMSS^MT, and says SLH-DSA is not approved for any use in national security systems.

In the workshop (Step 4) you can run NIST's published LMS verification samples (16 cases) and the RFC 8554 test cases through the in-browser engine; the page keeps these known-answer checks apart from the functional round trips, which only show that the engine accepts its own output. A match is a reference-sample match, not a validation.
