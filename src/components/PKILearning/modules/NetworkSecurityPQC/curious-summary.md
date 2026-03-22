### What This Is About

Post-quantum cryptography fundamentally alters network security operations across the entire enterprise stack. Quantum-safe certificates (like ML-DSA) are 108% larger than their classical counterparts, resulting in 5-8KB hybrid TLS certificate chains and heavier, more complex key exchanges.

### Why It Matters

Because PQC artifacts are so large, they severely stress modern firewalls and Deep Packet Inspection (DPI) appliances. Older Next-Generation Firewalls (NGFWs) with fixed-size TLS buffers often fail silently (buffer overflows) when inspecting PQC traffic. Furthermore, software-only DPI CPU costs increase significantly, and legacy IDS/IPS signatures cannot parse hybrid KEM codepoints.

### The Key Takeaway

Zero Trust Network Access (ZTNA) Identity Providers are the highest priority for migration, as a compromised IdP invalidates all access. Network teams must immediately plan for 35ms inspection latency overhead and evaluate vendor PQC roadmaps before deploying hybrid traffic across inline security boundaries.
