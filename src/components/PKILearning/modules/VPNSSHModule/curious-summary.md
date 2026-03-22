### What This Is About

VPN and SSH protocols are upgrading their key exchanges to Post-Quantum Cryptography using ML-KEM. For instance, recent OpenSSH versions already ship with hybrid modes like `mlkem768x25519-sha256` to secure sessions against future decryption.

### Why It Matters

PQC keys are vastly larger than classical ones. Integrating ML-KEM-768 adds over 1KB per exchange. In highly optimized, lightweight protocols like WireGuard, adding PQC (such as via Rosenpass) results in a staggering 22x increase in handshake size, introducing severe risks of UDP IP fragmentation.

### The Key Takeaway

This complex migration strictly targets the "Control Plane" (Key Exchange and Authentication). The "Data Plane" (the actual encrypted tunnel) already uses symmetric ciphers like AES-GCM or ChaCha20, which are natively quantum-resistant at 256-bit strengths.
