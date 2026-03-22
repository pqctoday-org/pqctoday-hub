# Quantum Key Distribution — In Simple Terms

## What This Is About

Quantum Key Distribution (QKD) shares encryption keys using the fundamental laws of quantum physics—specifically the "no-cloning theorem"—rather than relying on difficult mathematical equations.

## Why It Matters

Standard Post-Quantum Cryptography relies on math problems that we _hope_ quantum computers cannot solve. QKD is entirely different: it offers "information-theoretic security" because measuring a quantum state physically disturbs it, immediately exposing any eavesdropper on the network.

## The Key Takeaway

Despite its immense security, QKD has severe physical limitations. Standard fiber optic cables max out at roughly 100 kilometers for QKD transmission. Extending this distance requires "trusted nodes" to relay the signal, but compromising any single node exposes all the keys.

## What's Happening

Governments are aggressively investing in QKD, with China maintaining a 2,000 km backbone and Micius satellite link. However, NIST remains highly skeptical of its real-world viability, officially recommending mathematical PQC (like FIPS 203) over QKD for almost all enterprise use cases.
