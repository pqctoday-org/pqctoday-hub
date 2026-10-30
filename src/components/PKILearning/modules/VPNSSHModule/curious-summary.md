### What This Is About

VPN and SSH protocols are upgrading their key exchanges to Post-Quantum Cryptography using ML-KEM. For instance, recent OpenSSH versions already ship with hybrid modes like `mlkem768x25519-sha256` to secure sessions against future decryption.

### Why It Matters

PQC keys are vastly larger than classical ones. Integrating ML-KEM-768 adds over 1KB per exchange. In highly optimized, lightweight protocols like WireGuard, adding post-quantum protection via Rosenpass (which uses Classic McEliece and the round-3 Kyber, not FIPS 203 ML-KEM) adds four extra Rosenpass messages of 2,464 bytes in total (per the Rosenpass white paper), which raises the risk of UDP IP fragmentation.

### The Key Takeaway

This complex migration strictly targets the "Control Plane" (Key Exchange and Authentication). The "Data Plane" (the actual encrypted tunnel) uses symmetric ciphers like AES-GCM or ChaCha20, which are affected by Grover's algorithm rather than Shor's; per NIST, AES with a minimum key length of 128 bits can continue to be used, and a longer key can be considered for data that must remain secure for many years.

### What's Happening

OpenSSH already ships with hybrid PQC key exchange (mlkem768x25519-sha256) enabled by default, and the IETF drafts for ML-KEM and ML-DSA in IKEv2 are in the RFC Editor queue (October 2026). WireGuard users can add quantum protection through the Rosenpass companion tool.
