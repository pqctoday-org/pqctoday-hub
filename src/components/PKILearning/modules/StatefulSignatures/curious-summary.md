### What This Is About

Stateful hash-based signatures (LMS and XMSS) derive their security entirely from proven hash functions like SHA-256, rather than new, emerging mathematical assumptions like lattices or isogenies.

### Why It Matters

Because each One-Time Signature (OTS) key in the Merkle tree can only be used safely once, the signer must track a monotonic state counter. Reusing the same leaf index for two different messages guarantees a catastrophic security failure, allowing an attacker to forge signatures.

### The Key Takeaway

Stateful signatures are so secure they are already authorized by NIST and strictly mandated by NSA's CNSA 2.0 for firmware. However, they require flawless state management, almost always implemented inside a secure hardware module (HSM) with a non-volatile monotonic counter.
