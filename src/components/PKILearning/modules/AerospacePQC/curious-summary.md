### What This Is About

The aerospace sector manages communications across three totally distinct domains: the Ground segment (ATC and airlines), Airborne avionics (in-flight hardware), and the Space segment (satellites). While ground systems can be patched in weeks, airborne and satellite systems rely on certified cryptography (like DO-178C) embedded inside hardware that must operate faultlessly for 20 to 55 years.

### Why It Matters

Aircraft and satellites stay in service for decades, so the classical cryptography they carry (RSA-2048, ECDSA P-256) can span the quantum transition window. The command and telemetry uplinks of a satellite launched around 2028 can be recorded for later decryption ("Harvest Now, Decrypt Later"), and in this module's planning assumptions its hardware cannot be physically upgraded after launch. PQC signatures are also much larger than the messages of legacy aviation links: in the example of IACR ePrint 2024/046 an ECDSA signature of 448 bits is already four times an ADS-B message (112 bits), so a larger PQC signature cannot fit either. Space electronics also face radiation, and the module's single-event-upset (SEU) calculator treats a bit-flip in stored key material as a risk to key refresh intervals.

### The Key Takeaway

Aerospace PQC demands exceptional engineering. Legacy protocols require ground-based "gateway-mediated" wrappers, while only modern networks (like ARINC 664) have the bandwidth for native PQC execution. For ultra-constrained or highly radiated hardware, hash-based algorithms (LMS/XMSS) offer the most resilient solution, relying entirely on public data without the fragile vulnerability of massive lattice matrices.

### What's Happening

Aerospace certification bodies are updating airworthiness standards to accommodate PQC signature sizes, while satellite operators are evaluating hash-based algorithms (LMS/XMSS) for long-duration missions where hardware cannot be physically upgraded post-launch.
