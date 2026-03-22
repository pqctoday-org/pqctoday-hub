### What This Is About

The aerospace sector manages communications across three totally distinct domains: the Ground segment (ATC and airlines), Airborne avionics (in-flight hardware), and the Space segment (satellites). While ground systems can be patched in weeks, airborne and satellite systems rely on certified cryptography (like DO-178C) embedded inside hardware that must operate faultlessly for 20 to 55 years.

### Why It Matters

Because an aircraft or satellite deployed today will still be operational in 2055, their classical cryptography (RSA-2048, ECDSA P-256) spans entirely across the quantum transition window. Satellites launched in 2028 are severely exposed to "Harvest Now, Decrypt Later" threats on their command and telemetry uplinks, yet their hardware cannot be physically upgraded post-launch. Furthermore, the massive size of PQC signatures (ML-DSA) completely breaks legacy aviation protocols like ACARS and ADS-B, and space electronics face cosmic radiation where a single bit-flip (SEU) in a lattice-based private key can corrupt all subsequent operations.

### The Key Takeaway

Aerospace PQC demands exceptional engineering. Legacy protocols require ground-based "gateway-mediated" wrappers, while only modern networks (like ARINC 664) have the bandwidth for native PQC execution. For ultra-constrained or highly radiated hardware, hash-based algorithms (LMS/XMSS) offer the most resilient solution, relying entirely on public data without the fragile vulnerability of massive lattice matrices.
