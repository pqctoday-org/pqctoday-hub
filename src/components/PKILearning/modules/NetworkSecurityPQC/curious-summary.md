### What This Is About

Post-quantum cryptography fundamentally alters network security operations across the entire enterprise stack. Quantum-safe signature certificates (like ML-DSA) are much larger than their classical counterparts: FIPS 204 lists a 1,952-byte public key and a 3,309-byte signature at ML-DSA-65, and in one IETF draft example a two-certificate ML-DSA-65 TLS chain is 11,869 bytes against 2,656 bytes for an RSA chain. Key exchanges also become heavier and more complex.

### Why It Matters

Because PQC artifacts are so large, they severely stress modern firewalls and Deep Packet Inspection (DPI) appliances. Many middleboxes, including firewalls and other inspection devices, have hardcoded buffer sizes or parsing assumptions that break with PQC-sized handshakes and certificates, so each one needs testing. Furthermore, software-only DPI CPU costs increase significantly, and legacy IDS/IPS signatures cannot parse hybrid KEM codepoints.

### The Key Takeaway

In this module's suggested order, Zero Trust Network Access (ZTNA) Identity Providers come first for migration, as a compromised IdP invalidates all access. Network teams should plan for added inspection latency (the module's simulator shows about 35ms for pure PQC, an illustrative setting rather than a measurement) and evaluate vendor PQC roadmaps before deploying hybrid traffic across inline security boundaries.

### What's Happening

Firewall and DPI appliance vendors are releasing firmware updates to handle larger PQC certificate chains, while network teams are testing hybrid TLS deployments and recalibrating inspection latency baselines to accommodate the increased processing overhead of quantum-safe traffic.
