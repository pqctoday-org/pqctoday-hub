### What This Is About

Testing post-quantum cryptography is fundamentally different from classical crypto. Strategies must account for significant performance cliffs (driven by larger certificate sizes and TCP overhead), interoperability fragility during hybrid handshakes, and hardware implementation leakage.

### Why It Matters

Classical Test Vector Leakage Assessment (TVLA) fails for lattice-based PQC because public and private keys are mathematically locked together. Unmasked PQC implementations are highly vulnerable to power-analysis side-channel attacks, especially during the Number Theoretic Transform (NTT) stage.

### The Key Takeaway

Successful PQC validation requires a layered approach: passive discovery for safe inventorying, active scanning for endpoint readiness, and rigorous interoperability testing conforming to RFC 9794 hybrid rules, ensuring that fallback paths don't silently compromise security.
